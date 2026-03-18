"""One-time script to populate category_summary_books table from book_categories + book_summaries."""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

supabase = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_KEY'])

# Fetch all summaries
print("Fetching book_summaries...")
summaries = {}
offset = 0
while True:
    result = supabase.table('book_summaries').select('book_id, summary').range(offset, offset + 999).execute()
    if not result.data:
        break
    for row in result.data:
        summaries[row['book_id']] = row['summary']
    offset += 1000
print(f"Found {len(summaries)} books with summaries.")

# Fetch all category assignments
print("Fetching book_categories...")
categories = []
offset = 0
while True:
    result = supabase.table('book_categories').select('book_id, category_id').range(offset, offset + 999).execute()
    if not result.data:
        break
    categories.extend(result.data)
    offset += 1000
print(f"Found {len(categories)} category assignments.")

# Join: only keep category assignments for books that have summaries
rows = []
for cat in categories:
    bid = cat['book_id']
    if bid in summaries:
        rows.append({
            'category_id': cat['category_id'],
            'book_id': bid,
            'summary': summaries[bid],
        })

print(f"Joined result: {len(rows)} rows to insert.")

# Insert in batches
BATCH_SIZE = 500
for i in range(0, len(rows), BATCH_SIZE):
    batch = rows[i:i + BATCH_SIZE]
    supabase.table('category_summary_books').upsert(batch).execute()
    print(f"Inserted {min(i + BATCH_SIZE, len(rows))}/{len(rows)} rows...")

print("Done.")
