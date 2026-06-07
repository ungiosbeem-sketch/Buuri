import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';
import { Button, TextInput, Loading, Snackbar, Avatar } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { ValidationSchemas } from '@/utils/validations';
import { firestoreService } from '@/firebase/firestoreService';
import { storageService } from '@/firebase/storageService';

interface EditProfileFormData {
  name: string;
  bio: string;
  phone?: string;
  location?: string;
}

interface EditProfileScreenProps {
  navigation: any;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.avatar);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackType, setSnackType] = useState<'success' | 'error'>('success');

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditProfileFormData>({
    resolver: yupResolver(ValidationSchemas.editProfileSchema),
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || '',
      phone: '',
      location: '',
    },
  });

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setProfileImage(uri);

        // Upload image
        setLoading(true);
        try {
          const blob = await fetch(uri).then((r) => r.blob());
          if (user?.id) {
            const downloadUrl = await storageService.uploadProfilePhoto(user.id, blob);
            setProfileImage(downloadUrl);
            setSnackMessage('Profile photo updated');
            setSnackType('success');
            setSnackbarVisible(true);
          }
        } catch (error) {
          setSnackMessage('Failed to upload photo');
          setSnackType('error');
          setSnackbarVisible(true);
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const onSubmit = async (data: EditProfileFormData) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      await firestoreService.updateUserProfile(user.id, {
        name: data.name,
        bio: data.bio,
        avatar: profileImage,
        updatedAt: Date.now(),
      });

      setSnackMessage('Profile updated successfully');
      setSnackType('success');
      setSnackbarVisible(true);

      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error: any) {
      setSnackMessage(error.message || 'Failed to update profile');
      setSnackType('error');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.md,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: FONT_SIZES.xl,
      fontWeight: '700',
      color: colors.text,
      marginLeft: SPACING.md,
    },
    content: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.lg,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: SPACING.xl,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: SPACING.md,
    },
    editAvatarButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: colors.primary,
      borderRadius: 20,
      padding: SPACING.sm,
    },
    form: {
      marginBottom: SPACING.lg,
    },
    submitButton: {
      marginBottom: SPACING.lg,
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
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Avatar
              size="xl"
              name={user?.name || 'User'}
              source={profileImage ? { uri: profileImage } : undefined}
            />
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange } }) => (
              <TextInput
                label="Full Name"
                placeholder="Enter your name"
                value={value}
                onChangeText={onChange}
                leftIcon={<Ionicons name="person" size={20} color={colors.primary} />}
                error={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="bio"
            render={({ field: { value, onChange } }) => (
              <TextInput
                label="Bio"
                placeholder="Tell us about yourself"
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={4}
                maxLength={500}
                error={errors.bio?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { value, onChange } }) => (
              <TextInput
                label="Phone (optional)"
                placeholder="Enter your phone number"
                value={value}
                onChangeText={onChange}
                keyboardType="phone-pad"
                leftIcon={<Ionicons name="call" size={20} color={colors.primary} />}
              />
            )}
          />

          <Controller
            control={control}
            name="location"
            render={({ field: { value, onChange } }) => (
              <TextInput
                label="Location (optional)"
                placeholder="Enter your location"
                value={value}
                onChangeText={onChange}
                leftIcon={<Ionicons name="location" size={20} color={colors.primary} />}
              />
            )}
          />
        </View>

        <View style={styles.submitButton}>
          <Button
            title="Save Changes"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            disabled={loading}
          />
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        message={snackMessage}
        type={snackType}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};
