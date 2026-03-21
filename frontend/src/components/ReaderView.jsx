/**In-app reader view for Gutenberg books.*/
import { useEffect, useState, useRef } from 'react';
import { Readability } from '@mozilla/readability';
import DOMPurify from 'dompurify';
import { fetchBookContent } from '../api';

export default function ReaderView({ bookId, onBack }) {
  /**Fetches, cleans, and renders a book with mobile-friendly typography.*/
  const [html, setHtml] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const contentRef = useRef(null);

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
        window.scrollTo(0, 0);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [bookId]);

  if (loading) return <div className="reader-toolbar"><button onClick={onBack}>&larr;</button><span>Loading...</span></div>;

  if (error) {
    return (
      <div>
        <div className="reader-toolbar"><button onClick={onBack}>&larr;</button><span>Error</span></div>
        <p style={{ padding: '1rem' }}>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="reader-toolbar">
        <button onClick={onBack}>&larr;</button>
        <span className="reader-title">{title}</span>
      </div>
      <div
        className="reader-content"
        ref={contentRef}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
