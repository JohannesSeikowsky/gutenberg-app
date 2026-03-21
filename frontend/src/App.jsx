/**Main app — category dropdown + book discovery on one page.*/
import { useEffect, useState } from 'react';
import { fetchCategories, fetchAllBooks } from './api';
import BookCard from './components/BookCard';
import Library from './components/Library';
import ReaderView from './components/ReaderView';
import Login from './components/Login';
import { useAuth } from './AuthContext';

function shuffle(arr) {
  /**Fisher-Yates shuffle in place.*/
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function App() {
  /**Single-page app with category picker and book display.*/
  const { user, loading: authLoading, signOut } = useAuth();
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [books, setBooks] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState('discover');
  const [readerBookId, setReaderBookId] = useState(null);
  const [prevPage, setPrevPage] = useState('discover');

  const [readerBookSummary, setReaderBookSummary] = useState(null);

  const openReader = (bookId, summary = null) => {
    /**Open the in-app reader for a book.*/
    setPrevPage(page);
    setReaderBookId(bookId);
    setReaderBookSummary(summary);
    setPage('reader');
  };

  useEffect(() => {
    if (user) fetchCategories().then(setCategories);
  }, [user]);

  const handleSelect = (e) => {
    /**Fetch all books for the selected category and shuffle them.*/
    const id = e.target.value;
    if (!id) return;
    setCategoryId(id);
    setLoading(true);
    fetchAllBooks(id).then((data) => {
      setBooks(shuffle(data));
      setIndex(0);
      setLoading(false);
    });
  };

  if (authLoading) return <p>Loading…</p>;
  if (!user) return <Login />;

  if (page === 'reader') {
    return <ReaderView bookId={readerBookId} summary={readerBookSummary} user={user} onBack={() => setPage(prevPage)} />;
  }

  if (page === 'library') {
    return (
      <div className="app">
        <Library user={user} onBack={() => setPage('discover')} onRead={openReader} />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Browse Categories</h1>
        <div className="header-actions">
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); setPage('library') }}>My Library</a>
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); signOut() }}>Sign out</a>
        </div>
      </header>
      <select onChange={handleSelect} value={categoryId}>
        <option value="" disabled>Select a category…</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>

      {loading && <p>Loading...</p>}
      {!loading && books.length > 0 && index >= books.length && (
        <p>No more books in this category.</p>
      )}
      {!loading && books.length > 0 && index < books.length && (
        <BookCard book={books[index]} user={user} onBack={() => setIndex(i => i - 1)} canGoBack={index > 0} onNext={() => setIndex(i => i + 1)} onRead={(id) => openReader(id, books[index].summary)} />
      )}
    </div>
  );
}
