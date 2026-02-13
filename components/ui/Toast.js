import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Toast Context
const ToastContext = createContext(null);

// Toast types with their styling
const TOAST_CONFIG = {
  success: {
    backgroundColor: '#2E7D32',
    icon: '✓',
    defaultDuration: 3000,
  },
  error: {
    backgroundColor: '#C62828',
    icon: '✕',
    defaultDuration: 4000,
  },
  warning: {
    backgroundColor: '#F57C00',
    icon: '⚠',
    defaultDuration: 3500,
  },
  info: {
    backgroundColor: '#1565C0',
    icon: 'ℹ',
    defaultDuration: 3000,
  },
  neutral: {
    backgroundColor: '#424242',
    icon: '',
    defaultDuration: 3000,
  },
};

// Individual Toast Component
const ToastItem = ({ id, type, message, onHide, duration }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const config = TOAST_CONFIG[type] || TOAST_CONFIG.neutral;

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after duration
    const timer = setTimeout(() => {
      hideToast();
    }, duration || config.defaultDuration);

    return () => clearTimeout(timer);
  }, []);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide(id);
    });
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: config.backgroundColor },
        { transform: [{ translateY }], opacity },
      ]}
    >
      <TouchableOpacity 
        style={styles.toastContent}
        onPress={hideToast}
        activeOpacity={0.9}
      >
        {config.icon ? (
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{config.icon}</Text>
          </View>
        ) : null}
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const insets = useSafeAreaInsets();
  const toastIdRef = useRef(0);

  const showToast = useCallback((type, message, duration) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, type, message, duration }]);
    return id;
  }, []);

  const hideToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Convenience methods
  const toast = useCallback({
    success: (message, duration) => showToast('success', message, duration),
    error: (message, duration) => showToast('error', message, duration),
    warning: (message, duration) => showToast('warning', message, duration),
    info: (message, duration) => showToast('info', message, duration),
    show: (message, duration) => showToast('neutral', message, duration),
  }, [showToast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <View style={[styles.container, { top: insets.top + 10 }]} pointerEvents="box-none">
        {toasts.map(t => (
          <ToastItem
            key={t.id}
            id={t.id}
            type={t.type}
            message={t.message}
            duration={t.duration}
            onHide={hideToast}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Return no-op functions if used outside provider
    return {
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
      show: () => {},
    };
  }
  return context;
};

// Standalone toast function (for use outside React components)
let globalToastRef = null;

export const setGlobalToastRef = (ref) => {
  globalToastRef = ref;
};

export const toast = {
  success: (message, duration) => globalToastRef?.success(message, duration),
  error: (message, duration) => globalToastRef?.error(message, duration),
  warning: (message, duration) => globalToastRef?.warning(message, duration),
  info: (message, duration) => globalToastRef?.info(message, duration),
  show: (message, duration) => globalToastRef?.show(message, duration),
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: width - 32,
    minWidth: 200,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  message: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#FFFFFF',
    lineHeight: 20,
  },
});

export default { ToastProvider, useToast, toast };

