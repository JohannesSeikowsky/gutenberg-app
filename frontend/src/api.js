/**API helpers for the Gutenberg app.*/

export async function fetchCategories() {
  /**Fetch all book categories.*/
  const res = await fetch('/api/categories');
  return res.json();
}

export async function fetchAllBooks(categoryId) {
  /**Fetch all books with summaries for a category.*/
  const res = await fetch(`/api/categories/${categoryId}/books`);
  if (!res.ok) return [];
  return res.json();
}
