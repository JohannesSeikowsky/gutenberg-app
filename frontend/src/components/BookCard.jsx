/**Displays a book with embedded Wikipedia content and action buttons.*/
import { useState, useEffect } from 'react';

function extractAuthor(summary) {
  /**Extract author name from summary string like '"Title" by Author is...'.*/
  const match = summary.match(/^".*?"\s+by\s+(.+?)\s+(?:is|was|are|were)\b/);
  return match ? match[1] : null;
}

function wikiParseUrl(pageUrl) {
  /**Build a Wikipedia parse API URL that returns full article HTML.*/
  const parsed = new URL(pageUrl);
  const lang = parsed.hostname.split('.')[0];
  const title = parsed.pathname.split('/').pop();
  return `https://${lang}.wikipedia.org/w/api.php?action=parse&page=${title}&format=json&origin=*&prop=text`;
}

const WIKI_STYLE = `<style>
  body { font-family: -apple-system, sans-serif; font-size: 15px; line-height: 1.6; padding: 12px; margin: 0; color: #333; }
  img { max-width: 100%; height: auto; }
  table { border-collapse: collapse; max-width: 100%; font-size: 0.9em; }
  td, th { border: 1px solid #ddd; padding: 4px 8px; }
  a { color: #007bff; }
  .infobox, .sidebar { max-width: 100%; }
  .mw-editsection, .ambox, .mbox-small, .sistersitebox, .mw-empty-elt { display: none; }
</style>`;

export default function BookCard({ book, user, onBack, canGoBack, onNext, onRead }) {
  /**Book card with embedded Wikipedia extract and action buttons.*/
  const [wikiHtml, setWikiHtml] = useState('');
  const [wikiTitle, setWikiTitle] = useState('');
  const [wikiLoading, setWikiLoading] = useState(false);

  useEffect(() => {
    /**Fetch full Wikipedia mobile HTML for the first available link.*/
    setWikiHtml('');
    setWikiTitle('');
    const url = book.wikipedia_links?.[0];
    if (!url) { setWikiLoading(false); return; }
    setWikiLoading(true);
    setWikiTitle(decodeURIComponent(url.split('/').pop()).replace(/_/g, ' '));
    fetch(wikiParseUrl(url))
      .then(r => r.json())
      .then(data => setWikiHtml(WIKI_STYLE + data.parse.text['*']))
      .catch(() => setWikiHtml(''))
      .finally(() => setWikiLoading(false));
  }, [book.book_id]);

  return (
    <div className="book-card">
      {wikiTitle && (
        <div className="wiki-header">
          <h2 className="wiki-title">{wikiTitle}</h2>
          {extractAuthor(book.summary) && (
            <p className="wiki-author">by {extractAuthor(book.summary)}</p>
          )}
        </div>
      )}
      {wikiLoading ? (
        <div className="wiki-iframe" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>Loading…</div>
      ) : wikiHtml ? (
        <iframe
          className="wiki-iframe"
          srcDoc={wikiHtml}
          sandbox="allow-same-origin"
          title="Wikipedia article"
        />
      ) : (
        <p className="book-summary">{book.summary}</p>
      )}
      <div className="book-actions">
        <button onClick={onBack} disabled={!canGoBack}>Back</button>
        <button className="read-now-btn" onClick={() => onRead(book.book_id)}>Read Now</button>
        <button onClick={onNext}>Next</button>
      </div>
    </div>
  );
}
