/**Displays a book summary with action buttons.*/

function formatSummary(text) {
  /**Bold the opening quoted title in a summary string.*/
  const match = text.match(/^(".*?")/);
  if (!match) return text;
  return <>{<strong>{match[1]}</strong>}{text.slice(match[1].length)}</>;
}

export default function BookCard({ book, onNext }) {
  return (
    <div className="book-card">
      <p className="book-summary">{formatSummary(book.summary)}</p>
      <div className="book-actions">
        <button onClick={() => alert('Reading coming soon!')}>Start Reading</button>
        <button onClick={() => alert('Library coming soon!')}>Add to Library</button>
        <button onClick={onNext}>Next</button>
      </div>
    </div>
  );
}
