/**Supabase helpers for reading progress tracking.*/
import supabase from '../supabaseClient'

export async function saveProgress(userId, bookId, textSnippet) {
  /**Upsert reading position as a text snippet.*/
  const { error } = await supabase
    .from('reading_progress')
    .upsert({
      user_id: userId,
      book_id: bookId,
      text_snippet: textSnippet,
      updated_at: new Date().toISOString(),
    })
  if (error) throw error
}

export async function loadProgress(userId, bookId) {
  /**Fetch saved text snippet for a book, or null.*/
  const { data, error } = await supabase
    .from('reading_progress')
    .select('text_snippet')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .maybeSingle()
  if (error) throw error
  return data?.text_snippet ?? null
}
