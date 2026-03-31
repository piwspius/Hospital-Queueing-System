# Hospital Queueing System (vitaminQ)

A modern, fast, and responsive patient queue management system built with FastAPI and SQLite.

## Features
- Real-time queue tracking
- Token-based priority system
- Patient management (Add, Call Next, Serve)
- Professional UI with "Glassmorphism" design
- Fully responsive for mobile and desktop

## Tech Stack
- **Backend**: Python 3.14+, FastAPI, SQLAlchemy
- **Database**: SQLite
- **Frontend**: HTML5, CSS3, Vanilla JavaScript

## Getting Started

### Local Setup
1. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
2. Run the backend:
   ```bash
   uvicorn backend.app.main:app --reload
   ```
3. Open `frontend/index.html` in your browser.

### Docker Setup
Run with Docker Compose:
```bash
docker-compose up --build
```

## Project Structure
- `backend/`: FastAPI source code and models
- `frontend/`: HTML, CSS, and JS files
- `hospital_queue.db`: SQLite database file
