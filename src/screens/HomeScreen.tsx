import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';

// Components
import Avatar from '../components/ui/Avatar';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Services
import { supabase } from '../services/supabase';

// Store
import useThemeStore from '../store/themeStore';
import { useAuthStore } from '../store/authStore';

// Types
interface Conversation {
  id: string;
  other_user: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string;
    online_status: boolean;
    last_seen: string;
  };
  last_message: {
    text: string;
    created_at: string;
    sender_id: string;
    is_read: boolean;
  };
  unread_count: number;
  is_muted: boolean;
  is_archived: boolean;
}

type TabType = 'all' | 'unread' | 'mentions';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const colors = isDarkMode ? darkColors : lightColors;

  // Fetch conversations
  const fetchConversations = async () => {
    if (!user) return [];

    // Get all conversations where user is a member
    const { data: memberships, error: membersError } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (membersError) throw membersError;

    const conversationIds = memberships.map(m => m.conversation_id);

    if (conversationIds.length === 0) return [];

    // Get conversations with last message and other user info
    const { data: conversationsData, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        created_at,
        conversation_members!inner (
          user_id,
          profiles:user_id (
            id,
            full_name,
            username,
            avatar_url
          )
        ),
        messages (
          id,
          text,
          created_at,
          sender_id,
          is_read
        )
      `)
      .in('id', conversationIds)
      .order('created_at', { ascending: false });

    if (convError) throw convError;

    // Transform data
    const transformed: Conversation[] = conversationsData.map(conv => {
      const otherMember = conv.conversation_members.find(m => m.user_id !== user.id);
      const lastMessage = conv.messages[0];

      // Get unread count
      const unreadCount = conv.messages.filter(
        m => !m.is_read && m.sender_id !== user.id
      ).length;

      return {
        id: conv.id,
        other_user: {
          id: otherMember?.profiles.id,
          full_name: otherMember?.profiles.full_name,
          username: otherMember?.profiles.username,
          avatar_url: otherMember?.profiles.avatar_url,
          online_status: false, // Will be updated via presence
          last_seen: new Date().toISOString(),
        },
        last_message: lastMessage ? {
          text: lastMessage.text,
          created_at: lastMessage.created_at,
          sender_id: lastMessage.sender_id,
          is_read: lastMessage.is_read,
        } : null,
        unread_count: unreadCount,
        is_muted: false,
        is_archived: false,
      };
    });

    // Filter based on tab
    let filtered = transformed;
    if (activeTab === 'unread') {
      filtered = filtered.filter(c => c.unread_count > 0);
    }

    // Filter based on search
    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.other_user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.other_user.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['conversations', user?.id, activeTab, searchQuery],
    queryFn: fetchConversations,
    enabled: !!user,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      userId: conversation.other_user.id,
    });
  };

  const handleDeleteConversation = async (conversationId: string) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('conversation_members')
              .delete()
              .eq('conversation_id', conversationId)
              .eq('user_id', user?.id);
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
          },
        },
      ]
    );
  };

  const handleArchiveConversation = async (conversationId: string) => {
    // Implementation for archiving
    Alert.alert('Archived', 'Conversation has been archived');
  };

  const handleMuteConversation = async (conversationId: string) => {
    Alert.alert('Muted', 'Notifications for this conversation have been muted');
  };

  const renderRightActions = (conversation: Conversation) => {
    return (
      <View style={{ flexDirection: 'row', marginLeft: 10 }}>
        <TouchableOpacity
          style={[styles.swipeAction, { backgroundColor: '#EF4444' }]}
          onPress={() => handleDeleteConversation(conversation.id)}
        >
          <Icon name="trash-outline" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeAction, { backgroundColor: '#F59E0B' }]}
          onPress={() => handleArchiveConversation(conversation.id)}
        >
          <Icon name="archive-outline" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeAction, { backgroundColor: '#6366F1' }]}
          onPress={() => handleMuteConversation(conversation.id)}
        >
          <Icon 
            name={conversation.is_muted ? "volume-high-outline" : "volume-mute-outline"} 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <Swipeable renderRightActions={() => renderRightActions(item)}>
      <TouchableOpacity
        style={[styles.conversationItem, { backgroundColor: colors.surface }]}
        onPress={() => handleConversationPress(item)}
      >
        <View style={styles.avatarContainer}>
          <Avatar
            source={item.other_user.avatar_url}
            size={56}
            online={item.other_user.online_status}
          />
        </View>

        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {item.other_user.full_name}
            </Text>
            <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
              {item.last_message && formatDistanceToNow(new Date(item.last_message.created_at), { addSuffix: true })}
            </Text>
          </View>

          <View style={styles.messagePreview}>
            <Text 
              style={[
                styles.lastMessage, 
                { color: item.unread_count > 0 ? colors.text : colors.textSecondary },
                item.unread_count > 0 && styles.unreadMessage
              ]}
              numberOfLines={1}
            >
              {item.last_message?.sender_id === user?.id && 'You: '}
              {item.last_message?.text || 'No messages yet'}
            </Text>

            {item.unread_count > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadCount}>{item.unread_count}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="chatbubbles-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        No conversations yet
      </Text>
      <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
        Start a new chat from the contacts tab
      </Text>
    </View>
  );

  if (isLoading && !data) {
    return <LoadingSpinner />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Icon name="search-outline" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search conversations..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['all', 'unread', 'mentions'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && [styles.activeTab, { borderBottomColor: colors.primary }],
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? colors.primary : colors.textSecondary },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
            {activeTab === tab && (
              <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Conversations List */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderConversationItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={EmptyState}
        contentContainerStyle={data?.length === 0 && styles.emptyList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
  },
  messagePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
  },
  unreadMessage: {
    fontWeight: '500',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    marginVertical: 4,
    borderRadius: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    marginTop: 8,
  },
  emptyList: {
    flexGrow: 1,
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
