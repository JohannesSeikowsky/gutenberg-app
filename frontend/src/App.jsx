/**Main app — category dropdown + book discovery on one page.*/
import { useEffect, useState } from 'react';
import { fetchCategories, fetchAllBooks } from './api';
import BookCard from './components/BookCard';

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
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [books, setBooks] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

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

  return (
    <div className="app">
      <h1>Browse Categories</h1>
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
