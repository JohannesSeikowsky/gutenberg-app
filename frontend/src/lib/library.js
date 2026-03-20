/**Supabase helpers for the user's book library.*/
import supabase from '../supabaseClient'

export async function addToLibrary(userId, bookId, summary) {
  /**Upsert a book into the user's library.*/
  const { error } = await supabase
    .from('user_library')
    .upsert({ user_id: userId, book_id: bookId, summary })
  if (error) throw error
}

export async function removeFromLibrary(userId, bookId) {
  /**Delete a book from the user's library.*/
  const { error } = await supabase
    .from('user_library')
    .delete()
    .eq('user_id', userId)
    .eq('book_id', bookId)
  if (error) throw error
}

export async function getLibrary(userId) {
  /**Fetch all books in the user's library, newest first.*/
  const { data, error } = await supabase
    .from('user_library')
    .select('*')
    .eq('user_id', userId)
    .order('added_at', { ascending: false })
  if (error) throw error
  return data
}
