"""One-time script to import wiki-based-summaries.csv into Supabase."""
import csv
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

supabase = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_KEY'])

csv_path = os.path.join(os.path.dirname(__file__), '..', 'wiki-based-summaries.csv')

BATCH_SIZE = 500
batch = []
count = 0

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        batch.append({
            'book_id': int(row['book_id']),
            'summary': row['summary']
        })
        if len(batch) >= BATCH_SIZE:
            supabase.table('book_summaries').upsert(batch).execute()
            count += len(batch)
            print(f"Imported {count} rows...")
            batch = []

if batch:
    supabase.table('book_summaries').upsert(batch).execute()
    count += len(batch)

print(f"Done. Total: {count} rows imported.")
