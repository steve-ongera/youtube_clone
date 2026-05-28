from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    Video, Comment, VideoReaction, Subscription,
    WatchHistory, Playlist, PlaylistItem, Category,
)
from .serializers import (
    RegisterSerializer, UserProfileSerializer,
    VideoListSerializer, VideoDetailSerializer, VideoUploadSerializer,
    CommentSerializer, VideoReactionSerializer,
    WatchHistorySerializer, PlaylistSerializer, CategorySerializer,
)

User = get_user_model()


# ─── Auth ─────────────────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — create a new user account."""
    queryset         = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


# ─── Users / Channels ────────────────────────────────────────────────────────

class UserProfileView(generics.RetrieveUpdateAPIView):
    """GET/PUT /api/channels/<pk>/ — view or update a channel profile."""
    queryset           = User.objects.all()
    serializer_class   = UserProfileSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_object(self):
        return get_object_or_404(User, pk=self.kwargs["pk"])


class MeView(generics.RetrieveUpdateAPIView):
    """GET/PUT /api/me/ — current user's own profile."""
    serializer_class   = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def subscribe_toggle(request, pk):
    """POST /api/channels/<pk>/subscribe/ — subscribe or unsubscribe."""
    channel = get_object_or_404(User, pk=pk)
    if channel == request.user:
        return Response({"detail": "Cannot subscribe to yourself."}, status=400)

    sub, created = Subscription.objects.get_or_create(
        subscriber=request.user, channel=channel
    )
    if not created:
        sub.delete()
        return Response({"subscribed": False, "subscriber_count": channel.subscribers.count()})

    return Response(
        {"subscribed": True, "subscriber_count": channel.subscribers.count()},
        status=status.HTTP_201_CREATED,
    )


class ChannelVideosView(generics.ListAPIView):
    """GET /api/channels/<pk>/videos/ — public videos by a channel."""
    serializer_class   = VideoListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Video.objects.filter(
            uploader_id=self.kwargs["pk"], visibility="public"
        )


# ─── Videos ──────────────────────────────────────────────────────────────────

class VideoListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/videos/ — paginated public video feed with search & filter.
    POST /api/videos/ — upload a new video (auth required).
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes     = [MultiPartParser, FormParser]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ["category__slug", "visibility", "uploader__username"]
    search_fields      = ["title", "description", "tags__name"]
    ordering_fields    = ["created_at", "views", "like_count"]
    ordering           = ["-created_at"]

    def get_queryset(self):
        return Video.objects.filter(visibility="public").select_related(
            "uploader", "category"
        ).prefetch_related("tags", "reactions")

    def get_serializer_class(self):
        return VideoUploadSerializer if self.request.method == "POST" else VideoListSerializer

    def perform_create(self, serializer):
        serializer.save(uploader=self.request.user)


class VideoDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/DELETE /api/videos/<pk>/"""
    queryset           = Video.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return VideoUploadSerializer
        return VideoDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        video = self.get_object()
        video.increment_views()

        # Track watch history for authenticated users
        if request.user.is_authenticated:
            WatchHistory.objects.update_or_create(
                user=request.user, video=video,
                defaults={"progress": 0},
            )

        serializer = self.get_serializer(video, context={"request": request})
        return Response(serializer.data)

    def perform_update(self, serializer):
        # Only the uploader can edit
        video = self.get_object()
        if video.uploader != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only edit your own videos.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.uploader != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own videos.")
        instance.delete()


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def react_to_video(request, pk):
    """POST /api/videos/<pk>/react/ — like or dislike a video."""
    video         = get_object_or_404(Video, pk=pk)
    reaction_type = request.data.get("reaction_type")

    if reaction_type not in ("like", "dislike"):
        return Response({"detail": "reaction_type must be 'like' or 'dislike'."}, status=400)

    existing = VideoReaction.objects.filter(user=request.user, video=video).first()

    if existing:
        if existing.reaction_type == reaction_type:
            existing.delete()          # toggle off
            return Response({"reaction": None, "likes": video.like_count, "dislikes": video.dislike_count})
        existing.reaction_type = reaction_type
        existing.save()
    else:
        VideoReaction.objects.create(user=request.user, video=video, reaction_type=reaction_type)

    return Response({
        "reaction": reaction_type,
        "likes":    video.like_count,
        "dislikes": video.dislike_count,
    })


# ─── Comments ────────────────────────────────────────────────────────────────

class CommentListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/videos/<pk>/comments/"""
    serializer_class   = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Comment.objects.filter(
            video_id=self.kwargs["pk"], parent=None
        ).select_related("author").prefetch_related("replies__author")

    def perform_create(self, serializer):
        video = get_object_or_404(Video, pk=self.kwargs["pk"])
        serializer.save(author=self.request.user, video=video)


class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/DELETE /api/comments/<pk>/"""
    queryset           = Comment.objects.all()
    serializer_class   = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_update(self, serializer):
        if self.get_object().author != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only edit your own comments.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.author != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own comments.")
        instance.delete()


# ─── Watch History ────────────────────────────────────────────────────────────

class WatchHistoryView(generics.ListAPIView):
    """GET /api/me/history/"""
    serializer_class   = WatchHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WatchHistory.objects.filter(user=self.request.user).select_related("video__uploader")


# ─── Playlists ────────────────────────────────────────────────────────────────

class PlaylistListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/playlists/"""
    serializer_class   = PlaylistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Playlist.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


@api_view(["POST", "DELETE"])
@permission_classes([IsAuthenticated])
def playlist_video(request, pk, video_pk):
    """POST/DELETE /api/playlists/<pk>/videos/<video_pk>/"""
    playlist = get_object_or_404(Playlist, pk=pk, owner=request.user)
    video    = get_object_or_404(Video, pk=video_pk)

    if request.method == "POST":
        position = playlist.items.count()
        item, created = PlaylistItem.objects.get_or_create(
            playlist=playlist, video=video, defaults={"position": position}
        )
        if not created:
            return Response({"detail": "Already in playlist."}, status=400)
        return Response({"detail": "Added."}, status=201)

    PlaylistItem.objects.filter(playlist=playlist, video=video).delete()
    return Response({"detail": "Removed."})


# ─── Categories ───────────────────────────────────────────────────────────────

class CategoryListView(generics.ListAPIView):
    """GET /api/categories/"""
    queryset           = Category.objects.all()
    serializer_class   = CategorySerializer
    permission_classes = [AllowAny]


# ─── Feed / Recommendations ───────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([AllowAny])
def subscriptions_feed(request):
    """GET /api/feed/ — videos from subscribed channels."""
    if not request.user.is_authenticated:
        return Response({"detail": "Login to see your feed."}, status=401)

    channel_ids = request.user.subscriptions.values_list("channel_id", flat=True)
    videos      = Video.objects.filter(
        uploader_id__in=channel_ids, visibility="public"
    ).select_related("uploader", "category").order_by("-created_at")[:50]

    serializer = VideoListSerializer(videos, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def trending_videos(request):
    """GET /api/trending/ — top videos by views in last 7 days."""
    from django.utils import timezone
    from datetime import timedelta

    week_ago = timezone.now() - timedelta(days=7)
    videos   = Video.objects.filter(
        visibility="public", created_at__gte=week_ago
    ).order_by("-views")[:20]

    serializer = VideoListSerializer(videos, many=True, context={"request": request})
    return Response(serializer.data)