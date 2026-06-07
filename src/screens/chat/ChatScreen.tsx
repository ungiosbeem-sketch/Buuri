import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';
import { Button, TextInput, Loading, EmptyState } from '@/components/ui';
import { MessageBubble } from '@/components/common';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';

interface ChatScreenProps {
  route: any;
  navigation: any;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ route, navigation }) => {
  const { conversationId } = route.params;
  const { colors } = useTheme();
  const { user } = useAuth();
  const { messages, loading, loadMessages, sendMessage } = useChat();
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    loadMessages(conversationId);
  }, [conversationId]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user?.id) return;

    try {
      await sendMessage(
        conversationId,
        user.id,
        '', // receiverId would come from conversation
        messageText,
        'text'
      );
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: FONT_SIZES.lg,
      fontWeight: '600',
      color: colors.text,
    },
    messagesContainer: {
      flex: 1,
      paddingVertical: SPACING.md,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
      gap: SPACING.sm,
    },
    input: {
      flex: 1,
    },
    sendButton: {
      padding: SPACING.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (loading) {
    return <Loading />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons name="call" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <EmptyState
            icon="chatbox-ellipses"
            title="No messages"
            message="Start the conversation"
          />
        ) : (
          <FlatList
            data={messages}
            renderItem={({ item }) => (
              <MessageBubble
                content={item.content}
                timestamp={item.createdAt}
                isOwn={item.senderId === user?.id}
                type={item.type as any}
                mediaUrl={item.mediaUrl}
                seen={item.seen}
              />
            )}
            keyExtractor={(item) => item.id}
            inverted
          />
        )}
      </View>

      <View style={styles.inputContainer}>
        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={messageText}
          onChangeText={setMessageText}
          multiline
          numberOfLines={1}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSendMessage}
          activeOpacity={0.7}
        >
          <Ionicons
            name="send"
            size={24}
            color={messageText.trim() ? colors.primary : colors.border}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};
