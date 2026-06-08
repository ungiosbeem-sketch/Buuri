import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Video,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { formatDistanceToNow } from 'date-fns';

interface ChatBubbleProps {
  message: {
    id: string;
    text: string;
    sender_id: string;
    created_at: string;
    message_type: string;
    media_url?: string;
    is_read: boolean;
    reactions?: Record<string, string[]>;
  };
  isOwn: boolean;
  onLongPress: () => void;
  onReaction: (emoji: string) => void;
  colors: any;
}

const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function ChatBubble({ message, isOwn, onLongPress, onReaction, colors }: ChatBubbleProps) {
  const [showReactions, setShowReactions] = useState(false);

  const renderMedia = () => {
    if (!message.media_url) return null;

    switch (message.message_type) {
      case 'image':
        return (
          <Image
            source={{ uri: message.media_url }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
        );
      case 'video':
        return (
          <Video
            source={{ uri: message.media_url }}
            style={styles.mediaVideo}
            useNativeControls
            resizeMode="contain"
          />
        );
      case 'audio':
        return (
          <View style={styles.audioContainer}>
            <Icon name="musical-notes" size={24} color={colors.primary} />
            <Text style={[styles.audioText, { color: colors.text }]}>Voice Message</Text>
          </View>
        );
      case 'file':
        return (
          <View style={styles.fileContainer}>
            <Icon name="document" size={24} color={colors.primary} />
            <Text style={[styles.fileText, { color: colors.text }]}>{message.text}</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      onLongPress={onLongPress}
      activeOpacity={0.7}
      onPress={() => setShowReactions(!showReactions)}
    >
      <View style={[
        styles.bubbleContainer,
        isOwn ? styles.ownBubbleContainer : styles.otherBubbleContainer,
      ]}>
        <View style={[
          styles.bubble,
          {
            backgroundColor: isOwn ? colors.primary : colors.surface,
            alignSelf: isOwn ? 'flex-end' : 'flex-start',
          },
        ]}>
          {message.reply_to && (
            <View style={styles.replyPreview}>
              <Text style={[styles.replyText, { color: colors.textSecondary }]}>
                ↳ Reply to message
              </Text>
            </View>
          )}

          {renderMedia()}
          
          {message.text !== '' && (
            <Text style={[
              styles.messageText,
              { color: isOwn ? 'white' : colors.text },
            ]}>
              {message.text}
            </Text>
          )}

          <View style={styles.messageFooter}>
            <Text style={[
              styles.timestamp,
              { color: isOwn ? 'rgba(255,255,255,0.7)' : colors.textSecondary },
            ]}>
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </Text>
            
            {isOwn && (
              <Icon
                name={message.is_read ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={isOwn ? 'rgba(255,255,255,0.7)' : colors.textSecondary}
                style={styles.statusIcon}
              />
            )}
          </View>

          {/* Reactions */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <View style={styles.reactionsContainer}>
              {Object.entries(message.reactions).map(([emoji, users]) => (
                <View key={emoji} style={styles.reactionBadge}>
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  <Text style={styles.reactionCount}>{users.length}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Emoji Reaction Picker */}
        {showReactions && (
          <View style={[
            styles.emojiPicker,
            isOwn ? styles.ownEmojiPicker : styles.otherEmojiPicker,
            { backgroundColor: colors.surface, shadowColor: colors.text },
          ]}>
            {commonEmojis.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => {
                  onReaction(emoji);
                  setShowReactions(false);
                }}
                style={styles.emojiOption}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = {
  bubbleContainer: {
    marginVertical: 4,
  },
  ownBubbleContainer: {
    alignItems: 'flex-end',
  },
  otherBubbleContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  replyPreview: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  replyText: {
    fontSize: 12,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 10,
    marginRight: 4,
  },
  statusIcon: {
    marginLeft: 2,
  },
  mediaImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  mediaVideo: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  audioText: {
    marginLeft: 8,
    fontSize: 14,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  fileText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  reactionsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  reactionBadge: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 10,
    marginLeft: 2,
  },
  emojiPicker: {
    position: 'absolute',
    bottom: -40,
    flexDirection: 'row',
    padding: 8,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ownEmojiPicker: {
    right: 0,
  },
  otherEmojiPicker: {
    left: 0,
  },
  emojiOption: {
    padding: 4,
  },
  emojiText: {
    fontSize: 20,
  },
};
