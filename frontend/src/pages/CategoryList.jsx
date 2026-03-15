/**Category selection page.*/
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCategories } from '../api';

export default function CategoryList() {
  /**Renders a dropdown menu for picking a book category.*/
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  const handleSelect = (e) => {
    if (e.target.value) navigate(`/discover/${e.target.value}`);
  };

  return (
    <div className="category-list">
      <h1>Browse Categories</h1>
      <select onChange={handleSelect} defaultValue="">
        <option value="" disabled>Select a category…</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
    </div>
  );
}
