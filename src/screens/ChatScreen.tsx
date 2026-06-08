import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActionSheetIOS,
  Modal,
  Animated,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';

// Components
import ChatBubble from '../components/ui/ChatBubble';
import TypingIndicator from '../components/ui/TypingIndicator';
import EmojiPicker from '../components/Chat/EmojiPicker';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Services
import { supabase } from '../services/supabase';
import { uploadMedia } from '../services/storageService';

// Hooks
import { useMessages } from '../hooks/useMessages';
import { usePresence } from '../hooks/usePresence';

// Store
import useThemeStore from '../store/themeStore';
import { useAuthStore } from '../store/authStore';

// Types
interface Message {
  id: string;
  text: string;
  sender_id: string;
  created_at: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'file';
  media_url?: string;
  reply_to?: string;
  is_read: boolean;
  reactions?: Record<string, string[]>;
}

export default function ChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { conversationId, userId } = route.params as any;
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const colors = isDarkMode ? darkColors : lightColors;
  const { data: messages, isLoading, sendMessage, deleteMessage } = useMessages(conversationId);
  const { isOnline, lastSeen } = usePresence(userId);

  // Setup typing indicator
  const handleTyping = useCallback(async () => {
    const channel = supabase.channel(`typing:${conversationId}`);
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user?.id, is_typing: true },
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(async () => {
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: user?.id, is_typing: false },
      });
    }, 1000);
  }, [conversationId, user?.id]);

  const handleSend = async () => {
    if (!inputText.trim() && !replyingTo) return;

    await sendMessage({
      text: inputText,
      reply_to: replyingTo?.id,
    });

    setInputText('');
    setReplyingTo(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const mediaUrl = await uploadMedia(result.assets[0].uri, 'image');
      await sendMessage({
        text: '',
        message_type: 'image',
        media_url: mediaUrl,
      });
    }
  };

  const handleVideoPick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const mediaUrl = await uploadMedia(result.assets[0].uri, 'video');
      await sendMessage({
        text: '',
        message_type: 'video',
        media_url: mediaUrl,
      });
    }
  };

  const handleFilePick = async () => {
    const result = await DocumentPicker.getDocumentAsync({});
    if (result.type === 'success') {
      const fileUrl = await uploadMedia(result.uri, 'file');
      await sendMessage({
        text: result.name,
        message_type: 'file',
        media_url: fileUrl,
      });
    }
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    setIsRecording(false);

    if (uri) {
      const audioUrl = await uploadMedia(uri, 'audio');
      await sendMessage({
        text: '',
        message_type: 'audio',
        media_url: audioUrl,
      });
    }
  };

  const handleLongPress = (message: Message) => {
    setSelectedMessage(message);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Reply', 'Copy', 'Delete', 'Forward'],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            setReplyingTo(message);
          } else if (buttonIndex === 2) {
            // Copy to clipboard
          } else if (buttonIndex === 3) {
            deleteMessage(message.id);
          }
        }
      );
    } else {
      setShowActions(true);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    // Update reactions in database
    await supabase
      .from('messages')
      .update({
        reactions: supabase.sql`jsonb_set(reactions, '{${emoji}}', coalesce(reactions->>'${emoji}', '[]') || '["${user?.id}"]')`,
      })
      .eq('id', messageId);
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const showDateSeparator = index === 0 || 
      format(new Date(item.created_at), 'yyyy-MM-dd') !== 
      format(new Date(messages[index - 1]?.created_at), 'yyyy-MM-dd');

    return (
      <>
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {format(new Date(item.created_at), 'MMMM d, yyyy')}
            </Text>
          </View>
        )}
        <ChatBubble
          message={item}
          isOwn={item.sender_id === user?.id}
          onLongPress={() => handleLongPress(item)}
          onReaction={(emoji) => addReaction(item.id, emoji)}
          colors={colors}
        />
      </>
    );
  };

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: false });
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: colors.text }]}>Chat User</Text>
          <Text style={[styles.headerStatus, { color: colors.textSecondary }]}>
            {isOnline ? 'Online' : `Last seen ${lastSeen}`}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Icon name="information-circle-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          contentContainerStyle={styles.messagesContainer}
        />
      )}

      {/* Typing Indicator */}
      <TypingIndicator conversationId={conversationId} />

      {/* Reply Preview */}
      {replyingTo && (
        <View style={[styles.replyPreview, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={styles.replyContent}>
            <Text style={[styles.replyLabel, { color: colors.primary }]}>Replying to</Text>
            <Text style={[styles.replyText, { color: colors.text }]} numberOfLines={1}>
              {replyingTo.text}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setReplyingTo(null)}>
            <Icon name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Input Area */}
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity onPress={() => setShowEmojiPicker(!showEmojiPicker)} style={styles.inputButton}>
          <Icon name="happy-outline" size={24} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleImagePick} style={styles.inputButton}>
          <Icon name="image-outline" size={24} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleVideoPick} style={styles.inputButton}>
          <Icon name="videocam-outline" size={24} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleFilePick} style={styles.inputButton}>
          <Icon name="attach-outline" size={24} color={colors.primary} />
        </TouchableOpacity>

        <TextInput
          style={[styles.textInput, { backgroundColor: colors.background, color: colors.text }]}
          placeholder="Type a message..."
          placeholderTextColor={colors.textSecondary}
          value={inputText}
          onChangeText={(text) => {
            setInputText(text);
            handleTyping();
          }}
          multiline
        />

        {isRecording ? (
          <TouchableOpacity onPress={stopRecording} style={[styles.recordButton, styles.recordingActive]}>
            <Icon name="mic" size={24} color="white" />
          </TouchableOpacity>
        ) : inputText.trim() ? (
          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
            <Icon name="send" size={24} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPressIn={startRecording} onPressOut={stopRecording} style={styles.recordButton}>
            <Icon name="mic-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Emoji Picker Modal */}
      <Modal visible={showEmojiPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.emojiPickerContainer, { backgroundColor: colors.surface }]}>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setInputText(inputText + emoji);
                setShowEmojiPicker(false);
              }}
            />
            <TouchableOpacity onPress={() => setShowEmojiPicker(false)} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Action Modal for Android */}
      <Modal visible={showActions} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowActions(false)}>
          <View style={[styles.actionModal, { backgroundColor: colors.surface }]}>
            <TouchableOpacity style={styles.actionOption} onPress={() => {
              if (selectedMessage) setReplyingTo(selectedMessage);
              setShowActions(false);
            }}>
              <Icon name="return-up-back-outline" size={24} color={colors.text} />
              <Text style={[styles.actionText, { color: colors.text }]}>Reply</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionOption} onPress={() => {
              setShowActions(false);
            }}>
              <Icon name="copy-outline" size={24} color={colors.text} />
              <Text style={[styles.actionText, { color: colors.text }]}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionOption} onPress={() => {
              if (selectedMessage) deleteMessage(selectedMessage.id);
              setShowActions(false);
            }}>
              <Icon name="trash-outline" size={24} color="#EF4444" />
              <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  headerAction: {
    padding: 8,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  replyContent: {
    flex: 1,
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  inputButton: {
    padding: 8,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingActive: {
    backgroundColor: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  emojiPickerContainer: {
    height: 300,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  actionModal: {
    margin: 20,
    borderRadius: 12,
    padding: 16,
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionText: {
    marginLeft: 12,
    fontSize: 16,
  },
};

const lightColors = {
  background: '#F0F2F5',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  primary: '#3B82F6',
};

const darkColors = {
  background: '#121212',
  surface: '#1E1E1E',
  text: '#E5E7EB',
  textSecondary: '#9CA3AF',
  border: '#2C2C2C',
  primary: '#3B82F6',
};
