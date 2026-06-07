import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SPACING, BORDER_RADIUS } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

interface AvatarProps {
  source?: { uri: string };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  name?: string;
  onPress?: () => void;
  loading?: boolean;
}

const getSizeValue = (size: string): number => {
  switch (size) {
    case 'sm':
      return 32;
    case 'md':
      return 48;
    case 'lg':
      return 64;
    case 'xl':
      return 96;
    default:
      return 48;
  }
};

export const Avatar: React.FC<AvatarProps> = ({
  source,
  size = 'md',
  name = '',
  onPress,
  loading = false,
}) => {
  const { colors } = useTheme();
  const dimension = getSizeValue(size);

  const getInitials = (text: string): string => {
    return text
      .split(' ')
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join('');
  };

  const styles = StyleSheet.create({
    container: {
      width: dimension,
      height: dimension,
      borderRadius: dimension / 2,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    fallback: {
      width: '100%',
      height: '100%',
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    initials: {
      fontSize: dimension / 2.5,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });

  const renderContent = () => {
    if (loading) {
      return (
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }

    if (source) {
      return <Image source={source} style={styles.image} />;
    }

    return (
      <View style={styles.fallback}>
        <Text style={styles.initials}>{getInitials(name)}</Text>
      </View>
    );
  };

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return renderContent();
};
