import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL!;

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

/* =========================
   AUTH
========================= */

export const signUp = async (
  email: string,
  password: string
) => {
  const { data, error } =
    await supabase.auth.signUp({
      email,
      password,
    });

  return { data, error };
};

export const signIn = async (
  email: string,
  password: string
) => {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  return { data, error };
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  return await supabase.auth.getUser();
};

/* =========================
   PROFILES
========================= */

export const getProfile = async (
  userId: string
) => {
  return await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
};

export const updateProfile = async (
  userId: string,
  updates: any
) => {
  return await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
};

/* =========================
   CHATS
========================= */

export const getChats = async (
  userId: string
) => {
  return await supabase
    .from('chat_members')
    .select(`
      *,
      chats (*)
    `)
    .eq('user_id', userId);
};

/* =========================
   MESSAGES
========================= */

export const getMessages = async (
  chatId: string
) => {
  return await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at');
};

export const sendMessage = async (
  chatId: string,
  senderId: string,
  message: string
) => {
  return await supabase
    .from('messages')
    .insert([
      {
        chat_id: chatId,
        sender_id: senderId,
        message,
      },
    ]);
};

/* =========================
   IMAGE UPLOAD
========================= */

export const uploadImage = async (
  uri: string,
  fileName: string
) => {
  const response = await fetch(uri);
  const blob = await response.blob();

  const { data, error } =
    await supabase.storage
      .from('chat-media')
      .upload(fileName, blob, {
        upsert: true,
      });

  return { data, error };
};

/* =========================
   REALTIME
========================= */

export const subscribeToMessages = (
  chatId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`chat-${chatId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      },
      callback
    )
    .subscribe();
};

export default supabase;
