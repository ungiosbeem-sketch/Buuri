import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Environment variables validation
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('❌ Missing EXPO_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('❌ Missing EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

console.log('✅ Supabase configured with URL:', supabaseUrl);

// Custom storage adapter for React Native
const customStorage = {
  getItem: async (key: string) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value;
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in storage:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  },
};

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'x-application-name': 'messaging-app',
      'x-platform': Platform.OS,
    },
  },
});

// Track online status
let presenceChannel: any = null;

// Initialize realtime presence
export const initializePresence = async (userId: string) => {
  if (presenceChannel) {
    await presenceChannel.unsubscribe();
  }

  presenceChannel = supabase.channel('online-users', {
    config: {
      presence: {
        key: userId,
      },
    },
  });

  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      console.log('Online users:', Object.keys(state).length);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User joined:', key);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('User left:', key);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({
          user_id: userId,
          online_at: new Date().toISOString(),
          device: Platform.OS,
        });
      }
    });

  return presenceChannel;
};

// Handle app state changes
AppState.addEventListener('change', async (state) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user && presenceChannel) {
    if (state === 'active') {
      await presenceChannel.track({
        user_id: user.id,
        online_at: new Date().toISOString(),
        device: Platform.OS,
      });
      supabase.realtime.connect();
    } else if (state === 'background') {
      await presenceChannel.untrack();
      supabase.realtime.disconnect();
    }
  }
});

// Helper function to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

// Helper function to get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Helper function to get current session
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
};

// User profile functions
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
};

// Message functions
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  text: string,
  messageType: string = 'text',
  mediaUrl?: string,
  replyTo?: string
) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        text,
        message_type: messageType,
        media_url: mediaUrl,
        reply_to: replyTo,
        created_at: new Date().toISOString(),
        is_read: false,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update conversation last message time
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
    
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const markMessageAsRead = async (messageId: string) => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', messageId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking message as read:', error);
    return false;
  }
};

export const deleteMessage = async (messageId: string) => {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting message:', error);
    return false;
  }
};

export const addMessageReaction = async (messageId: string, userId: string, emoji: string) => {
  try {
    // Get current reactions
    const { data: message } = await supabase
      .from('messages')
      .select('reactions')
      .eq('id', messageId)
      .single();
    
    let reactions = message?.reactions || {};
    
    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }
    
    if (!reactions[emoji].includes(userId)) {
      reactions[emoji].push(userId);
    } else {
      reactions[emoji] = reactions[emoji].filter((id: string) => id !== userId);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    }
    
    const { error } = await supabase
      .from('messages')
      .update({ reactions })
      .eq('id', messageId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding reaction:', error);
    return false;
  }
};

// Conversation functions
export const getOrCreateConversation = async (userId1: string, userId2: string) => {
  try {
    // Check if conversation already exists
    const { data: existingConversation } = await supabase
      .rpc('get_conversation_between_users', {
        user_id_1: userId1,
        user_id_2: userId2,
      });
    
    if (existingConversation && existingConversation.length > 0) {
      return existingConversation[0];
    }
    
    // Create new conversation
    const { data: newConversation, error: convError } = await supabase
      .from('conversations')
      .insert({ created_at: new Date().toISOString() })
      .select()
      .single();
    
    if (convError) throw convError;
    
    // Add members
    await supabase
      .from('conversation_members')
      .insert([
        { conversation_id: newConversation.id, user_id: userId1 },
        { conversation_id: newConversation.id, user_id: userId2 },
      ]);
    
    return newConversation;
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    return null;
  }
};

export const getConversations = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('conversation_members')
      .select(`
        conversation_id,
        conversations!inner (
          id,
          created_at,
          updated_at,
          messages (
            id,
            text,
            created_at,
            sender_id,
            is_read,
            message_type,
            media_url
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { foreignTable: 'conversations', ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting conversations:', error);
    return [];
  }
};

// Typing status
export const sendTypingStatus = async (conversationId: string, userId: string, isTyping: boolean) => {
  try {
    const channel = supabase.channel(`typing:${conversationId}`);
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: userId, is_typing: isTyping, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error('Error sending typing status:', error);
  }
};

// File upload functions
export const uploadFile = async (fileUri: string, fileType: string): Promise<string | null> => {
  try {
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const fileExt = fileUri.split('.').pop();
    const filePath = `${fileType}s/${fileName}.${fileExt}`;
    
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Convert base64 to blob
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: `image/${fileExt}` });
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('message-attachments')
      .upload(filePath, blob, {
        contentType: `image/${fileExt}`,
        upsert: false,
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('message-attachments')
      .getPublicUrl(filePath);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
};

// Search functions
export const searchMessages = async (conversationId: string, searchTerm: string) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .ilike('text', `%${searchTerm}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error searching messages:', error);
    return [];
  }
};

export const searchUsers = async (searchTerm: string, currentUserId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', currentUserId)
      .or(`full_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
      .limit(20);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

// Notification functions
export const registerPushToken = async (userId: string, pushToken: string) => {
  try {
    const { error } = await supabase
      .from('user_devices')
      .upsert({
        user_id: userId,
        push_token: pushToken,
        device_type: Platform.OS,
        last_active: new Date().toISOString(),
      }, {
        onConflict: 'user_id,device_type',
      });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error registering push token:', error);
    return false;
  }
};

// Block user functions
export const blockUser = async (userId: string, blockedUserId: string) => {
  try {
    const { error } = await supabase
      .from('blocked_users')
      .insert({
        user_id: userId,
        blocked_user_id: blockedUserId,
        created_at: new Date().toISOString(),
      });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error blocking user:', error);
    return false;
  }
};

export const unblockUser = async (userId: string, blockedUserId: string) => {
  try {
    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('user_id', userId)
      .eq('blocked_user_id', blockedUserId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error unblocking user:', error);
    return false;
  }
};

// Archive conversation
export const archiveConversation = async (conversationId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('conversation_members')
      .update({ is_archived: true, archived_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error archiving conversation:', error);
    return false;
  }
};

// Mute conversation
export const muteConversation = async (conversationId: string, userId: string, duration: '1h' | '8h' | '24h' | 'forever') => {
  try {
    let mutedUntil = null;
    if (duration !== 'forever') {
      const hours = duration === '1h' ? 1 : duration === '8h' ? 8 : 24;
      mutedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    }
    
    const { error } = await supabase
      .from('conversation_members')
      .update({ 
        is_muted: true, 
        muted_until: mutedUntil,
        muted_at: new Date().toISOString(),
      })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error muting conversation:', error);
    return false;
  }
};

// Cleanup function
export const cleanup = async () => {
  if (presenceChannel) {
    await presenceChannel.unsubscribe();
  }
  supabase.realtime.disconnect();
};

// Export types
export type SupabaseClient = typeof supabase;
export type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'file';
  media_url: string | null;
  reply_to: string | null;
  created_at: string;
  is_read: boolean;
  read_at: string | null;
  reactions: Record<string, string[]>;
};

export type Conversation = {
  id: string;
  created_at: string;
  updated_at: string;
};

export type ConversationMember = {
  id: string;
  conversation_id: string;
  user_id: string;
  is_archived: boolean;
  is_muted: boolean;
  muted_until: string | null;
  created_at: string;
};
