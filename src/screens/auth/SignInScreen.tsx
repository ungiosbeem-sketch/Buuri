import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';
import { Button, TextInput, Loading, Snackbar, Dialog } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { ValidationSchemas } from '@/utils/validations';

interface SignInFormData {
  email: string;
  password: string;
}

interface SignInScreenProps {
  navigation: any;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const { signIn, loading, error } = useAuth();
  const [snackbarVisible, setSnackbarVisible] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: yupResolver(ValidationSchemas.signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      await signIn(data.email, data.password);
      navigation.replace('Home');
    } catch (err) {
      setSnackbarVisible(true);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      height: 200,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerText: {
      fontSize: FONT_SIZES['3xl'],
      fontWeight: '700',
      color: '#FFFFFF',
    },
    content: {
      flex: 1,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.xl,
    },
    form: {
      marginBottom: SPACING.lg,
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.md,
    },
    forgotButton: {
      marginTop: SPACING.sm,
      marginBottom: SPACING.lg,
    },
    forgotText: {
      color: colors.primary,
      fontSize: FONT_SIZES.sm,
      fontWeight: '600',
    },
    submitButton: {
      marginBottom: SPACING.lg,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: SPACING.lg,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      marginHorizontal: SPACING.md,
      color: colors.textSecondary,
      fontSize: FONT_SIZES.sm,
    },
    socialButtons: {
      gap: SPACING.md,
      marginBottom: SPACING.lg,
    },
    socialButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: SPACING.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BORDER_RADIUS.md,
      gap: SPACING.md,
    },
    socialText: {
      color: colors.text,
      fontSize: FONT_SIZES.base,
      fontWeight: '600',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    footerText: {
      color: colors.textSecondary,
      fontSize: FONT_SIZES.sm,
    },
    signUpLink: {
      color: colors.primary,
      fontWeight: '600',
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Buuri</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  label="Email"
                  placeholder="Enter your email"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  leftIcon={<Ionicons name="mail" size={20} color={colors.primary} />}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  label="Password"
                  placeholder="Enter your password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showPassword}
                  leftIcon={<Ionicons name="lock-closed" size={20} color={colors.primary} />}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons
                        name={showPassword ? 'eye' : 'eye-off'}
                        size={20}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  }
                  error={errors.password?.message}
                />
              )}
            />
          </View>

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => navigation.navigate('ForgotPassword')}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={styles.submitButton}>
            <Button
              title={loading ? 'Signing in...' : 'Sign In'}
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              disabled={loading}
            />
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
              <Ionicons name="logo-google" size={20} color={colors.primary} />
              <Text style={styles.socialText}>Sign in with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
              <Ionicons name="logo-apple" size={20} color={colors.text} />
              <Text style={styles.socialText}>Sign in with Apple</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SignUp')}
              activeOpacity={0.7}
            >
              <Text style={[styles.footerText, styles.signUpLink]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        message={error || 'Sign in failed'}
        type="error"
        onDismiss={() => setSnackbarVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};
