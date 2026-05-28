from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────────
    path("auth/register/",  views.RegisterView.as_view(),         name="register"),
    path("auth/login/",     TokenObtainPairView.as_view(),         name="token_obtain_pair"),
    path("auth/refresh/",   TokenRefreshView.as_view(),            name="token_refresh"),

    # ── Current user ──────────────────────────────────────────────────────────
    path("me/",             views.MeView.as_view(),                name="me"),
    path("me/history/",     views.WatchHistoryView.as_view(),      name="watch-history"),

    # ── Channels ──────────────────────────────────────────────────────────────
    path("channels/<int:pk>/",           views.UserProfileView.as_view(),   name="channel-detail"),
    path("channels/<int:pk>/subscribe/", views.subscribe_toggle,            name="subscribe"),
    path("channels/<int:pk>/videos/",    views.ChannelVideosView.as_view(), name="channel-videos"),

    # ── Videos ────────────────────────────────────────────────────────────────
    path("videos/",          views.VideoListCreateView.as_view(), name="video-list"),
    path("videos/<int:pk>/", views.VideoDetailView.as_view(),     name="video-detail"),
    path("videos/<int:pk>/react/",    views.react_to_video,       name="video-react"),
    path("videos/<int:pk>/comments/", views.CommentListCreateView.as_view(), name="comment-list"),

    # ── Comments ──────────────────────────────────────────────────────────────
    path("comments/<int:pk>/", views.CommentDetailView.as_view(), name="comment-detail"),

    # ── Playlists ─────────────────────────────────────────────────────────────
    path("playlists/",                               views.PlaylistListCreateView.as_view(), name="playlist-list"),
    path("playlists/<int:pk>/videos/<int:video_pk>/", views.playlist_video,                  name="playlist-video"),

    # ── Categories ────────────────────────────────────────────────────────────
    path("categories/", views.CategoryListView.as_view(), name="category-list"),

    # ── Discovery ─────────────────────────────────────────────────────────────
    path("feed/",      views.subscriptions_feed, name="feed"),
    path("trending/",  views.trending_videos,    name="trending"),
]