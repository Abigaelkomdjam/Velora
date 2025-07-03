import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';

type Toast = { id: string; text: string; type?: 'error' | 'success' };
type ToastContextType = { showToast: (text: string, type?: 'error' | 'success') => void };

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((text: string, type: 'error' | 'success' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, text, type }]);
    // auto-remove after 3s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View pointerEvents="box-none" style={styles.container}>
        {toasts.map((toast, i) => (
          <Animated.View key={toast.id} style={[styles.toast, toast.type === 'error' && styles.error, { bottom: 20 + i * 60 }]}>
            <Text style={styles.text}>{toast.text}</Text>
          </Animated.View>
        ))}
      </View>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width,
    alignItems: 'center',
  },
  toast: {
    position: 'absolute',
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: '60%',
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  error: {
    backgroundColor: '#D32F2F',
  },
  text: {
    color: '#fff',
    textAlign: 'center',
  },
});
