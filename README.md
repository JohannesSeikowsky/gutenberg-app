# Gutenberg App

A smartphone app for discovering and reading books from [Project Gutenberg](https://www.gutenberg.org/) — the world's oldest digital library of free ebooks. The app focuses on the ~9,500 Gutenberg books that have a Wikipedia entry, since these come with higher-quality summaries that make browsing and discovery more useful. Built as a React web app, packaged for iOS/Android via Capacitor.

## Features

- **Book discovery** — Browse 72 categories (literature, history, science, etc.). Books are shuffled for serendipitous discovery. Each book card shows a summary to help you decide what to read.
- **In-app reader** — Read full Gutenberg books without leaving the app. Content is extracted with Readability.js and sanitized with DOMPurify. Mobile-friendly serif typography with adjustable font size and dark mode.
- **Reading progress** — Automatically saves your position in each book (as a text snippet, so it's robust across screen sizes). Reopening a book scrolls to where you left off.
- **Personal library** — Save books to read later. One tap to add from the discovery view or from within the reader.
- **Passwordless auth** — Sign in with email OTP via Supabase. Account created automatically on first login.

## Architecture

| Layer    | Technology                |
|----------|---------------------------|
| Frontend | React 19 + Vite           |
| Mobile   | Capacitor (planned)       |
| Backend  | Flask (Python)            |
| Database | Supabase (PostgreSQL)     |
| Auth     | Supabase email OTP        |
| Books    | Gutenberg public API      |

```
gutenberg_app/
├── backend/          # Flask API (book content proxy, category/book endpoints)
├── frontend/         # React SPA (discovery, reader, library, auth)
├── main_categories.txt   # 72 Gutenberg categories (IDs 633–704)
└── myenv/            # Python virtual environment
```

The React app talks to Flask for book data (`/api/categories`, `/api/categories/<id>/books`, `/api/book-content/<id>`) and directly to Supabase for auth, library, and reading progress.

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Supabase](https://supabase.com/) project

### Backend

```bash
python -m venv myenv
source myenv/bin/activate
pip install -r backend/requirements.txt

cp .env.example .env
# Edit .env with your Supabase URL and key

python backend/app.py   # Runs on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install

cp .env.example .env
# Edit .env with your Supabase URL and key (VITE_ prefixed)

npm run dev   # Runs on http://localhost:5173, proxies /api to Flask
```

### Supabase tables

The app expects these tables:

| Table | Purpose |
|-------|---------|
| `category_summary_books` | Pre-joined category + book + summary (~21k rows) |
| `user_library` | Per-user saved books (RLS enabled) |
| `reading_progress` | Per-user reading position as text snippet (RLS enabled) |

Data import scripts in `backend/` populate the book tables from `wiki-based-summaries.csv`.

## License

Book content is from Project Gutenberg and is in the public domain.
