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
├── wikipedia_links.txt  # ~10.8k rows: book_id,wikipedia_url (some books have multiple links)
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
  - `reading_progress` — per-user reading position with `user_id`, `book_id`, `text_snippet`, `updated_at`. PK is `(user_id, book_id)`. RLS enforces per-user access.
  - `wikipedia_links` — ~12k rows mapping `book_id` → `url`. Some books have two links (e.g. English + another language). Loaded into memory at Flask startup for fast lookup.

## Version 1 Scope

### User accounts
- Register/login via email OTP (auto-creates account on first use)
- Each user has a personal **library**: a saved list of books they can add to or remove from

### Book discovery
- Single-page UI: category dropdown at top, book card below (no routing)
- User picks one of the main Gutenberg categories from a dropdown
- All books for a category are fetched in one request, shuffled client-side
- One book is shown at a time with three actions:
  - **Back** — return to the previously shown book (disabled on first book)
  - **Read Now** — opens the book in the in-app reader view
  - **Next** — show another book from the same category (instant, no API call)
- Book cards show the full Wikipedia article (fetched via Wikipedia parse API) in a scrollable iframe, with title and author above. Falls back to summary text if no Wikipedia link exists. Wikipedia links loaded into Flask memory at startup from `wikipedia_links` table.
- Full search is deferred to a later version

### Reading progress
- App remembers where the user left off in each book
- When reopening a book, automatically scroll to the last reading position
- Progress saved per user per book in Supabase as a text snippet (~80 chars from first visible paragraph, robust across screen sizes and DOM structure changes)

### Book content
- Flask proxies Gutenberg HTML via `/api/book-content/<book_id>` with LRU cache (128 entries)
- Frontend uses Readability.js to extract article content, DOMPurify to sanitize
- In-app reader with mobile-friendly serif typography, continuous scroll
- Adjustable font size (14–28px, 0.5px steps) via sticky footer with A−/A+ buttons; preference persisted in localStorage
- Dark mode toggle in reader footer; preference persisted in localStorage
- Source URL: `https://www.gutenberg.org/cache/epub/{id}/pg{id}-images.html`

