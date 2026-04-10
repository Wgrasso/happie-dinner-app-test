import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../lib/ThemeContext';
import { getMyNotificationLog } from '../lib/notificationLogService';
import { INACTIVE_REMINDER_TEMPLATE } from '../lib/inactiveReminder';

/**
 * NotificationsDashboard
 *
 * Modal showing two sections:
 *   1. Templates — list of notification types the app can send, with the
 *      exact copy that will reach users and the trigger rules. This lets
 *      the product owner preview every message the app sends before it
 *      ever goes out.
 *   2. History — all notifications that have actually been dispatched to
 *      the current user, newest first, with timestamps.
 */
export default function NotificationsDashboard({ visible, onClose }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    getMyNotificationLog(100).then((result) => {
      if (cancelled) return;
      setLogs(result.logs || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [visible]);

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('nl-NL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const templates = [INACTIVE_REMINDER_TEMPLATE];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {t('notifications.dashboardTitle') || 'Notificaties'}
              </Text>
              <Text style={styles.subtitle}>
                {t('notifications.dashboardSubtitle') ||
                  'Alles wat de app naar gebruikers stuurt'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Templates ── */}
            <Text style={styles.sectionHeading}>
              {t('notifications.templates') || 'Templates'}
            </Text>
            <Text style={styles.sectionHint}>
              {t('notifications.templatesHint') ||
                'De kant-en-klare berichten die de app automatisch kan versturen.'}
            </Text>
            {templates.map((tpl) => (
              <View key={tpl.kind} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.kindPill}>
                    <Feather name="bell" size={12} color={theme.colors.secondary} />
                    <Text style={styles.kindPillText}>{tpl.kind}</Text>
                  </View>
                </View>
                <Text style={styles.notifTitle}>{tpl.title}</Text>
                <Text style={styles.notifBody}>{tpl.body}</Text>
                <View style={styles.triggerBox}>
                  <Feather
                    name="clock"
                    size={12}
                    color={theme.colors.textTertiary}
                  />
                  <Text style={styles.triggerText}>{tpl.triggerDescription}</Text>
                </View>
              </View>
            ))}

            {/* ── History ── */}
            <Text style={[styles.sectionHeading, { marginTop: 28 }]}>
              {t('notifications.history') || 'Verzonden'}
            </Text>
            <Text style={styles.sectionHint}>
              {t('notifications.historyHint') ||
                'De laatste 100 notificaties die je hebt ontvangen.'}
            </Text>

            {loading ? (
              <ActivityIndicator
                color={theme.colors.primary}
                style={{ marginTop: 20 }}
              />
            ) : logs.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="inbox" size={28} color={theme.colors.textTertiary} />
                <Text style={styles.emptyText}>
                  {t('notifications.empty') || 'Nog geen notificaties verzonden'}
                </Text>
              </View>
            ) : (
              logs.map((log) => (
                <View key={log.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.kindPill}>
                      <Feather
                        name={
                          log.status === 'failed'
                            ? 'alert-circle'
                            : log.status === 'scheduled'
                            ? 'clock'
                            : 'check-circle'
                        }
                        size={12}
                        color={
                          log.status === 'failed'
                            ? theme.colors.error
                            : theme.colors.secondary
                        }
                      />
                      <Text style={styles.kindPillText}>{log.kind}</Text>
                    </View>
                    <Text style={styles.timestamp}>
                      {formatDate(log.sent_at || log.created_at)}
                    </Text>
                  </View>
                  <Text style={styles.notifTitle}>{log.title}</Text>
                  <Text style={styles.notifBody}>{log.body}</Text>
                  {log.error ? (
                    <Text style={styles.errorText}>{log.error}</Text>
                  ) : null}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.colors.overlay || 'rgba(26,16,0,0.55)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '92%',
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 22,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: theme.colors.text,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.textTertiary,
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionHeading: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    sectionHint: {
      fontSize: 12,
      color: theme.colors.textTertiary,
      marginBottom: 12,
      lineHeight: 17,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 14,
      marginBottom: 10,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    kindPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: `${theme.colors.secondary}14`,
    },
    kindPillText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.secondary,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    timestamp: {
      fontSize: 11,
      color: theme.colors.textTertiary,
    },
    notifTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 3,
    },
    notifBody: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    triggerBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    triggerText: {
      flex: 1,
      fontSize: 11,
      color: theme.colors.textTertiary,
      lineHeight: 15,
    },
    errorText: {
      marginTop: 6,
      fontSize: 11,
      color: theme.colors.error,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
      gap: 10,
    },
    emptyText: {
      fontSize: 13,
      color: theme.colors.textTertiary,
    },
  });
