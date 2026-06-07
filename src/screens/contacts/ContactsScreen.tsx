import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';
import { EmptyState, Button } from '@/components/ui';
import { UserCard } from '@/components/common';

interface ContactsScreenProps {
  navigation: any;
}

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
  isFavorite: boolean;
}

export const ContactsScreen: React.FC<ContactsScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filteredContacts, setFilteredContacts] = React.useState(contacts);

  React.useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredContacts(
        contacts.filter(
          (contact) =>
            contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            contact.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchQuery, contacts]);

  const handleAddContact = () => {
    navigation.navigate('AddContact');
  };

  const handleContactPress = (contact: Contact) => {
    navigation.navigate('Chat', { contactId: contact.id });
  };

  const handleFavoriteToggle = (contactId: string) => {
    setContacts(
      contacts.map((contact) =>
        contact.id === contactId
          ? { ...contact, isFavorite: !contact.isFavorite }
          : contact
      )
    );
  };

  const favoriteContacts = filteredContacts.filter((c) => c.isFavorite);
  const otherContacts = filteredContacts.filter((c) => !c.isFavorite);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.md,
    },
    title: {
      fontSize: FONT_SIZES.xl,
      fontWeight: '700',
      color: colors.text,
    },
    headerIcon: {
      padding: SPACING.sm,
    },
    searchInput: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      fontSize: FONT_SIZES.base,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    content: {
      flex: 1,
    },
    section: {
      marginTop: SPACING.lg,
    },
    sectionTitle: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
      fontSize: FONT_SIZES.sm,
      fontWeight: '600',
      color: colors.primary,
      backgroundColor: colors.surface,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Contacts</Text>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={handleAddContact}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts"
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.content}>
        {filteredContacts.length === 0 ? (
          <EmptyState
            icon="people"
            title="No contacts"
            message="Add contacts to start messaging"
            actionLabel="Add Contact"
            onAction={handleAddContact}
          />
        ) : (
          <FlatList
            data={filteredContacts}
            renderItem={({ item }) => (
              <UserCard
                id={item.id}
                name={item.name}
                avatar={item.avatar}
                status={item.email}
                onPress={() => handleContactPress(item)}
                actionIcon={item.isFavorite ? 'heart' : 'heart-outline'}
                onActionPress={() => handleFavoriteToggle(item.id)}
              />
            )}
            keyExtractor={(item) => item.id}
            scrollEnabled
          />
        )}
      </View>
    </View>
  );
};
