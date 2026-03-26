/**In-app reader view for Gutenberg books.*/
import { useEffect, useState, useRef } from 'react';
import { Readability } from '@mozilla/readability';
import DOMPurify from 'dompurify';
import { fetchBookContent } from '../api';
import { addToLibrary } from '../lib/library';
import { saveProgress, loadProgress } from '../lib/progress';

function getVisibleSnippet(containerEl) {
  /**Return ~80 chars of text from the first visible element in the reader.*/
  const elements = containerEl.querySelectorAll('p, h1, h2, h3, h4, li');
  for (const el of elements) {
    const rect = el.getBoundingClientRect();
    if (rect.bottom > 80 && rect.top < window.innerHeight / 2) {
      const text = el.textContent.trim();
      if (text.length > 10) return text.slice(0, 80);
    }
  }
  return null;
}

function scrollToSnippet(containerEl, snippet) {
  /**Find the element containing the snippet and scroll it into view.*/
  const elements = containerEl.querySelectorAll('p, h1, h2, h3, h4, li');
  for (const el of elements) {
    if (el.textContent.includes(snippet)) {
      el.scrollIntoView({ behavior: 'instant' });
      return true;
    }
  }
  return false;
}

const DEFAULT_FONT_SIZE = 18;
const MIN_FONT_SIZE = 14;
const MAX_FONT_SIZE = 28;
const FONT_STEP = 0.5;

function loadFontSize() {
  /**Load saved font size from localStorage.*/
  const saved = parseInt(localStorage.getItem('reader-font-size'), 10);
  return saved >= MIN_FONT_SIZE && saved <= MAX_FONT_SIZE ? saved : DEFAULT_FONT_SIZE;
}

export default function ReaderView({ bookId, summary, user, onBack }) {
  /**Fetches, cleans, and renders a book with mobile-friendly typography.*/
  const [html, setHtml] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);
  const [fontSize, setFontSize] = useState(loadFontSize);
  const contentRef = useRef(null);
  const lastSnippetRef = useRef(null);

  const changeFontSize = (delta) => {
    /**Adjust font size by delta and persist to localStorage.*/
    setFontSize((prev) => {
      const next = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, prev + delta));
      localStorage.setItem('reader-font-size', next);
      return next;
    });
  };

  const handleAdd = async () => {
    /**Add current book to library.*/
    await addToLibrary(user.id, bookId, summary);
    setAdded(true);
  };

  const handleBack = () => {
    /**Save progress and navigate back.*/
    if (user && contentRef.current) {
      const snippet = getVisibleSnippet(contentRef.current);
      if (snippet) saveProgress(user.id, bookId, snippet).catch(() => {});
    }
    onBack();
  };

  // Fetch and render book content
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchBookContent(bookId)
      .then((raw) => {
        if (cancelled) return;
        const doc = new DOMParser().parseFromString(raw, 'text/html');

        // Remove Gutenberg header/footer
        doc.querySelector('#pg-header')?.remove();
        doc.querySelector('#pg-footer')?.remove();

        // Rewrite relative image URLs before Readability processes the DOM
        const base = `https://www.gutenberg.org/cache/epub/${bookId}/`;
        doc.querySelectorAll('img').forEach((img) => {
          const src = img.getAttribute('src');
          if (src && !src.startsWith('http')) {
            img.setAttribute('src', base + src);
          }
        });

        const article = new Readability(doc.cloneNode(true)).parse();
        if (!article) throw new Error('Could not parse book content');

        const clean = DOMPurify.sanitize(article.content, {
          FORBID_TAGS: ['style'],
          FORBID_ATTR: ['style'],
          ADD_TAGS: ['img'],
          ADD_ATTR: ['src', 'alt'],
        });

        setTitle(article.title || 'Untitled');
        setHtml(clean);
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [bookId]);

  // Restore saved reading position after content renders
  useEffect(() => {
    if (!html || !user) { window.scrollTo(0, 0); return; }

    loadProgress(user.id, bookId).then((snippet) => {
      requestAnimationFrame(() => {
        if (snippet && contentRef.current) {
          const found = scrollToSnippet(contentRef.current, snippet);
          if (!found) window.scrollTo(0, 0);
          lastSnippetRef.current = snippet;
        } else {
          window.scrollTo(0, 0);
        }
      });
    }).catch(() => window.scrollTo(0, 0));
  }, [html, user, bookId]);

  // Track scroll position and save progress (debounced)
  useEffect(() => {
    if (!user || !html || !contentRef.current) return;

    let debounceTimer;
    const handleScroll = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const snippet = getVisibleSnippet(contentRef.current);
        if (snippet && snippet !== lastSnippetRef.current) {
          lastSnippetRef.current = snippet;
          saveProgress(user.id, bookId, snippet).catch(() => {});
        }
      }, 3000);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(debounceTimer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [user, html, bookId]);

  // Save progress when user switches tabs or backgrounds the app
  useEffect(() => {
    if (!user || !html) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && contentRef.current) {
        const snippet = getVisibleSnippet(contentRef.current);
        if (snippet && snippet !== lastSnippetRef.current) {
          lastSnippetRef.current = snippet;
          saveProgress(user.id, bookId, snippet).catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user, html, bookId]);

  if (loading) return <div className="reader-toolbar"><button onClick={handleBack}>&larr;</button><span>Loading...</span></div>;

  if (error) {
    return (
      <div>
        <div className="reader-toolbar"><button onClick={handleBack}>&larr;</button><span>Error</span></div>
        <p style={{ padding: '1rem' }}>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="reader-toolbar">
        <button onClick={handleBack}>&larr;</button>
        <span className="reader-title">{title}</span>
        {user && summary && (
          <button className="reader-add-btn" onClick={handleAdd}>
            {added ? '✓ Added' : 'Add to Library'}
          </button>
        )}
      </div>
      <div
        className="reader-content"
        ref={contentRef}
        style={{ fontSize: fontSize + 'px' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="reader-footer">
        <button onClick={() => changeFontSize(-FONT_STEP)} disabled={fontSize <= MIN_FONT_SIZE}>A−</button>
        <button onClick={() => changeFontSize(FONT_STEP)} disabled={fontSize >= MAX_FONT_SIZE}>A+</button>
      </div>
    </div>
  );
}
