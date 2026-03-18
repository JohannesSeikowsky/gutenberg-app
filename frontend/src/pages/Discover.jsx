/**Book discovery page — shows one book at a time from a category.*/
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAllBooks } from '../api';
import BookCard from '../components/BookCard';

function shuffle(arr) {
  /**Fisher-Yates shuffle in place.*/
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Discover() {
  const { categoryId } = useParams();
  const [books, setBooks] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAllBooks(categoryId).then((data) => {
      setBooks(shuffle(data));
      setIndex(0);
      setLoading(false);
    });
  }, [categoryId]);

  if (loading) return <p>Loading...</p>;

  if (index >= books.length) {
    return (
      <div className="discover">
        <p>No more books in this category.</p>
        <Link to="/">Back to categories</Link>
      </div>
    );
  }

  return (
    <div className="discover">
      <Link to="/" className="back-link">← Categories</Link>
      <BookCard book={books[index]} onNext={() => setIndex(i => i + 1)} />
    </div>
  );
}
