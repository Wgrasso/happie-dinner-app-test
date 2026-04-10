import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Modal, Keyboard, Pressable } from 'react-native';
import { supabase } from '../lib/supabase';
import { createOrUpdateProfile } from '../lib/profileService';
import { useTheme } from '../lib/ThemeContext';
export default function NamePromptModal({ visible, onDone }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      await createOrUpdateProfile(trimmed, trimmed);
      await supabase.auth.updateUser({ data: { full_name: trimmed } });
      onDone(trimmed);
    } catch (_) {
      onDone(trimmed);
    }
    setLoading(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={Keyboard.dismiss}>
        <View style={styles.card}>
          <Text style={styles.title}>Hoe heet je?</Text>
          <Text style={styles.subtitle}>Zo weten je huisgenoten wie er mee-eet</Text>
          <TextInput
            style={styles.input}
            placeholder="Je naam"
            placeholderTextColor={theme.colors.textPlaceholder}
            value={name}
            onChangeText={setName}
            autoFocus
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
          <TouchableOpacity
            style={[styles.button, !name.trim() && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading || !name.trim()}
          >
            <Text style={styles.buttonText}>{loading ? 'Even geduld...' : 'Doorgaan'}</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const createStyles = (theme) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.xl,
    padding: 28,
    width: '100%',
  },
  title: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize['3xl'],
    color: theme.colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: 20,
  },
  input: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.base,
    paddingHorizontal: theme.spacing.base,
    paddingTop: theme.spacing.base,
    paddingBottom: theme.spacing.base,
    marginBottom: theme.spacing.base,
    textAlignVertical: 'center',
  },
  button: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.base,
    paddingVertical: theme.spacing.base,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.background,
  },
});
