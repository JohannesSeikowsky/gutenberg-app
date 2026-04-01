/**Displays a book summary with action buttons.*/
import { useState } from 'react';
import { addToLibrary } from '../lib/library';

function formatSummary(text) {
  /**Bold the opening quoted title in a summary string.*/
  const match = text.match(/^(".*?")/);
  if (!match) return text;
  return <><strong style={{ fontSize: '1.2em' }}>{match[1]}</strong>{text.slice(match[1].length)}</>;
}

function formatWikiLabel(url) {
  /**Extract a readable label from a Wikipedia URL.*/
  const parsed = new URL(url);
  const lang = parsed.hostname.split('.')[0];
  const title = decodeURIComponent(parsed.pathname.split('/').pop()).replace(/_/g, ' ');
  return lang === 'en' ? title : `(${lang}) ${title}`;
}

export default function BookCard({ book, user, onBack, canGoBack, onNext, onRead }) {
  /**Book card with back, read, add-to-library, and next actions.*/
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    /**Add book to library and show confirmation.*/
    await addToLibrary(user.id, book.book_id, book.summary);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="book-card">
      <p className="book-summary">{formatSummary(book.summary)}</p>
      {book.wikipedia_links?.length > 0 && (
        <div className="wikipedia-links">
          {book.wikipedia_links.map((url) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer">
              {formatWikiLabel(url)}
            </a>
          ))}
        </div>
      )}
      <div className="book-actions">
        <button onClick={onBack} disabled={!canGoBack}>Back</button>
        <button onClick={() => onRead(book.book_id)}>Start Reading</button>
        <button onClick={handleAdd}>Add to Library</button>
        <button onClick={onNext}>Next</button>
      </div>
      {added && <p className="added-toast">Added to Library</p>}
    </div>
  );
}
