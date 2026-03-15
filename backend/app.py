"""Flask backend for Gutenberg app."""
import os
import random
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

app = Flask(__name__)
CORS(app)

supabase = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_KEY'])

CATEGORIES = {
    633: "Literature - Other", 634: "Short Stories", 635: "Historical Novels",
    636: "Children & Young Adult Reading", 637: "Poetry", 638: "Science-Fiction & Fantasy",
    639: "Romance", 640: "Crime, Thrillers and Mystery", 641: "Humour",
    642: "Plays/Films/Dramas", 643: "Biographies", 644: "Adventure",
    645: "Novels", 646: "Mythology, Legends & Folklore", 647: "Essays, Letters & Speeches",
    648: "Travel Writing", 649: "Classics of Literature", 650: "Russian Literature",
    651: "German Literature", 652: "French Literature", 653: "British Literature",
    654: "American Literature", 655: "History - Other", 656: "History - American",
    657: "History - British", 658: "History - European", 659: "History - Ancient",
    660: "History - Medieval/Middle Ages", 661: "History - Early Modern (c. 1450-1750)",
    662: "History - Modern (1750+)", 663: "History - Religious", 664: "History - Royalty",
    665: "History - Warfare", 666: "History - Schools & Universities",
    667: "Science - Physics", 668: "Science - Chemistry/Biochemistry",
    669: "Science - Biology", 670: "Science - Earth/Agricultural/Farming",
    671: "Engineering & Technology", 672: "Mathematics",
    673: "Research Methods/Statistics/Information Sys", 674: "Architecture",
    675: "Art", 676: "Fashion", 677: "Music", 678: "Cooking & Drinking",
    679: "How To ...", 680: "Sports/Hobbies", 681: "Health & Medicine",
    682: "Drugs/Alcohol/Pharmacology", 683: "Nature/Gardening/Animals",
    684: "Nutrition", 685: "Environmental Issues", 686: "Archaeology & Anthropology",
    687: "Language & Communication", 688: "Psychiatry/Psychology",
    689: "Law & Criminology", 690: "Gender & Sexuality Studies",
    691: "Philosophy & Ethics", 692: "Religion/Spirituality", 693: "Sociology",
    694: "Politics", 695: "Business/Management", 696: "Economics",
    697: "Encyclopedias/Dictionaries/Reference", 698: "Journalism/Media/Writing",
    699: "Journals", 700: "Old Age & the Elderly", 701: "Parenthood & Family Relations",
    702: "Reports & Conference Proceedings", 703: "Sexuality & Erotica",
    704: "Teaching & Education",
}


@app.route('/api/categories')
def get_categories():
    """Return all book categories."""
    cats = [{'id': k, 'name': v} for k, v in CATEGORIES.items()]
    return jsonify(cats)


@app.route('/api/categories/<int:category_id>/book')
def get_book(category_id):
    """Return one random book from a category, excluding already-seen IDs."""
    if category_id not in CATEGORIES:
        return jsonify({'error': 'Category not found'}), 404

    exclude = request.args.get('exclude', '')
    exclude_ids = [int(x) for x in exclude.split(',') if x.strip()]

    # Get all book IDs in this category
    cat_query = supabase.table('book_categories').select('book_id').eq('category_id', category_id)
    if exclude_ids:
        cat_query = cat_query.not_.in_('book_id', exclude_ids)
    cat_result = cat_query.limit(1000).execute()

    if not cat_result.data:
        return jsonify({'error': 'No more books in this category'}), 404

    # Filter to only books that have summaries
    book_ids = [b['book_id'] for b in cat_result.data]
    summary_result = supabase.table('book_summaries').select('book_id, summary').in_('book_id', book_ids).execute()

    if not summary_result.data:
        return jsonify({'error': 'No more books in this category'}), 404

    book = random.choice(summary_result.data)
    return jsonify({'book_id': book['book_id'], 'summary': book['summary']})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
