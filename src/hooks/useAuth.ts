import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAuthLoading, setAuthError, signInSuccess, signUpSuccess, signOutSuccess } from '@/store/slices/authSlice';
import { RootState, AppDispatch } from '@/store';
import { authService } from '@/firebase/authService';
import { firestoreService } from '@/firebase/firestoreService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user, token, loading, error } = useSelector((state: RootState) => state.auth);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        dispatch(setAuthLoading(true));
        dispatch(setAuthError(null));

        const result = await authService.signIn(email, password);

        dispatch(signInSuccess(result));
        await AsyncStorage.setItem('authToken', result.token);
        await AsyncStorage.setItem('user', JSON.stringify(result.user));

        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Sign in failed';
        dispatch(setAuthError(errorMessage));
        throw err;
      } finally {
        dispatch(setAuthLoading(false));
      }
    },
    [dispatch]
  );

  const signUp = useCallback(
    async (email: string, password: string, userData: Omit<User, 'id'>) => {
      try {
        dispatch(setAuthLoading(true));
        dispatch(setAuthError(null));

        const result = await authService.signUp(email, password, userData);

        dispatch(signUpSuccess(result));
        await AsyncStorage.setItem('authToken', result.token);
        await AsyncStorage.setItem('user', JSON.stringify(result.user));

        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Sign up failed';
        dispatch(setAuthError(errorMessage));
        throw err;
      } finally {
        dispatch(setAuthLoading(false));
      }
    },
    [dispatch]
  );

  const signOut = useCallback(async () => {
    try {
      dispatch(setAuthLoading(true));
      await authService.signOut();
      dispatch(signOutSuccess());
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    } catch (err: any) {
      const errorMessage = err.message || 'Sign out failed';
      dispatch(setAuthError(errorMessage));
      throw err;
    } finally {
      dispatch(setAuthLoading(false));
    }
  }, [dispatch]);

  const resetPassword = useCallback(
    async (email: string) => {
      try {
        dispatch(setAuthLoading(true));
        await authService.sendPasswordReset(email);
        return true;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to send reset email';
        dispatch(setAuthError(errorMessage));
        throw err;
      } finally {
        dispatch(setAuthLoading(false));
      }
    },
    [dispatch]
  );

  const confirmPasswordReset = useCallback(
    async (code: string, newPassword: string) => {
      try {
        dispatch(setAuthLoading(true));
        await authService.confirmPasswordReset(code, newPassword);
        return true;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to reset password';
        dispatch(setAuthError(errorMessage));
        throw err;
      } finally {
        dispatch(setAuthLoading(false));
      }
    },
    [dispatch]
  );

  return {
    isAuthenticated,
    user,
    token,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    confirmPasswordReset,
  };
};
