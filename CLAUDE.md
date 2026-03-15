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
└── frontend/   # React app (also packaged via Capacitor for mobile)
```

## How it fits together
- React app runs in browser (web) or in a WebView via Capacitor (mobile)
- React calls Flask API for auth and user data
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
| Auth     | JWT + Google OAuth |
| Books    | Gutenberg public API |

## Supabase setup
- **URL and key** stored in `.env` (`SUPABASE_URL`, `SUPABASE_KEY`)
- Current tables:
  - `book_categories` — 182k rows mapping `book_id` → `category_id` (+ `created_at`). Category IDs match `main_categories.txt` (633–704).
- Tables still needed: users, user_library, reading_progress

## Version 1 Scope

### User accounts
- Register/login via email or Google Sign-In (OAuth)
- Each user has a personal **library**: a saved list of books they can add to or remove from

### Book discovery
- Single-page UI: category dropdown at top, book card below (no routing)
- User picks one of the main Gutenberg categories from a dropdown
- One book is shown at a time with three actions:
  - **Start reading** — open the book in-app
  - **Add to library** — save it to their personal list
  - **Next** — show another book from the same category
- Full search is deferred to a later version

### Reading progress
- App remembers where the user left off in each book
- When reopening a book, automatically scroll to the last reading position
- Progress saved per user per book in Supabase as a paragraph/element index (robust across screen sizes)

### Book content
- Fetched directly from Project Gutenberg
- Open: what format to use — their HTML pages or plain `.txt` files?

