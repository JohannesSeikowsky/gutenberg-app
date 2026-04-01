"""One-time script to upload wikipedia_links.txt into Supabase."""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

supabase = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_KEY'])

txt_path = os.path.join(os.path.dirname(__file__), '..', 'wikipedia_links.txt')

BATCH_SIZE = 500
batch = []
count = 0

with open(txt_path, 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        book_id, urls = line.split(',', 1)
        for url in urls.strip().split():
            batch.append({'book_id': int(book_id), 'url': url})
        if len(batch) >= BATCH_SIZE:
            supabase.table('wikipedia_links').insert(batch).execute()
            count += len(batch)
            print(f"Uploaded {count} rows...")
            batch = []

if batch:
    supabase.table('wikipedia_links').insert(batch).execute()
    count += len(batch)

print(f"Done. Total: {count} rows uploaded.")
