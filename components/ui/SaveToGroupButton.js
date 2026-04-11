/**
 * SaveToGroupButton
 *
 * Reusable "opslaan naar groep" action for any recipe surface.
 * - Shows a button; on tap expands a multi-select list of the user's groups.
 * - Groups that already contain this recipe are hidden from the picker — you
 *   can't save the same recipe twice to the same group.
 * - When rendered from a group context (pass `currentGroupId`), the label
 *   becomes "Toevoegen aan andere groep" and a red "Verwijder uit deze groep"
 *   button appears next to it.
 * - On confirm, writes via shareRecipeWithGroups (which stores a frozen
 *   recipe_data snapshot so the group copy survives edits/deletion of the
 *   source recipe).
 *
 * Props:
 *   recipe               — object with at least { id, name }; the full recipe
 *                          is used as the snapshot payload
 *   groups               — optional override; falls back to useAppState().groups
 *   currentGroupId       — when set, marks the context as "viewing from group X".
 *                          Group X is excluded from the picker, label changes,
 *                          and a "verwijder uit deze groep" button is shown.
 *   variant              — 'solid' | 'inline' (default 'solid')
 *   label                — optional button label override
 *   onSaved(groupIds)    — callback fired after successful save
 *   onRemoved(groupId)   — callback fired after successful removal from
 *                          currentGroupId
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { shareRecipeWithGroups, getRecipeShares, removeRecipeFromGroup } from '../../lib/recipesService';
import { lightHaptic, successHaptic } from '../../lib/haptics';
import { useToast } from './Toast';
import { useAppState } from '../../lib/AppStateContext';

export default function SaveToGroupButton({
  recipe,
  groups: groupsOverride,
  currentGroupId,
  variant = 'solid',
  label,
  onSaved,
  onRemoved,
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const appState = useAppState();
  const allGroups = groupsOverride || appState?.groups || [];

  const [showPicker, setShowPicker] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [alreadySharedIds, setAlreadySharedIds] = useState([]);

  // Load which groups this recipe is already in so we can hide them.
  useEffect(() => {
    let cancelled = false;
    if (!recipe?.id) {
      setAlreadySharedIds([]);
      return;
    }
    getRecipeShares(recipe.id).then((res) => {
      if (cancelled) return;
      setAlreadySharedIds(res?.success && Array.isArray(res.groupIds) ? res.groupIds : []);
    }).catch(() => {
      if (!cancelled) setAlreadySharedIds([]);
    });
    return () => { cancelled = true; };
  }, [recipe?.id]);

  // Groups available for saving = all user groups MINUS groups this recipe is
  // already in. When rendered from inside a group, that group is already in
  // alreadySharedIds, so no extra filtering needed.
  const selectableGroups = (allGroups || []).filter((g) => {
    const gid = g.id || g.group_id;
    return gid && !alreadySharedIds.includes(gid);
  });

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
      const result = await shareRecipeWithGroups(recipe, selectedIds);
      if (!result?.success) throw new Error(result?.error || 'Kon niet opslaan');
      successHaptic();
      const count = selectedIds.length;
      toast.success(
        `${t('chef.addedToGroup') || 'Toegevoegd aan'} ${count} ${count === 1 ? 'groep' : 'groepen'}`
      );
      // Refresh local list so those groups disappear from the picker too.
      setAlreadySharedIds((prev) => Array.from(new Set([...prev, ...selectedIds])));
      if (typeof onSaved === 'function') onSaved([...selectedIds]);
      setSelectedIds([]);
      setShowPicker(false);
    } catch (e) {
      toast.error(e?.message || (t('common.somethingWentWrong') || 'Er is iets misgegaan'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFromCurrent = () => {
    if (!currentGroupId || !recipe?.id || removing) return;
    Alert.alert(
      t('groups.removeRecipeTitle') || 'Recept verwijderen',
      t('groups.removeRecipeConfirm') || 'Weet je zeker dat je dit recept uit deze groep wilt halen?',
      [
        { text: t('common.cancel') || 'Annuleren', style: 'cancel' },
        {
          text: t('common.delete') || 'Verwijderen',
          style: 'destructive',
          onPress: async () => {
            setRemoving(true);
            lightHaptic();
            try {
              const result = await removeRecipeFromGroup(recipe.id, currentGroupId);
              if (!result?.success) throw new Error(result?.error || 'Kon niet verwijderen');
              successHaptic();
              toast.success(t('groups.recipeRemoved') || 'Recept verwijderd uit groep');
              setAlreadySharedIds((prev) => prev.filter((id) => id !== currentGroupId));
              if (typeof onRemoved === 'function') onRemoved(currentGroupId);
            } catch (e) {
              toast.error(e?.message || (t('common.somethingWentWrong') || 'Er is iets misgegaan'));
            } finally {
              setRemoving(false);
            }
          },
        },
      ]
    );
  };

  if (!recipe?.id) return null;

  // Only treat as "in group context" when the recipe is actually saved in
  // that group — otherwise the red "verwijder uit deze groep" button would
  // delete nothing and just confuse the user.
  const inGroupContext = Boolean(currentGroupId) && alreadySharedIds.includes(currentGroupId);
  const buttonLabel = label
    || (inGroupContext
      ? (t('chef.addToOtherGroup') || 'Toevoegen aan andere groep')
      : (t('chef.addToGroup') || 'Opslaan naar groep'));

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={[
            variant === 'inline' ? styles.btnInline : styles.btnSolid,
            inGroupContext && { flex: 1 },
          ]}
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
          <Text
            style={variant === 'inline' ? styles.btnInlineText : styles.btnSolidText}
            numberOfLines={1}
          >
            {buttonLabel}
          </Text>
        </TouchableOpacity>

        {inGroupContext && (
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={handleRemoveFromCurrent}
            disabled={removing}
            activeOpacity={0.8}
            accessibilityLabel={t('groups.removeFromGroup') || 'Verwijder uit deze groep'}
          >
            {removing ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Feather name="trash-2" size={16} color="#FFF" />
                <Text style={styles.removeBtnText} numberOfLines={1}>
                  {t('groups.removeFromGroup') || 'Verwijderen'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {showPicker && (
        <View style={styles.pickerList}>
          {selectableGroups.length === 0 ? (
            <Text style={styles.pickerEmpty}>
              {alreadySharedIds.length > 0 && allGroups.length > 0
                ? (t('groups.allGroupsAlreadyHave') || 'Dit recept staat al in al je groepen')
                : (t('groups.noGroups') || 'Geen groepen')}
            </Text>
          ) : (
            <>
              {selectableGroups.map((g) => {
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CC2200',
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 6,
  },
  removeBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
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
