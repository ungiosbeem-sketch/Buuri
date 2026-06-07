import { renderHook, act } from '@testing-library/react-native';
import { useAuth } from '@/hooks/useAuth';
import { Provider } from 'react-redux';
import { store } from '@/store';

describe('useAuth Hook', () => {
  const wrapper = ({ children }: any) => <Provider store={store}>{children}</Provider>;

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should have signIn method', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(typeof result.current.signIn).toBe('function');
  });

  it('should have signUp method', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(typeof result.current.signUp).toBe('function');
  });

  it('should have signOut method', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(typeof result.current.signOut).toBe('function');
  });
});
