from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    """Extended user with channel-like profile."""
    avatar        = models.ImageField(upload_to="avatars/", blank=True, null=True)
    banner        = models.ImageField(upload_to="banners/", blank=True, null=True)
    bio           = models.TextField(blank=True)
    website       = models.URLField(blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username

    @property
    def subscriber_count(self):
        return self.subscribers.count()

    @property
    def total_views(self):
        return sum(v.views for v in self.videos.all())


class Subscription(models.Model):
    """Follower → Channel (User) relationship."""
    subscriber  = models.ForeignKey(User, related_name="subscriptions",  on_delete=models.CASCADE)
    channel     = models.ForeignKey(User, related_name="subscribers",    on_delete=models.CASCADE)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("subscriber", "channel")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.subscriber} → {self.channel}"


class Category(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(unique=True)

    class Meta:
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class Video(models.Model):
    VISIBILITY_CHOICES = [
        ("public",   "Public"),
        ("unlisted", "Unlisted"),
        ("private",  "Private"),
    ]

    uploader    = models.ForeignKey(User,     related_name="videos",    on_delete=models.CASCADE)
    category    = models.ForeignKey(Category, related_name="videos",    on_delete=models.SET_NULL, null=True, blank=True)
    title       = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    video_file  = models.FileField(upload_to="videos/%Y/%m/")
    thumbnail   = models.ImageField(upload_to="thumbnails/%Y/%m/", blank=True, null=True)
    visibility  = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default="public")
    duration    = models.PositiveIntegerField(default=0, help_text="Duration in seconds")
    views       = models.PositiveIntegerField(default=0)
    tags        = models.ManyToManyField("Tag", blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    @property
    def like_count(self):
        return self.reactions.filter(reaction_type="like").count()

    @property
    def dislike_count(self):
        return self.reactions.filter(reaction_type="dislike").count()

    @property
    def comment_count(self):
        return self.comments.filter(parent=None).count()

    def increment_views(self):
        Video.objects.filter(pk=self.pk).update(views=models.F("views") + 1)


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class VideoReaction(models.Model):
    REACTION_CHOICES = [("like", "Like"), ("dislike", "Dislike")]

    user          = models.ForeignKey(User,  related_name="reactions",       on_delete=models.CASCADE)
    video         = models.ForeignKey(Video, related_name="reactions",       on_delete=models.CASCADE)
    reaction_type = models.CharField(max_length=10, choices=REACTION_CHOICES)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "video")

    def __str__(self):
        return f"{self.user} {self.reaction_type}d {self.video}"


class Comment(models.Model):
    video      = models.ForeignKey(Video,   related_name="comments", on_delete=models.CASCADE)
    author     = models.ForeignKey(User,    related_name="comments", on_delete=models.CASCADE)
    parent     = models.ForeignKey("self",  related_name="replies",  on_delete=models.CASCADE, null=True, blank=True)
    text       = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Comment by {self.author} on {self.video}"

    @property
    def reply_count(self):
        return self.replies.count()


class WatchHistory(models.Model):
    user       = models.ForeignKey(User,  related_name="watch_history", on_delete=models.CASCADE)
    video      = models.ForeignKey(Video, related_name="watch_history", on_delete=models.CASCADE)
    watched_at = models.DateTimeField(default=timezone.now)
    progress   = models.PositiveIntegerField(default=0, help_text="Seconds watched")

    class Meta:
        ordering = ["-watched_at"]
        unique_together = ("user", "video")

    def __str__(self):
        return f"{self.user} watched {self.video}"


class Playlist(models.Model):
    owner      = models.ForeignKey(User,  related_name="playlists", on_delete=models.CASCADE)
    title      = models.CharField(max_length=150)
    description= models.TextField(blank=True)
    is_public  = models.BooleanField(default=True)
    videos     = models.ManyToManyField(Video, through="PlaylistItem", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class PlaylistItem(models.Model):
    playlist   = models.ForeignKey(Playlist, related_name="items",  on_delete=models.CASCADE)
    video      = models.ForeignKey(Video,    related_name="in_playlists", on_delete=models.CASCADE)
    position   = models.PositiveIntegerField(default=0)
    added_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["position"]
        unique_together = ("playlist", "video")