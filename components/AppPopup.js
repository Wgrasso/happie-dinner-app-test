import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Linking, ScrollView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { supabase, USE_REAL_SUPABASE } from '../lib/supabase';
import { useTheme } from '../lib/ThemeContext';
export default function AppPopup() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [popup, setPopup] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!USE_REAL_SUPABASE) return;
    checkForPopup();
  }, []);

  const checkForPopup = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: popups } = await supabase
        .from('app_popups')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!popups?.length) return;

      const { data: dismissals } = await supabase
        .from('app_popup_dismissals')
        .select('popup_id')
        .eq('user_id', user.id);

      const dismissedIds = new Set((dismissals || []).map(d => d.popup_id));

      for (const p of popups) {
        if (dismissedIds.has(p.id)) continue;
        const matches = await matchesFilter(p, user.id);
        if (matches) {
          setPopup(p);
          setVisible(true);
          return;
        }
      }
    } catch (e) {
      console.error('AppPopup error:', e);
    }
  };

  const matchesFilter = async (p, userId) => {
    if (p.filter_type === 'all') return true;

    if (p.filter_type === 'group-size') {
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId)
        .eq('is_active', true);
      if (!memberships?.length) return false;
      for (const m of memberships) {
        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', m.group_id)
          .eq('is_active', true);
        if (count >= (p.filter_min || 1) && count <= (p.filter_max || 999)) return true;
      }
      return false;
    }

    if (p.filter_type === 'no-group') {
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true);
      return count === 0;
    }

    if (p.filter_type === 'inactive') {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('daily_responses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('response', 'yes')
        .eq('response_date', today);
      return count === 0;
    }

    return true;
  };

  const handleDismiss = async () => {
    setVisible(false);
    if (!popup) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('app_popup_dismissals').insert({
          popup_id: popup.id,
          user_id: user.id,
        });
      }
    } catch (_) {}
    setPopup(null);
  };

  const handleButton = async () => {
    if (popup?.button_link) {
      Linking.openURL(popup.button_link).catch(() => {});
    }
    handleDismiss();
  };

  if (!visible || !popup) return null;

  const renderBody = (text) => {
    if (!text) return null;
    const parts = text.split(/(\[.*?\]\(.*?\))/g);
    return parts.map((part, i) => {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        return (
          <Text
            key={i}
            style={styles.bodyLink}
            onPress={() => Linking.openURL(match[2]).catch(() => {})}
          >
            {match[1]}
          </Text>
        );
      }
      return <Text key={i}>{part}</Text>;
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {popup.image_url ? (
                <ExpoImage
                  source={{ uri: popup.image_url }}
                  style={styles.image}
                  contentFit="cover"
                  transition={200}
                />
              ) : null}

              {popup.title ? (
                <Text style={styles.title}>{popup.title}</Text>
              ) : null}

              {popup.body ? (
                <Text style={styles.body}>{renderBody(popup.body)}</Text>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {popup.button_link ? (
              <>
                <TouchableOpacity style={styles.secondaryBtn} onPress={handleDismiss}>
                  <Text style={styles.secondaryText}>Sluiten</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleButton}>
                  <Text style={styles.primaryText}>{popup.button_text || 'Bekijk'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.primaryBtn} onPress={handleDismiss}>
                <Text style={styles.primaryText}>{popup.button_text || 'OK'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius['2xl'],
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
    paddingBottom: theme.spacing.xl,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.xl,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize['3xl'],
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  body: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  bodyLink: {
    color: theme.colors.secondary,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing['2xl'],
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.base,
    paddingVertical: theme.spacing.base,
    alignItems: 'center',
  },
  primaryText: {
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.background,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: theme.colors.borderSubtle,
    borderRadius: theme.borderRadius.base,
    paddingVertical: theme.spacing.base,
    alignItems: 'center',
  },
  secondaryText: {
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.primary,
  },
});
