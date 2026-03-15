/**Book discovery page — shows one book at a time from a category.*/
import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchBook } from '../api';
import BookCard from '../components/BookCard';

export default function Discover() {
  const { categoryId } = useParams();
  const [book, setBook] = useState(null);
  const [done, setDone] = useState(false);
  const seenIds = useRef([]);

  const loadBook = () => {
    fetchBook(categoryId, seenIds.current).then((data) => {
      if (!data) {
        setDone(true);
      } else {
        seenIds.current.push(data.book_id);
        setBook(data);
      }
    });
  };

  useEffect(() => {
    loadBook();
  }, [categoryId]);

  if (done) {
    return (
      <div className="discover">
        <p>No more books in this category.</p>
        <Link to="/">Back to categories</Link>
      </div>
    );
  }

  if (!book) return <p>Loading...</p>;

  return (
    <div className="discover">
      <Link to="/" className="back-link">← Categories</Link>
      <BookCard book={book} onNext={loadBook} />
    </div>
  );
}
