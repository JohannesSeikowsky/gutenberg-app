# Reader View Research

Research on implementing an in-app reader view for Project Gutenberg books in a React/Capacitor mobile app.

---

## 1. Content Extraction: Mozilla Readability.js

### What It Is
Readability.js is the standalone library behind Firefox Reader View. It extracts the main article/book content from an HTML page, stripping away navigation, boilerplate, ads, etc.

- **npm**: `@mozilla/readability` (v0.6.0, ~1M weekly downloads)
- **Repo**: https://github.com/mozilla/readability
- **License**: Apache 2.0

### API

```javascript
import { Readability, isProbablyReaderable } from '@mozilla/readability';

// In-browser: parse fetched HTML with DOMParser
const response = await fetch(url);  // must go through our proxy (CORS)
const html = await response.text();
const parser = new DOMParser();
const doc = parser.parseFromString(html, 'text/html');

// Optional: check if content is suitable
if (isProbablyReaderable(doc)) {
  const article = new Readability(doc).parse();
  // article.title    - string
  // article.content  - sanitized HTML string (the main content)
  // article.textContent - plain text
  // article.excerpt  - short summary
  // article.byline   - author
  // article.length   - character count
}
```

### Constructor Options
| Option | Default | Description |
|--------|---------|-------------|
| `charThreshold` | 500 | Min chars for an article |
| `nbTopCandidates` | 5 | Candidates to evaluate |
| `keepClasses` | false | Preserve original CSS classes |
| `disableJSONLD` | false | Skip JSON-LD metadata |
| `serializer` | `el.innerHTML` | Custom output serializer |

### Key Notes
- `parse()` **mutates** the DOM. Always pass a clone: `new Readability(doc.cloneNode(true)).parse()`
- Works directly in the browser (no jsdom needed). jsdom is only for Node.js.
- Sanitize output with DOMPurify before rendering with `dangerouslySetInnerHTML`.
- Images are preserved in `article.content`.

### Alternatives
- **@postlight/mercury-parser** — similar extraction, less actively maintained
- **html-to-text** — strips HTML entirely (too aggressive for our use case)

---

## 2. Project Gutenberg HTML Structure

### Page Format
URL pattern: `https://www.gutenberg.org/cache/epub/{id}/pg{id}-images.html`

Examined Pride and Prejudice (book 1342). Structure:

```
<html>
  <head><!-- CSS styles --></head>
  <body>
    <section id="pg-header">        <!-- PG boilerplate: title, license -->
      #pg-header-heading
      metadata (title, author, date, credits)
    </section>

    <!-- START OF THE PROJECT GUTENBERG EBOOK marker -->

    <h1>Book Title</h1>
    <h2>Chapter I</h2>              <!-- chapters use <h2> -->
    <p>Book text...</p>             <!-- standard paragraphs -->
    <p class="nind">No-indent p</p>
    <p class="c">Centered text</p>
    <span class="pagenum">42</span> <!-- page number markers -->
    <img src="images/i_030.jpg" alt="..."/>

    <!-- END OF THE PROJECT GUTENBERG EBOOK marker -->

    <section id="pg-footer">        <!-- PG boilerplate: license -->
      #pg-footer-heading
      #project-gutenberg-license
    </section>
  </body>
</html>
```

### Extraction Strategy

**Important**: Gutenberg has ~80,000 books spanning decades of digitization. While `#pg-header` and `#pg-footer` are consistent, the internal HTML varies significantly — different tag usage, inconsistent class names, varying levels of semantic markup, mixed formatting conventions. A robust extraction strategy must handle this diversity.

**Recommended approach: Readability.js as primary extractor**

Readability.js is designed to handle arbitrary, inconsistent HTML — exactly what we need. It uses scoring heuristics to identify the main content regardless of specific tag structure or class names.

```javascript
const doc = parser.parseFromString(html, 'text/html');

// Step 1: Remove known Gutenberg boilerplate (helps Readability focus)
doc.querySelector('#pg-header')?.remove();
doc.querySelector('#pg-footer')?.remove();

// Step 2: Let Readability extract and clean the content
const article = new Readability(doc.cloneNode(true)).parse();
const bookHTML = article?.content || doc.body.innerHTML; // fallback to raw body
```

This two-step approach gives us the best of both worlds:
- Pre-removing `#pg-header`/`#pg-footer` helps Readability by reducing noise
- Readability then handles the diverse internal structures — tables, poetry formatting, nested divs, inconsistent heading levels, inline styles, etc.
- Fallback to raw body content if Readability fails (unlikely but safe)

**Why not DOM removal alone**: Stripping header/footer only removes Gutenberg's wrapper. The remaining HTML still carries the original book's inconsistent formatting — inline styles, deprecated tags (`<font>`, `<center>`), deeply nested tables (common in older books), etc. Readability normalizes all of this into clean, consistent HTML.

**Why not marker-based extraction**: The `*** START OF` / `*** END OF` text markers are fragile in HTML context — they may be split across elements, inside comments, or absent in newer formats.

---

## 3. CORS: Fetching Gutenberg Content

**Problem**: Project Gutenberg does not set CORS headers. Browser `fetch()` from our React app to `gutenberg.org` will be blocked.

**Solution**: Proxy through our Flask backend.

```python
# Flask endpoint
@app.route('/api/book-content/<int:book_id>')
def book_content(book_id):
    """Fetch and return Gutenberg HTML for a book."""
    url = f"https://www.gutenberg.org/cache/epub/{book_id}/pg{book_id}-images.html"
    resp = requests.get(url, timeout=15)
    return resp.text, 200, {'Content-Type': 'text/html; charset=utf-8'}
```

Then in React:
```javascript
const html = await fetch(`/api/book-content/${bookId}`).then(r => r.text());
```

This also gives us a place to cache book HTML (e.g., in-memory LRU or Redis) to reduce Gutenberg load.

---

## 4. Rendering Book HTML in React

### Safe HTML Rendering

```javascript
import DOMPurify from 'dompurify';
import { useMemo } from 'react';

function BookContent({ html }) {
  const clean = useMemo(() => ({
    __html: DOMPurify.sanitize(html, {
      ADD_TAGS: ['img'],
      ADD_ATTR: ['src', 'alt', 'class'],
    })
  }), [html]);

  return <div className="reader-content" dangerouslySetInnerHTML={clean} />;
}
```

### Dependencies Needed
- `dompurify` — sanitize HTML before rendering
- `@mozilla/readability` — optional, for fallback extraction

### Alternative: iframe
Could render book HTML in an iframe, but this makes reading progress tracking, theming, and font control much harder. Direct DOM rendering via `dangerouslySetInnerHTML` is preferred.

---

## 5. Mobile-Optimized Reading Typography

### Recommended CSS

```css
.reader-content {
  /* Font */
  font-family: Georgia, 'Literata', 'Bookerly', serif;
  font-size: 18px;            /* minimum 16px, 18px is comfortable */
  line-height: 1.6;           /* 1.5-1.6x is the sweet spot */

  /* Measure (line length) */
  max-width: 65ch;            /* 45-75 chars per line desktop */
  margin: 0 auto;
  padding: 16px 20px;

  /* Text */
  text-align: left;           /* left-aligned is easier to read than justified on mobile */
  word-break: break-word;
  hyphens: auto;

  /* Colors */
  color: #2c2c2c;
  background: #fafafa;
}

/* Mobile-specific */
@media (max-width: 600px) {
  .reader-content {
    font-size: 17px;
    padding: 12px 16px;
    max-width: 100%;           /* full width on small screens, ~35-45 chars naturally */
  }
}

/* Headings */
.reader-content h1, .reader-content h2, .reader-content h3 {
  margin-top: 2em;
  margin-bottom: 0.5em;
  line-height: 1.3;
}

/* Paragraphs */
.reader-content p {
  margin-bottom: 1em;
}

/* Images */
.reader-content img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1em auto;
}
```

### Font Recommendations (for ebook reading)
| Font | Type | Notes |
|------|------|-------|
| **Georgia** | Serif | Best overall for screens. Large x-height, clear at small sizes. System font (no download). |
| **Literata** | Serif | Google's Play Books default. Free on Google Fonts. |
| **Bookerly** | Serif | Amazon Kindle's font. Not freely available. |
| **Verdana** | Sans-serif | Generous spacing, clear at small sizes. System font. |
| **Charter** | Serif | Clean, readable. Available via system or Google Fonts (as Charis SIL). |

**Recommendation**: Default to Georgia (zero-download, excellent readability). Optionally offer Literata as an alternative via Google Fonts.

### Pagination vs. Scroll

| Approach | Pros | Cons |
|----------|------|------|
| **Continuous scroll** | Simple to implement, natural for web, works well with progress tracking | No sense of "page progress", can feel endless |
| **Pagination** | Familiar book feel, clear progress, prevents content splitting issues less on large screens | Complex to implement correctly (varying screen sizes, reflow), artificial content breaks |

**Recommendation**: Use **continuous scroll** for v1. It's simpler, works naturally with IntersectionObserver-based progress tracking, and avoids the complexity of calculating page breaks across different screen sizes. Can add pagination later if users request it.

---

## 6. Reading Themes (Light / Sepia / Dark)

Common ebook reader themes:

```css
/* Light (default) */
.theme-light .reader-content {
  color: #2c2c2c;
  background: #fafafa;
}

/* Sepia — reduces blue light, warm tone */
.theme-sepia .reader-content {
  color: #5b4636;
  background: #f8f1e3;
}

/* Dark — for night reading */
.theme-dark .reader-content {
  color: #b0b0b0;          /* not pure white — reduces glare */
  background: #121212;
}
```

Store user preference in localStorage or Supabase user settings.

---

## 7. Reading Progress Tracking

### Why Scroll Position Alone Fails
- Font size changes alter total page height
- Different screen sizes = different scroll positions for the same content
- Content reflow on orientation change invalidates saved scroll Y

### Recommended: Paragraph Index with IntersectionObserver

Track which paragraph the user is currently reading by observing visibility of content elements.

```javascript
function useReadingProgress(contentRef, bookId) {
  const [currentParagraph, setCurrentParagraph] = useState(0);

  useEffect(() => {
    if (!contentRef.current) return;

    const paragraphs = contentRef.current.querySelectorAll('p, h1, h2, h3');

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible paragraph
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          const index = Array.from(paragraphs).indexOf(visible[0].target);
          if (index >= 0) setCurrentParagraph(index);
        }
      },
      { threshold: 0.5 }  // element is 50% visible
    );

    paragraphs.forEach(p => observer.observe(p));
    return () => observer.disconnect();
  }, [contentRef]);

  // Debounce saves to Supabase
  useEffect(() => {
    const timer = setTimeout(() => {
      saveProgress(bookId, currentParagraph);
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentParagraph, bookId]);

  return currentParagraph;
}
```

### Restoring Position

```javascript
function scrollToProgress(contentRef, paragraphIndex) {
  """Scroll to the saved paragraph index."""
  if (!contentRef.current) return;
  const paragraphs = contentRef.current.querySelectorAll('p, h1, h2, h3');
  if (paragraphs[paragraphIndex]) {
    paragraphs[paragraphIndex].scrollIntoView({ behavior: 'smooth' });
  }
}
```

### Storage Schema (Supabase)

```sql
CREATE TABLE reading_progress (
  user_id UUID REFERENCES auth.users(id),
  book_id INTEGER NOT NULL,
  paragraph_index INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, book_id)
);

-- RLS: users can only access their own progress
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own progress"
  ON reading_progress FOR ALL
  USING (auth.uid() = user_id);
```

### Performance Notes
- IntersectionObserver runs off the main thread — much more efficient than scroll event listeners
- Debounce saves (2s delay) to avoid excessive Supabase writes during active scrolling
- Also save on `visibilitychange` event (user switches app/tab)
- Store in localStorage as immediate cache, sync to Supabase in background

---

## 8. React Libraries Considered

| Library | What It Does | Verdict |
|---------|-------------|---------|
| **@mozilla/readability** | Extracts article content from HTML | Use as fallback for non-standard Gutenberg pages |
| **dompurify** | Sanitizes HTML to prevent XSS | Required — use before `dangerouslySetInnerHTML` |
| **react-reader** (epub.js wrapper) | Renders EPUB files in React | Overkill — we have HTML, not EPUB |
| **react-reader-view** | Safari-like reader mode component | Uses iframe + URL fetching — doesn't fit our proxy approach |
| **epub.js** | Full EPUB rendering engine | Wrong format — we're working with HTML |
| **react-ebook** (foliate-js) | Multi-format ebook renderer | Unstable/experimental, foliate-js API not stable |

### Recommendation
Don't use a heavy ebook library. Our content is already HTML. The approach:
1. Fetch HTML via Flask proxy
2. Remove `#pg-header`/`#pg-footer` (known boilerplate)
3. Run through Readability.js to normalize the diverse internal HTML into clean, consistent output
4. Sanitize with DOMPurify
5. Render with `dangerouslySetInnerHTML`
6. Apply our own reader CSS (overrides any leftover inline styles)
7. Track progress with IntersectionObserver

This gives us full control over styling, theming, and progress tracking without fighting library abstractions.

---

## 9. Implementation Plan Summary

### Dependencies to Add
```bash
cd frontend
npm install dompurify @mozilla/readability
```

### Architecture
```
User taps "Read" → fetch /api/book-content/:id (Flask proxy)
  → Flask fetches from gutenberg.org, returns HTML
  → React parses with DOMParser
  → Removes #pg-header, #pg-footer (known boilerplate)
  → Readability.js extracts & normalizes diverse book HTML into clean output
  → Sanitizes with DOMPurify
  → Renders in <div class="reader-content"> with our reader CSS
  → IntersectionObserver tracks current paragraph
  → Debounced save to Supabase reading_progress table
  → On reopen, restore scroll to saved paragraph
```

### Key Components Needed
1. **Flask**: `/api/book-content/<book_id>` — proxy endpoint (with caching)
2. **React**: `ReaderView` component — renders sanitized book HTML with reader CSS
3. **React**: `useReadingProgress` hook — tracks and restores paragraph position
4. **React**: Theme toggle (light/sepia/dark)
5. **React**: Font size adjuster (small/medium/large)
6. **Supabase**: `reading_progress` table with RLS
