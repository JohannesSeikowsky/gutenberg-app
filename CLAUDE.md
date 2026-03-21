# Gutenberg App — Implementation Plan

## Goal
A smartphone app (iOS, potentially Android) to read books from Project Gutenberg.

## Architecture
- **Frontend**: React (Vite) — static SPA
- **Backend**: Flask (Python) — REST API
- **Database**: Supabase (PostgreSQL)
- **Mobile**: Capacitor — packages the React app as iOS/Android

```
gutenberg_app/
├── backend/    # Flask API
├── frontend/   # React app (also packaged via Capacitor for mobile)
└── myenv/      # Python virtual environment (already exists — do NOT recreate)
```

## How it fits together
- React app runs in browser (web) or in a WebView via Capacitor (mobile)
- Auth handled frontend-only via Supabase JS (email OTP); Flask validates JWT on protected routes
- Books/content fetched from Gutenberg's public API
- Supabase stores user accounts, reading progress, bookmarks

## Key decisions
- React chosen over vanilla JS for component reuse, state management, and Capacitor compatibility
- Capacitor chosen because it runs the same React app in a WebView → web and mobile look identical
- Flask needed because we have user accounts (not a pure frontend app)
- Supabase for database (PostgreSQL, hosted, with auth support)

## Tech stack summary
| Layer    | Technology         |
|----------|--------------------|
| Frontend | React + Vite       |
| Mobile   | Capacitor          |
| Backend  | Flask (Python)     |
| Database | Supabase           |
| Auth     | Supabase email OTP (frontend-only) |
| Books    | Gutenberg public API |

## Supabase setup
- **URL and key** stored in `.env` (`SUPABASE_URL`, `SUPABASE_KEY`) and `frontend/.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`)
- Current tables:
  - `category_summary_books` — ~21k rows, pre-joined table with `category_id`, `book_id`, `summary`. Primary table used by the app.
  - `book_categories` — 182k rows mapping `book_id` → `category_id` (backup, not queried). Category IDs match `main_categories.txt` (633–704).
  - `book_summaries` — ~9k rows mapping `book_id` → `summary` (backup, not queried).
  - `user_library` — per-user saved books with `user_id`, `book_id`, `summary`, `added_at`. RLS enforces per-user access.
- Tables still needed: reading_progress

## Version 1 Scope

### User accounts
- Register/login via email OTP (auto-creates account on first use)
- Each user has a personal **library**: a saved list of books they can add to or remove from

### Book discovery
- Single-page UI: category dropdown at top, book card below (no routing)
- User picks one of the main Gutenberg categories from a dropdown
- All books for a category are fetched in one request, shuffled client-side
- One book is shown at a time with four actions:
  - **Back** — return to the previously shown book (disabled on first book)
  - **Start reading** — opens the book in the in-app reader view
  - **Add to library** — save it to their personal list
  - **Next** — show another book from the same category (instant, no API call)
- Full search is deferred to a later version

### Reading progress
- App remembers where the user left off in each book
- When reopening a book, automatically scroll to the last reading position
- Progress saved per user per book in Supabase as a paragraph/element index (robust across screen sizes)

### Book content
- Flask proxies Gutenberg HTML via `/api/book-content/<book_id>` with LRU cache (128 entries)
- Frontend uses Readability.js to extract article content, DOMPurify to sanitize
- In-app reader with mobile-friendly serif typography, continuous scroll
- Source URL: `https://www.gutenberg.org/cache/epub/{id}/pg{id}-images.html`

