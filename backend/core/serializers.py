from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Video, Comment, VideoReaction, Subscription,
    Tag, Category, WatchHistory, Playlist, PlaylistItem,
)

User = get_user_model()


# ─── Auth / User ─────────────────────────────────────────────────────────────

class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, label="Confirm password")

    class Meta:
        model  = User
        fields = ("id", "username", "email", "password", "password2")

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop("password2")
        return User.objects.create_user(**validated_data)


class UserMinimalSerializer(serializers.ModelSerializer):
    """Compact representation used inside nested objects."""
    avatar_url       = serializers.SerializerMethodField()
    subscriber_count = serializers.IntegerField(read_only=True, source="subscriber_count")

    class Meta:
        model  = User
        fields = ("id", "username", "avatar_url", "subscriber_count")

    def get_avatar_url(self, obj):
        request = self.context.get("request")
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        return None


class UserProfileSerializer(serializers.ModelSerializer):
    avatar_url       = serializers.SerializerMethodField()
    banner_url       = serializers.SerializerMethodField()
    subscriber_count = serializers.SerializerMethodField()
    total_views      = serializers.SerializerMethodField()
    is_subscribed    = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = (
            "id", "username", "email", "bio", "website",
            "avatar_url", "banner_url",
            "subscriber_count", "total_views",
            "is_subscribed", "date_joined",
        )

    def get_avatar_url(self, obj):
        request = self.context.get("request")
        return request.build_absolute_uri(obj.avatar.url) if obj.avatar and request else None

    def get_banner_url(self, obj):
        request = self.context.get("request")
        return request.build_absolute_uri(obj.banner.url) if obj.banner and request else None

    def get_subscriber_count(self, obj):
        return obj.subscribers.count()

    def get_total_views(self, obj):
        return obj.total_views

    def get_is_subscribed(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Subscription.objects.filter(subscriber=request.user, channel=obj).exists()
        return False


# ─── Tag / Category ──────────────────────────────────────────────────────────

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Tag
        fields = ("id", "name")


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = ("id", "name", "slug")


# ─── Video ───────────────────────────────────────────────────────────────────

class VideoListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list/card views."""
    uploader      = UserMinimalSerializer(read_only=True)
    thumbnail_url = serializers.SerializerMethodField()
    category      = CategorySerializer(read_only=True)

    class Meta:
        model  = Video
        fields = (
            "id", "title", "thumbnail_url", "duration",
            "views", "like_count", "comment_count",
            "uploader", "category", "visibility", "created_at",
        )

    def get_thumbnail_url(self, obj):
        request = self.context.get("request")
        return request.build_absolute_uri(obj.thumbnail.url) if obj.thumbnail and request else None


class VideoDetailSerializer(serializers.ModelSerializer):
    uploader      = UserMinimalSerializer(read_only=True)
    thumbnail_url = serializers.SerializerMethodField()
    video_url     = serializers.SerializerMethodField()
    tags          = TagSerializer(many=True, read_only=True)
    category      = CategorySerializer(read_only=True)
    user_reaction = serializers.SerializerMethodField()

    class Meta:
        model  = Video
        fields = (
            "id", "title", "description", "video_url", "thumbnail_url",
            "duration", "views", "like_count", "dislike_count", "comment_count",
            "uploader", "tags", "category", "visibility",
            "user_reaction", "created_at", "updated_at",
        )

    def get_thumbnail_url(self, obj):
        request = self.context.get("request")
        return request.build_absolute_uri(obj.thumbnail.url) if obj.thumbnail and request else None

    def get_video_url(self, obj):
        request = self.context.get("request")
        return request.build_absolute_uri(obj.video_file.url) if request else obj.video_file.url

    def get_user_reaction(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            reaction = VideoReaction.objects.filter(user=request.user, video=obj).first()
            return reaction.reaction_type if reaction else None
        return None


class VideoUploadSerializer(serializers.ModelSerializer):
    tag_names   = serializers.ListField(
        child=serializers.CharField(max_length=50), write_only=True, required=False
    )
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True, required=False
    )

    class Meta:
        model  = Video
        fields = (
            "id", "title", "description", "video_file",
            "thumbnail", "visibility", "tag_names", "category_id",
        )

    def create(self, validated_data):
        tag_names = validated_data.pop("tag_names", [])
        video     = Video.objects.create(**validated_data)
        for name in tag_names:
            tag, _ = Tag.objects.get_or_create(name=name.lower())
            video.tags.add(tag)
        return video


# ─── Comment ─────────────────────────────────────────────────────────────────

class CommentSerializer(serializers.ModelSerializer):
    author      = UserMinimalSerializer(read_only=True)
    replies     = serializers.SerializerMethodField()
    reply_count = serializers.IntegerField(read_only=True, source="reply_count")

    class Meta:
        model  = Comment
        fields = (
            "id", "video", "author", "parent", "text",
            "reply_count", "replies", "created_at", "updated_at",
        )
        read_only_fields = ("video", "author")

    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(
                obj.replies.all(), many=True, context=self.context
            ).data
        return []


# ─── Reaction ────────────────────────────────────────────────────────────────

class VideoReactionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = VideoReaction
        fields = ("id", "reaction_type", "created_at")
        read_only_fields = ("id", "created_at")


# ─── Watch History ───────────────────────────────────────────────────────────

class WatchHistorySerializer(serializers.ModelSerializer):
    video = VideoListSerializer(read_only=True)

    class Meta:
        model  = WatchHistory
        fields = ("id", "video", "watched_at", "progress")


# ─── Playlist ────────────────────────────────────────────────────────────────

class PlaylistItemSerializer(serializers.ModelSerializer):
    video = VideoListSerializer(read_only=True)

    class Meta:
        model  = PlaylistItem
        fields = ("id", "video", "position", "added_at")


class PlaylistSerializer(serializers.ModelSerializer):
    owner       = UserMinimalSerializer(read_only=True)
    items       = PlaylistItemSerializer(many=True, read_only=True)
    video_count = serializers.SerializerMethodField()

    class Meta:
        model  = Playlist
        fields = (
            "id", "title", "description", "is_public",
            "owner", "items", "video_count", "created_at",
        )

    def get_video_count(self, obj):
        return obj.items.count()