/**Main app — category dropdown + book discovery on one page.*/
import { useEffect, useState, useRef } from 'react';
import { fetchCategories, fetchBook } from './api';
import BookCard from './components/BookCard';

export default function App() {
  /**Single-page app with category picker and book display.*/
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [book, setBook] = useState(null);
  const [done, setDone] = useState(false);
  const seenIds = useRef([]);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  const loadBook = (catId, seen) => {
    /**Fetch next unseen book for the given category.*/
    fetchBook(catId, seen).then((data) => {
      if (!data) {
        setDone(true);
      } else {
        seenIds.current.push(data.book_id);
        setBook(data);
        setDone(false);
      }
    });
  };

  const handleSelect = (e) => {
    const id = e.target.value;
    if (!id) return;
    setCategoryId(id);
    setBook(null);
    setDone(false);
    seenIds.current = [];
    loadBook(id, []);
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

      {done && <p>No more books in this category.</p>}
      {book && !done && (
        <BookCard book={book} onNext={() => loadBook(categoryId, seenIds.current)} />
      )}
    </div>
  );
}
