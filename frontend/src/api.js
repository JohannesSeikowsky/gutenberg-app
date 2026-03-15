/**API helpers for the Gutenberg app.*/

export async function fetchCategories() {
  const res = await fetch('/api/categories');
  return res.json();
}

export async function fetchBook(categoryId, excludeIds = []) {
  const params = excludeIds.length ? `?exclude=${excludeIds.join(',')}` : '';
  const res = await fetch(`/api/categories/${categoryId}/book${params}`);
  if (!res.ok) return null;
  return res.json();
}
