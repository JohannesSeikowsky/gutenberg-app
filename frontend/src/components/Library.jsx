/**Library page — shows saved books with remove and read actions.*/
import { useEffect, useState } from 'react'
import { getLibrary, removeFromLibrary } from '../lib/library'

function extractTitle(summary) {
  /**Extract the quoted title from the start of a summary string.*/
  const match = summary.match(/^"(.*?)"/)
  return match ? match[1] : 'Untitled'
}

export default function Library({ user, onBack }) {
  /**Displays the user's saved library.*/
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLibrary(user.id).then((data) => {
      setBooks(data)
      setLoading(false)
    })
  }, [user.id])

  const handleRemove = async (bookId) => {
    /**Remove a book after confirmation and update local state.*/
    if (!window.confirm('Remove this book from your library?')) return
    await removeFromLibrary(user.id, bookId)
    setBooks((prev) => prev.filter((b) => b.book_id !== bookId))
  }

  return (
    <div className="library">
      <a href="#" className="back-link" onClick={(e) => { e.preventDefault(); onBack() }}>
        &larr; Back to Browse
      </a>
      <h1>My Library</h1>
      {loading && <p>Loading...</p>}
      {!loading && books.length === 0 && <p>No books saved yet.</p>}
      {books.map((b) => (
        <div key={b.book_id} className="library-item">
          <span className="library-title">{extractTitle(b.summary)}</span>
          <div className="library-actions">
            <a
              href={`https://www.gutenberg.org/cache/epub/${b.book_id}/pg${b.book_id}-images.html`}
              target="_blank"
              rel="noreferrer"
            >
              Start Reading
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleRemove(b.book_id) }}>Remove</a>
          </div>
        </div>
      ))}
    </div>
  )
}
