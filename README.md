# ViewTube - YouTube Clone

A full-stack YouTube clone built with Django REST Framework and React + Vite.

---

## Tech Stack

Backend: Django 4.x, Django REST Framework, SimpleJWT, django-cors-headers, django-filter, Pillow
Frontend: React 18, Vite, React Router v6, Axios

---

## Project Structure

```
viewtube/
|
|-- backend/
|   |
|   |-- core/                          # Main Django application
|   |   |-- migrations/                # Database migration files
|   |   |   |-- __init__.py
|   |   |   |-- 0001_initial.py
|   |   |
|   |   |-- __init__.py
|   |   |-- apps.py                    # App configuration
|   |   |-- models.py                  # Database models
|   |   |-- serializers.py             # DRF serializers
|   |   |-- views.py                   # API views and logic
|   |   |-- urls.py                    # App-level URL routes
|   |   |-- admin.py                   # Django admin registration
|   |   |-- permissions.py             # Custom permission classes
|   |
|   |-- viewtube/                      # Django project configuration
|   |   |-- __init__.py
|   |   |-- settings.py                # Project settings
|   |   |-- urls.py                    # Root URL configuration
|   |   |-- wsgi.py                    # WSGI entry point
|   |   |-- asgi.py                    # ASGI entry point
|   |
|   |-- media/                         # User-uploaded files (auto-created)
|   |   |-- videos/                    # Uploaded video files
|   |   |-- thumbnails/                # Video thumbnails
|   |   |-- avatars/                   # User profile pictures
|   |   |-- banners/                   # Channel banner images
|   |
|   |-- staticfiles/                   # Collected static files (production)
|   |-- manage.py                      # Django management script
|   |-- requirements.txt               # Python dependencies
|   |-- .env                           # Environment variables (create manually)
|   |-- .env.example                   # Environment variable template
|
|-- frontend/
|   |
|   |-- public/
|   |   |-- favicon.ico
|   |
|   |-- src/
|   |   |
|   |   |-- components/
|   |   |   |-- Layout.jsx             # App shell: navbar + sidebar + outlet
|   |   |   |-- Navbar.jsx             # Top navigation bar
|   |   |   |-- Sidebar.jsx            # Left navigation sidebar
|   |   |   |-- VideoCard.jsx          # Video thumbnail card for grids
|   |   |   |-- CommentSection.jsx     # Threaded comments with reply support
|   |   |   |-- ProtectedRoute.jsx     # Auth guard for private routes
|   |   |
|   |   |-- pages/
|   |   |   |-- Home.jsx               # Homepage feed with category filters
|   |   |   |-- Watch.jsx              # Video player with comments and related
|   |   |   |-- Search.jsx             # Search results with sort controls
|   |   |   |-- Channel.jsx            # Channel profile and video listing
|   |   |   |-- Upload.jsx             # Video upload form
|   |   |   |-- Login.jsx              # Sign in page
|   |   |   |-- Register.jsx           # Create account page
|   |   |   |-- NotFound.jsx           # 404 fallback page
|   |   |
|   |   |-- utils/
|   |   |   |-- api.js                 # Axios client with JWT interceptors
|   |   |
|   |   |-- styles/
|   |   |   |-- main.css               # Global styles and theme
|   |   |
|   |   |-- main.jsx                   # React app entry point and router
|   |
|   |-- index.html                     # HTML entry point
|   |-- vite.config.js                 # Vite configuration and dev proxy
|   |-- package.json                   # Node dependencies and scripts
|   |-- .env                           # Frontend environment variables
|   |-- .gitignore
|
|-- .gitignore
|-- README.md
```

---

## Backend Models

```
User
  id, username, email, password
  avatar, banner, bio, website
  created_at

Subscription
  subscriber  (FK -> User)
  channel     (FK -> User)
  created_at
  unique_together: (subscriber, channel)

Category
  id, name, slug

Tag
  id, name

Video
  id, title, description
  video_file, thumbnail
  uploader    (FK -> User)
  category    (FK -> Category, nullable)
  tags        (M2M -> Tag)
  visibility  choices: public / unlisted / private
  duration    (seconds), views
  created_at, updated_at

VideoReaction
  user          (FK -> User)
  video         (FK -> Video)
  reaction_type choices: like / dislike
  unique_together: (user, video)

Comment
  video      (FK -> Video)
  author     (FK -> User)
  parent     (FK -> self, nullable -- enables reply threads)
  text, created_at, updated_at

WatchHistory
  user       (FK -> User)
  video      (FK -> Video)
  watched_at, progress (seconds watched)
  unique_together: (user, video)

Playlist
  owner      (FK -> User)
  title, description, is_public
  videos     (M2M -> Video through PlaylistItem)

PlaylistItem
  playlist   (FK -> Playlist)
  video      (FK -> Video)
  position, added_at
  unique_together: (playlist, video)
```

---

## API Endpoints

```
Authentication
  POST    /api/auth/register/                   Register new user
  POST    /api/auth/login/                      Login, receive access + refresh JWT
  POST    /api/auth/refresh/                    Refresh access token

Current User
  GET     /api/me/                              Get own profile
  PUT     /api/me/                              Update own profile
  GET     /api/me/history/                      Get watch history

Channels
  GET     /api/channels/<id>/                   Get channel profile
  PUT     /api/channels/<id>/                   Update channel (own only)
  POST    /api/channels/<id>/subscribe/         Subscribe or unsubscribe (toggle)
  GET     /api/channels/<id>/videos/            List channel public videos

Videos
  GET     /api/videos/                          List public videos (paginated, 20/page)
  POST    /api/videos/                          Upload new video (auth required)
  GET     /api/videos/<id>/                     Get video detail, increments view count
  PUT     /api/videos/<id>/                     Update video (uploader only)
  DELETE  /api/videos/<id>/                     Delete video (uploader only)
  POST    /api/videos/<id>/react/               Like or dislike (body: {reaction_type})

Comments
  GET     /api/videos/<id>/comments/            List root comments + nested replies
  POST    /api/videos/<id>/comments/            Post comment or reply (body: {text, parent?})
  PUT     /api/comments/<id>/                   Edit comment (author only)
  DELETE  /api/comments/<id>/                   Delete comment (author only)

Playlists
  GET     /api/playlists/                       List own playlists
  POST    /api/playlists/                       Create playlist
  POST    /api/playlists/<id>/videos/<vid>/     Add video to playlist
  DELETE  /api/playlists/<id>/videos/<vid>/     Remove video from playlist

Discovery
  GET     /api/feed/                            Videos from subscribed channels
  GET     /api/trending/                        Top videos by views in last 7 days
  GET     /api/categories/                      List all categories

Video List Query Parameters
  search=<term>              Full-text on title, description, tags
  category__slug=<slug>      Filter by category slug
  uploader__username=<name>  Filter by uploader
  ordering=-created_at       Newest first (default)
  ordering=-views            Most viewed first
  ordering=-like_count       Most liked first
  page=<n>                   Page number (20 results per page)
```

---

## Frontend Routes

```
/                Route: Home.jsx
                 Paginated public video feed with category chip filters.

/watch/:id       Route: Watch.jsx
                 Native HTML5 video player.
                 Like / dislike toggles.
                 Channel info with subscribe button.
                 Collapsible description.
                 Tag pills.
                 CommentSection with threaded replies.
                 Related videos sidebar (right column on desktop).

/search          Route: Search.jsx
                 Query from ?q= param.
                 Sort by: Newest, Most Viewed, Most Liked.
                 Load more pagination.

/channel/:id     Route: Channel.jsx
                 Banner image, avatar, subscriber count.
                 Subscribe / Unsubscribe toggle.
                 Videos tab and About tab.
                 Full video grid.

/upload          Route: Upload.jsx  (ProtectedRoute)
                 Click-to-select video file zone.
                 Thumbnail image preview.
                 Title, description, tags, visibility fields.

/login           Route: Login.jsx
                 Username + password form.
                 Stores access_token, refresh_token, user in localStorage.

/register        Route: Register.jsx
                 Username, email, password, confirm password.
                 Client-side validation.
                 Auto-logs in after successful registration.

*                Route: NotFound.jsx
                 404 fallback with home link.
```

---

## Frontend Components

```
Layout.jsx
  Shell component rendered by the router for all main routes.
  Renders Navbar fixed at top.
  Renders Sidebar fixed on left.
  Renders page content in the remaining space via <Outlet />.

Navbar.jsx
  Left:   logo linking to /.
  Center: search input + submit button, navigates to /search?q=.
  Right:  when logged out -- Sign In and Join buttons.
          when logged in  -- Upload button + avatar dropdown.
  Dropdown menu: My Channel, History, Playlists, Sign Out.

Sidebar.jsx
  Main navigation: Home, Trending, Feed, Playlists, History.
  Explore section: Gaming, Music, Film, Science, Sports.
  Uses NavLink for active state highlighting.
  Hidden on screens narrower than 1024px.

VideoCard.jsx
  Thumbnail image (16:9 aspect ratio) with duration badge overlay.
  Channel avatar (or initial placeholder).
  Title clamped to 2 lines.
  Channel name (clickable, navigates to channel page).
  View count formatted to K/M and relative timestamp.
  Entire card navigates to /watch/:id on click.

CommentSection.jsx
  Fetches comments from /api/videos/:id/comments/ on mount.
  Displays reply count per comment with expand/collapse toggle.
  Inline reply composer activated per comment.
  Posts new comments and replies to API, updates local state.
  Textarea auto-grows with content.
  Shows sign-in prompt for unauthenticated users.

ProtectedRoute.jsx
  Checks for access_token in localStorage.
  Renders <Outlet /> if authenticated.
  Redirects to /login if not authenticated.
```

---

## utils/api.js

```
Default export
  Axios instance with baseURL from VITE_API_URL or http://localhost:8000/api.

Request interceptor
  Reads access_token from localStorage.
  Attaches Authorization: Bearer <token> header to every request.

Response interceptor
  On HTTP 401: attempts to refresh using refresh_token.
  On refresh success: saves new access_token, retries original request.
  On refresh failure: clears tokens from localStorage, redirects to /login.

Named exports
  authAPI
    register(data)          POST /auth/register/
    login(data)             POST /auth/login/
    refresh(token)          POST /auth/refresh/
    me()                    GET  /me/
    updateMe(data)          PATCH /me/

  videoAPI
    list(params)            GET  /videos/
    get(id)                 GET  /videos/:id/
    upload(formData)        POST /videos/  (multipart)
    update(id, formData)    PATCH /videos/:id/  (multipart)
    delete(id)              DELETE /videos/:id/
    react(id, type)         POST /videos/:id/react/
    trending()              GET  /trending/
    feed()                  GET  /feed/
    search(query)           GET  /videos/?search=query

  commentAPI
    list(videoId)           GET  /videos/:id/comments/
    create(videoId, data)   POST /videos/:id/comments/
    update(id, data)        PATCH /comments/:id/
    delete(id)              DELETE /comments/:id/

  channelAPI
    get(id)                 GET  /channels/:id/
    videos(id)              GET  /channels/:id/videos/
    subscribe(id)           POST /channels/:id/subscribe/

  playlistAPI
    list()                  GET  /playlists/
    create(data)            POST /playlists/
    addVideo(pid, vid)      POST /playlists/:pid/videos/:vid/
    removeVideo(pid, vid)   DELETE /playlists/:pid/videos/:vid/

  categoryAPI
    list()                  GET  /categories/

  historyAPI
    list()                  GET  /me/history/
```

---

## Backend Setup

Requirements: Python 3.10 or higher.

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create backend/.env:

```
SECRET_KEY=your-long-random-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

Run migrations and start server:

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

API base:    http://localhost:8000/api/
Admin panel: http://localhost:8000/admin/

---

## Frontend Setup

Requirements: Node.js 18 or higher.

```bash
cd frontend
npm install
npm run dev
```

App runs at: http://localhost:5173/

Create frontend/.env:

```
VITE_API_URL=http://localhost:8000/api
```

The Vite dev server (vite.config.js) proxies /api and /media to
localhost:8000 automatically, so no CORS issues in development.

---

## Running Both in Development

Terminal 1:
```bash
cd backend && source venv/bin/activate && python manage.py runserver
```

Terminal 2:
```bash
cd frontend && npm run dev
```

---

## Production Checklist

Backend:
  Set DEBUG=False in .env
  Set a strong SECRET_KEY
  Switch to PostgreSQL (update DATABASES in settings.py)
  Run python manage.py collectstatic
  Serve media/ via nginx or object storage (S3, GCS)
  Set ALLOWED_HOSTS to your domain
  Run with gunicorn: gunicorn viewtube.wsgi:application

Frontend:
  Set VITE_API_URL to your production API domain in .env
  Run npm run build
  Serve the dist/ folder via nginx or a CDN
  Configure nginx to proxy /api/ and /media/ to Django

---

## License

MIT