/**
 * SaveToGroupButton
 *
 * Reusable "opslaan naar groep" action for any recipe surface.
 * - Shows a button; on tap expands a multi-select list of the user's groups.
 * - On confirm, upserts rows into `recipe_group_shares` (one per selected group).
 * - Requires that `recipe.id` is a real row in the `recipes` table.
 *   External recipes must be persisted first before this will succeed.
 *
 * Props:
 *   recipe            — object with at least { id, name }
 *   groups            — optional override; falls back to useAppState().groups
 *   variant           — 'solid' | 'inline' (default 'solid')
 *   label             — optional button label override
 *   onSaved(groupIds) — optional callback fired after successful save
 */

import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { lightHaptic, successHaptic } from '../../lib/haptics';
import { useToast } from './Toast';
import { useAppState } from '../../lib/AppStateContext';

export default function SaveToGroupButton({
  recipe,
  groups: groupsOverride,
  variant = 'solid',
  label,
  onSaved,
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const appState = useAppState();
  const groups = groupsOverride || appState?.groups || [];

  const [showPicker, setShowPicker] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggle = (groupId) => {
    lightHaptic();
    setSelectedIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSave = async () => {
    if (!recipe?.id || selectedIds.length === 0) return;
    setSaving(true);
    lightHaptic();
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new Error(t('auth.notAuthenticated') || 'Niet ingelogd');

      const rows = selectedIds.map((gid) => ({
        recipe_id: recipe.id,
        group_id: gid,
        shared_by: userId,
      }));
      const { error } = await supabase
        .from('recipe_group_shares')
        .upsert(rows, { onConflict: 'recipe_id,group_id' });
      if (error) throw error;

      successHaptic();
      const count = selectedIds.length;
      toast.success(
        `${t('chef.addedToGroup') || 'Toegevoegd aan'} ${count} ${count === 1 ? 'groep' : 'groepen'}`
      );
      if (typeof onSaved === 'function') onSaved([...selectedIds]);
      setSelectedIds([]);
      setShowPicker(false);
    } catch (e) {
      toast.error(e?.message || (t('common.somethingWentWrong') || 'Er is iets misgegaan'));
    } finally {
      setSaving(false);
    }
  };

  if (!recipe?.id) return null;

  const buttonLabel = label || t('chef.addToGroup') || 'Opslaan naar groep';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={variant === 'inline' ? styles.btnInline : styles.btnSolid}
        onPress={() => {
          lightHaptic();
          setShowPicker((v) => !v);
          setSelectedIds([]);
        }}
        activeOpacity={0.8}
      >
        <Feather
          name={showPicker ? 'chevron-up' : 'plus-circle'}
          size={variant === 'inline' ? 16 : 18}
          color={variant === 'inline' ? '#FF6B00' : '#FFF'}
        />
        <Text style={variant === 'inline' ? styles.btnInlineText : styles.btnSolidText}>
          {buttonLabel}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <View style={styles.pickerList}>
          {groups.length === 0 ? (
            <Text style={styles.pickerEmpty}>{t('groups.noGroups') || 'Geen groepen'}</Text>
          ) : (
            <>
              {groups.map((g) => {
                const gid = g.id || g.group_id;
                const isSelected = selectedIds.includes(gid);
                return (
                  <TouchableOpacity
                    key={gid}
                    style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                    onPress={() => toggle(gid)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pickerName} numberOfLines={1}>{g.name}</Text>
                    <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                      {isSelected && <Feather name="check" size={14} color="#FFF" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
              {selectedIds.length > 0 && (
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSave}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {t('chef.addToGroupConfirm') || 'Toevoegen'} ({selectedIds.length})
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  btnSolid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  btnSolidText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5EC',
    borderWidth: 1,
    borderColor: '#FFD0B0',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  btnInlineText: {
    color: '#FF6B00',
    fontSize: 13,
    fontWeight: '700',
  },
  pickerList: {
    marginTop: 10,
    backgroundColor: '#FAFAF7',
    borderRadius: 12,
    padding: 8,
    gap: 6,
  },
  pickerEmpty: {
    textAlign: 'center',
    padding: 12,
    fontSize: 13,
    color: '#999',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EDE8DD',
  },
  pickerItemActive: {
    borderColor: '#FF6B00',
    backgroundColor: '#FFF5EC',
  },
  pickerName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginRight: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  saveBtn: {
    marginTop: 4,
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
