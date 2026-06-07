import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Query,
  Unsubscribe,
  orderBy,
  limit,
  startAfter,
  Query as FirestoreQuery,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import { Conversation, Message, Contact, User } from '@/types';

class FirestoreService {
  private db = getFirebaseDb();

  // ============= Users =============
  async getUser(userId: string): Promise<User | null> {
    try {
      const docRef = doc(this.db, 'users', userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as User) : null;
    } catch (error: any) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const userRef = doc(this.db, 'users', userId);
      await updateDoc(userRef, { ...updates, updatedAt: Date.now() });
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  subscribeToUser(userId: string, callback: (user: User) => void): Unsubscribe {
    const userRef = doc(this.db, 'users', userId);
    return onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as User);
      }
    });
  }

  // ============= Conversations =============
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const q = query(
        collection(this.db, 'conversations'),
        where('participants', 'array-contains', userId),
        orderBy('lastMessageTime', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => doc.data() as Conversation);
    } catch (error: any) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  }

  subscribeToConversations(
    userId: string,
    callback: (conversations: Conversation[]) => void
  ): Unsubscribe {
    const q = query(
      collection(this.db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const conversations = querySnapshot.docs.map((doc) => doc.data() as Conversation);
      callback(conversations);
    });
  }

  async createConversation(
    userId: string,
    otherUserId: string
  ): Promise<Conversation> {
    try {
      const conversationId = this.generateConversationId(userId, otherUserId);
      const conversationRef = doc(this.db, 'conversations', conversationId);

      // Check if conversation exists
      const existingConv = await getDoc(conversationRef);
      if (existingConv.exists()) {
        return existingConv.data() as Conversation;
      }

      const conversation: Conversation = {
        id: conversationId,
        participants: [userId, otherUserId],
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await setDoc(conversationRef, conversation);
      return conversation;
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  async updateConversation(conversationId: string, updates: Partial<Conversation>): Promise<void> {
    try {
      const convRef = doc(this.db, 'conversations', conversationId);
      await updateDoc(convRef, { ...updates, updatedAt: Date.now() });
    } catch (error: any) {
      console.error('Error updating conversation:', error);
      throw error;
    }
  }

  // ============= Messages =============
  async sendMessage(message: Message): Promise<Message> {
    try {
      const messagesRef = collection(this.db, 'messages');
      const messageRef = doc(messagesRef, message.id);
      await setDoc(messageRef, message);

      // Update conversation's last message
      await this.updateConversation(message.conversationId, {
        lastMessage: message,
        lastMessageTime: message.createdAt,
      });

      return message;
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getMessages(conversationId: string, pageLimit: number = 20): Promise<Message[]> {
    try {
      const q = query(
        collection(this.db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'desc'),
        limit(pageLimit)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map((doc) => doc.data() as Message)
        .reverse();
    } catch (error: any) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  subscribeToMessages(
    conversationId: string,
    callback: (messages: Message[]) => void
  ): Unsubscribe {
    const q = query(
      collection(this.db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map((doc) => doc.data() as Message);
      callback(messages);
    });
  }

  async markMessageAsSeen(messageId: string): Promise<void> {
    try {
      const messageRef = doc(this.db, 'messages', messageId);
      await updateDoc(messageRef, {
        seen: true,
        seenAt: Date.now(),
      });
    } catch (error: any) {
      console.error('Error marking message as seen:', error);
      throw error;
    }
  }

  // ============= Contacts =============
  async getContacts(userId: string): Promise<Contact[]> {
    try {
      const q = query(
        collection(this.db, 'contacts'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => doc.data() as Contact);
    } catch (error: any) {
      console.error('Error getting contacts:', error);
      throw error;
    }
  }

  async addContact(contact: Contact): Promise<Contact> {
    try {
      const contactRef = doc(this.db, 'contacts', contact.id);
      await setDoc(contactRef, contact);
      return contact;
    } catch (error: any) {
      console.error('Error adding contact:', error);
      throw error;
    }
  }

  async removeContact(contactId: string): Promise<void> {
    try {
      const contactRef = doc(this.db, 'contacts', contactId);
      await deleteDoc(contactRef);
    } catch (error: any) {
      console.error('Error removing contact:', error);
      throw error;
    }
  }

  async updateContact(contactId: string, updates: Partial<Contact>): Promise<void> {
    try {
      const contactRef = doc(this.db, 'contacts', contactId);
      await updateDoc(contactRef, updates);
    } catch (error: any) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }

  // ============= Utilities =============
  private generateConversationId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('_');
  }
}

export const firestoreService = new FirestoreService();
