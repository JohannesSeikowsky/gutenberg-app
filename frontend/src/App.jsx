/**Main app — category dropdown + book discovery on one page.*/
import { useEffect, useState } from 'react';
import { fetchCategories, fetchAllBooks } from './api';
import BookCard from './components/BookCard';
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>Browse Categories</h1>
        <button className="sign-out-btn" onClick={signOut}>Sign out</button>
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
        <BookCard book={books[index]} onNext={() => setIndex(i => i + 1)} />
      )}
    </div>
  );
}
