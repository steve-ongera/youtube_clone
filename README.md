# ViewTube — YouTube Clone

A full-stack YouTube clone built with **Django REST Framework** (backend) and **React + Vite** (frontend).

---

##  Project Structure

```
viewtube/
├── backend/
│   ├── core/                  # Main Django app
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── viewtube/
│   │   ├── settings.py
│   │   └── urls.py
│   ├── media/                 # Uploaded videos & thumbnails
│   ├── manage.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/        # Reusable UI components
    │   ├── pages/             # Route-level page components
    │   ├── utils/
    │   │   └── api.js         # Axios API client
    │   ├── styles/
    │   │   └── main.css       # Global styles
    │   └── main.jsx           # App entry point
    ├── index.html
    └── vite.config.js
```

---

##  Backend Setup (Django)

### Requirements
- Python 3.10+
- pip

### Installation

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file in `/backend`:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
```

### Run Migrations & Start Server

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

API runs at: `http://localhost:8000/api/`

---

##  Frontend Setup (React + Vite)

### Requirements
- Node.js 18+

### Installation

```bash
cd frontend
npm install
npm run dev
```

App runs at: `http://localhost:5173/`

---

## 🔌 API Endpoints

| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| GET    | `/api/videos/`                  | List all videos          |
| POST   | `/api/videos/`                  | Upload a video           |
| GET    | `/api/videos/<id>/`             | Get single video         |
| PUT    | `/api/videos/<id>/`             | Update video             |
| DELETE | `/api/videos/<id>/`             | Delete video             |
| POST   | `/api/videos/<id>/like/`        | Like a video             |
| GET    | `/api/videos/<id>/comments/`    | List comments            |
| POST   | `/api/videos/<id>/comments/`    | Post a comment           |
| GET    | `/api/channels/<id>/`           | Get channel profile      |
| POST   | `/api/channels/<id>/subscribe/` | Subscribe to channel     |
| POST   | `/api/auth/register/`           | Register user            |
| POST   | `/api/auth/login/`              | Login (get JWT tokens)   |
| POST   | `/api/auth/refresh/`            | Refresh JWT token        |

---

##  Frontend Pages

| Page          | Route              | Description                  |
|---------------|--------------------|------------------------------|
| Home          | `/`                | Video feed / recommendations |
| Watch         | `/watch/:id`       | Video player + comments      |
| Search        | `/search`          | Search results               |
| Channel       | `/channel/:id`     | Channel profile + videos     |
| Upload        | `/upload`          | Upload new video             |
| Login         | `/login`           | Authentication               |
| Register      | `/register`        | New user signup              |

---

##  Tech Stack

**Backend:** Django 4.x, Django REST Framework, SimpleJWT, django-cors-headers, Pillow

**Frontend:** React 18, Vite, React Router v6, Axios, React Player

---

##  License

MIT — free to use and modify.