"""
core/management/commands/seed_data.py

Usage:
    python manage.py seed_data
    python manage.py seed_data --users 10 --videos 30 --source D:/gadaf/Documents/project_videos
    python manage.py seed_data --clear          # wipe existing seed data first

Requirements:
    pip install Faker Pillow
"""

import os
import random
import shutil
from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files import File
from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify

try:
    from faker import Faker
except ImportError:
    raise ImportError("Run: pip install Faker")

User = get_user_model()

# ──────────────────────────────────────────────────────────────────────────────
# Helpers to lazily import app models so the command works even when called
# before all apps are fully wired (rare, but safe).
# ──────────────────────────────────────────────────────────────────────────────

def _models():
    from core.models import (  # adjust import path if your app is named differently
        Category, Tag, Video, VideoReaction, Comment,
        Subscription, WatchHistory, Playlist, PlaylistItem,
    )
    return Category, Tag, Video, VideoReaction, Comment, Subscription, WatchHistory, Playlist, PlaylistItem


# ──────────────────────────────────────────────────────────────────────────────
# Media-file helpers
# ──────────────────────────────────────────────────────────────────────────────

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"}


def _collect_files(source_dir: Path, extensions: set) -> list[Path]:
    """Return all files under *source_dir* whose suffix matches *extensions*."""
    found = []
    for root, _, files in os.walk(source_dir):
        for f in files:
            p = Path(root) / f
            if p.suffix.lower() in extensions:
                found.append(p)
    return found


def _pick(files: list[Path], k: int = 1) -> list[Path]:
    """Randomly sample up to k items (with replacement if needed)."""
    if not files:
        return []
    if len(files) >= k:
        return random.sample(files, k)
    # fewer files than requested → sample with replacement
    return random.choices(files, k=k)


def _open_file(path: Path) -> File:
    return File(open(path, "rb"), name=path.name)


# ──────────────────────────────────────────────────────────────────────────────
# Command
# ──────────────────────────────────────────────────────────────────────────────

CATEGORIES = [
    "Gaming", "Music", "Education", "Comedy", "Travel",
    "Tech", "Food", "Fitness", "News", "DIY",
]

TAGS = [
    "trending", "funny", "tutorial", "vlog", "review",
    "live", "shorts", "collab", "challenge", "reaction",
]


class Command(BaseCommand):
    help = "Seed the database with realistic fake data, using local images & videos."

    def add_arguments(self, parser):
        parser.add_argument(
            "--source",
            default=r"D:\gadaf\Documents\project_videos",
            help="Directory that contains your local images and video files.",
        )
        parser.add_argument("--users",   type=int, default=8,  help="Number of fake users to create.")
        parser.add_argument("--videos",  type=int, default=20, help="Number of fake videos to create.")
        parser.add_argument(
            "--clear", action="store_true",
            help="Delete all previously seeded data before re-seeding.",
        )

    # ── entry point ──────────────────────────────────────────────────────────

    def handle(self, *args, **options):
        source = Path(options["source"])
        if not source.exists():
            raise CommandError(
                f"Source directory not found: {source}\n"
                "Pass the correct path with --source D:/your/path"
            )

        self.fake = Faker()
        self.stdout.write(self.style.MIGRATE_HEADING("📂  Scanning media files …"))

        images = _collect_files(source, IMAGE_EXTENSIONS)
        videos = _collect_files(source, VIDEO_EXTENSIONS)

        self.stdout.write(f"   Found {len(images)} image(s) and {len(videos)} video(s).")

        if not videos:
            raise CommandError("No video files found in the source directory.")

        Category, Tag, Video, VideoReaction, Comment, Subscription, WatchHistory, Playlist, PlaylistItem = _models()

        if options["clear"]:
            self._clear()

        self.stdout.write(self.style.MIGRATE_HEADING("🏷️   Creating categories & tags …"))
        categories = self._seed_categories(Category)
        tags = self._seed_tags(Tag)

        self.stdout.write(self.style.MIGRATE_HEADING("👤  Creating users …"))
        users = self._seed_users(options["users"], images)

        self.stdout.write(self.style.MIGRATE_HEADING("🎬  Creating videos …"))
        video_objs = self._seed_videos(
            options["videos"], users, categories, tags, images, videos, Video
        )

        self.stdout.write(self.style.MIGRATE_HEADING("❤️   Creating reactions …"))
        self._seed_reactions(users, video_objs, VideoReaction)

        self.stdout.write(self.style.MIGRATE_HEADING("💬  Creating comments …"))
        self._seed_comments(users, video_objs, Comment)

        self.stdout.write(self.style.MIGRATE_HEADING("🔔  Creating subscriptions …"))
        self._seed_subscriptions(users, Subscription)

        self.stdout.write(self.style.MIGRATE_HEADING("🕐  Creating watch history …"))
        self._seed_watch_history(users, video_objs, WatchHistory)

        self.stdout.write(self.style.MIGRATE_HEADING("📋  Creating playlists …"))
        self._seed_playlists(users, video_objs, Playlist, PlaylistItem)

        self.stdout.write(self.style.SUCCESS("\n✅  Seeding complete!\n"))

    # ── clear ────────────────────────────────────────────────────────────────

    def _clear(self):
        Category, Tag, Video, VideoReaction, Comment, Subscription, WatchHistory, Playlist, PlaylistItem = _models()
        self.stdout.write(self.style.WARNING("🗑️   Clearing existing data …"))
        PlaylistItem.objects.all().delete()
        Playlist.objects.all().delete()
        WatchHistory.objects.all().delete()
        Subscription.objects.all().delete()
        Comment.objects.all().delete()
        VideoReaction.objects.all().delete()
        Video.objects.all().delete()
        Tag.objects.all().delete()
        Category.objects.all().delete()
        # Keep superusers; delete only non-staff seed accounts
        User.objects.filter(is_superuser=False, is_staff=False).delete()

    # ── categories & tags ────────────────────────────────────────────────────

    def _seed_categories(self, Category):
        objs = []
        for name in CATEGORIES:
            obj, _ = Category.objects.get_or_create(
                slug=slugify(name), defaults={"name": name}
            )
            objs.append(obj)
        self.stdout.write(f"   {len(objs)} categories ready.")
        return objs

    def _seed_tags(self, Tag):
        objs = []
        for name in TAGS:
            obj, _ = Tag.objects.get_or_create(name=name)
            objs.append(obj)
        self.stdout.write(f"   {len(objs)} tags ready.")
        return objs

    # ── users ────────────────────────────────────────────────────────────────

    def _seed_users(self, count: int, images: list[Path]) -> list:
        created = []
        avatar_files = _pick(images, count)
        banner_files = _pick(images, count)

        for i in range(count):
            username = self.fake.unique.user_name()[:30]
            email = self.fake.unique.email()

            if User.objects.filter(username=username).exists():
                username = f"{username}_{random.randint(100, 999)}"

            user = User(
                username=username,
                email=email,
                bio=self.fake.text(max_nb_chars=200),
                website=self.fake.url(),
            )
            user.set_password("password123")  # same password for all seed users

            # avatar
            if avatar_files:
                with _open_file(avatar_files[i % len(avatar_files)]) as f:
                    user.avatar.save(f.name, f, save=False)

            # banner
            if banner_files:
                with _open_file(banner_files[i % len(banner_files)]) as f:
                    user.banner.save(f.name, f, save=False)

            user.save()
            created.append(user)
            self.stdout.write(f"   + user: {username}")

        return created

    # ── videos ───────────────────────────────────────────────────────────────

    def _seed_videos(self, count, users, categories, tags, images, video_files, Video):
        created = []
        chosen_videos    = _pick(video_files, count)
        chosen_thumbnails = _pick(images, count) if images else []

        visibilities = ["public", "public", "public", "unlisted", "private"]

        for i in range(count):
            uploader = random.choice(users)
            category = random.choice(categories) if categories else None
            v_path   = chosen_videos[i % len(chosen_videos)]

            video = Video(
                uploader=uploader,
                category=category,
                title=self.fake.sentence(nb_words=random.randint(4, 10)).rstrip("."),
                description=self.fake.paragraph(nb_sentences=random.randint(2, 6)),
                visibility=random.choice(visibilities),
                duration=random.randint(30, 3600),
                views=random.randint(0, 500_000),
            )

            # video file
            with _open_file(v_path) as f:
                video.video_file.save(f.name, f, save=False)

            # thumbnail (optional)
            if chosen_thumbnails:
                t_path = chosen_thumbnails[i % len(chosen_thumbnails)]
                with _open_file(t_path) as f:
                    video.thumbnail.save(f.name, f, save=False)

            video.save()

            # tags (1–4 random)
            video.tags.set(random.sample(tags, k=min(random.randint(1, 4), len(tags))))

            created.append(video)
            self.stdout.write(f"   + video: {video.title[:60]}")

        return created

    # ── reactions ────────────────────────────────────────────────────────────

    def _seed_reactions(self, users, videos, VideoReaction):
        count = 0
        for video in videos:
            reacters = random.sample(users, k=min(random.randint(0, len(users)), len(users)))
            for user in reacters:
                VideoReaction.objects.get_or_create(
                    user=user,
                    video=video,
                    defaults={"reaction_type": random.choice(["like", "like", "dislike"])},
                )
                count += 1
        self.stdout.write(f"   {count} reactions created.")

    # ── comments ─────────────────────────────────────────────────────────────

    def _seed_comments(self, users, videos, Comment):
        count = 0
        for video in videos:
            num_top = random.randint(0, 6)
            top_comments = []
            for _ in range(num_top):
                c = Comment.objects.create(
                    video=video,
                    author=random.choice(users),
                    text=self.fake.sentence(nb_words=random.randint(6, 25)),
                )
                top_comments.append(c)
                count += 1

            # replies (0–3 per top-level comment)
            for parent in top_comments:
                for _ in range(random.randint(0, 3)):
                    Comment.objects.create(
                        video=video,
                        author=random.choice(users),
                        parent=parent,
                        text=self.fake.sentence(nb_words=random.randint(4, 20)),
                    )
                    count += 1

        self.stdout.write(f"   {count} comments created.")

    # ── subscriptions ─────────────────────────────────────────────────────────

    def _seed_subscriptions(self, users, Subscription):
        count = 0
        for user in users:
            channels = [u for u in users if u != user]
            for channel in random.sample(channels, k=min(random.randint(0, 4), len(channels))):
                Subscription.objects.get_or_create(subscriber=user, channel=channel)
                count += 1
        self.stdout.write(f"   {count} subscriptions created.")

    # ── watch history ─────────────────────────────────────────────────────────

    def _seed_watch_history(self, users, videos, WatchHistory):
        count = 0
        for user in users:
            watched = random.sample(videos, k=min(random.randint(1, 8), len(videos)))
            for video in watched:
                WatchHistory.objects.get_or_create(
                    user=user,
                    video=video,
                    defaults={"progress": random.randint(0, video.duration)},
                )
                count += 1
        self.stdout.write(f"   {count} watch-history entries created.")

    # ── playlists ─────────────────────────────────────────────────────────────

    def _seed_playlists(self, users, videos, Playlist, PlaylistItem):
        count = 0
        for user in users:
            for _ in range(random.randint(1, 3)):
                playlist = Playlist.objects.create(
                    owner=user,
                    title=self.fake.sentence(nb_words=random.randint(2, 5)).rstrip("."),
                    description=self.fake.text(max_nb_chars=100),
                    is_public=random.choice([True, True, False]),
                )
                picks = random.sample(videos, k=min(random.randint(2, 8), len(videos)))
                for pos, video in enumerate(picks, start=1):
                    PlaylistItem.objects.get_or_create(
                        playlist=playlist, video=video, defaults={"position": pos}
                    )
                count += 1
        self.stdout.write(f"   {count} playlists created.")