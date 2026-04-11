import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  PanResponder, Modal, LayoutAnimation,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { lightHaptic, mediumHaptic } from '../lib/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ROW_HEIGHT = 58;
const STORAGE_KEY = '@happie_group_order';

// Persist group order
export const loadGroupOrder = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
};

export const saveGroupOrder = async (order) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch {}
};

// Sort groups by saved order, appending new ones at the end
export const sortGroupsByOrder = (groups, savedOrder) => {
  if (!savedOrder || !savedOrder.length) return groups;
  const orderMap = {};
  savedOrder.forEach((id, idx) => { orderMap[id] = idx; });
  return [...groups].sort((a, b) => {
    const aId = a.group_id || a.id;
    const bId = b.group_id || b.id;
    const aIdx = orderMap[aId] ?? 9999;
    const bIdx = orderMap[bId] ?? 9999;
    return aIdx - bIdx;
  });
};

// Row component (no PanResponder here — parent handles all drag logic)
const GroupRow = ({ group, idx, isActive, onSelectGroup, onClose, isDragging, onLongPress }) => {
  const groupId = group.group_id || group.id;
  const memberCount = group.member_count ?? group.memberCount ?? group.members_count ?? 0;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isDragging ? 1.04 : 1,
      useNativeDriver: true,
      tension: 200,
      friction: 20,
    }).start();
  }, [isDragging, scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      {idx > 0 && !isDragging && <View style={dStyles.divider} />}
      <TouchableOpacity
        style={[
          dStyles.row,
          isActive && dStyles.rowActive,
          isDragging && dStyles.rowDragging,
        ]}
        activeOpacity={0.7}
        onPress={() => {
          lightHaptic();
          onSelectGroup(groupId);
          onClose();
        }}
        onLongPress={() => onLongPress(idx)}
        delayLongPress={250}
        disabled={isDragging}
      >
        <View style={dStyles.dragHandleWrap}>
          <Feather name="menu" size={16} color={isDragging ? '#FF6B00' : '#CCC'} />
        </View>

        {group.photo_url ? (
          <ExpoImage
            source={{ uri: group.photo_url }}
            style={dStyles.avatar}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[dStyles.avatar, dStyles.avatarPlaceholder]}>
            <Text style={dStyles.avatarText}>
              {(group.name || group.group_name || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={dStyles.info}>
          <Text style={dStyles.name} numberOfLines={1}>
            {group.name || group.group_name}
          </Text>
          {memberCount > 0 && (
            <Text style={dStyles.members}>{memberCount} leden</Text>
          )}
        </View>

        {isActive && (
          <View style={dStyles.checkBadge}>
            <Feather name="check" size={12} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function GroupSwitcherDropdown({
  groups,
  activeGroupId,
  onSelectGroup,
  onReorderGroups,
  visible,
  onClose,
  onCreateGroup,
  onJoinGroup,
}) {
  const [localGroups, setLocalGroups] = useState(groups);
  const [draggingIdx, setDraggingIdx] = useState(null);

  // Animated value for smooth drag tracking
  const dragY = useRef(new Animated.Value(0)).current;

  // Refs that always hold current values (no stale closures)
  const draggingIdxRef = useRef(null);
  const localGroupsRef = useRef(groups);
  const isDraggingRef = useRef(false);
  const originIdx = useRef(null);

  useEffect(() => {
    setLocalGroups(groups);
    localGroupsRef.current = groups;
  }, [groups]);

  // Single PanResponder on the whole list — avoids stale closure per-row
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        isDraggingRef.current && Math.abs(gs.dy) > 2,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gs) => {
        if (!isDraggingRef.current) return;

        // originIdx is the index the drag STARTED at — it must stay
        // immutable throughout the gesture so gs.dy (which is always
        // measured from the finger-down point) lines up with it.
        const initialIdx = originIdx.current;
        const currentIdx = draggingIdxRef.current;

        // Target based on absolute finger delta from start. Hysteresis:
        // the boundary is at .5 row-heights past the current index
        // rather than past the starting index, which prevents flicker
        // when the finger hovers around the midpoint of a slot.
        const maxIdx = localGroupsRef.current.length - 1;
        const delta = gs.dy - (currentIdx - initialIdx) * ROW_HEIGHT;
        let targetIdx = currentIdx;
        if (delta > ROW_HEIGHT * 0.55 && currentIdx < maxIdx) {
          targetIdx = currentIdx + 1;
        } else if (delta < -ROW_HEIGHT * 0.55 && currentIdx > 0) {
          targetIdx = currentIdx - 1;
        }

        if (targetIdx !== currentIdx) {
          const arr = [...localGroupsRef.current];
          const [item] = arr.splice(currentIdx, 1);
          arr.splice(targetIdx, 0, item);

          // Smoothly animate the non-dragging rows as they shift into
          // their new positions — without this they snap instantly
          // which looks like "de groepen veranderen opeens van elkaar".
          LayoutAnimation.configureNext({
            duration: 180,
            update: {
              type: LayoutAnimation.Types.easeInEaseOut,
              property: LayoutAnimation.Properties.scaleXY,
            },
          });

          localGroupsRef.current = arr;
          draggingIdxRef.current = targetIdx;
          setLocalGroups(arr);
          setDraggingIdx(targetIdx);

          lightHaptic();
        }

        // Keep the dragged row locked under the finger. Because we
        // re-render the array, the row's natural top moves by
        // (newIdx - initialIdx) * ROW_HEIGHT. We subtract that shift
        // from gs.dy so the combined (natural + translateY) stays on
        // the exact pixel the finger is at.
        const shift = (draggingIdxRef.current - initialIdx) * ROW_HEIGHT;
        dragY.setValue(gs.dy - shift);
      },
      onPanResponderRelease: () => {
        finishDrag();
      },
      onPanResponderTerminate: () => {
        finishDrag();
      },
    })
  ).current;

  const finishDrag = () => {
    isDraggingRef.current = false;
    draggingIdxRef.current = null;
    originIdx.current = null;

    Animated.spring(dragY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 300,
      friction: 25,
    }).start();

    setDraggingIdx(null);

    const newOrder = localGroupsRef.current.map(g => g.group_id || g.id);
    onReorderGroups(newOrder);
    saveGroupOrder(newOrder);
  };

  const handleLongPress = useCallback((idx) => {
    isDraggingRef.current = true;
    draggingIdxRef.current = idx;
    originIdx.current = idx;
    dragY.setValue(0);
    setDraggingIdx(idx);
    mediumHaptic();
  }, [dragY]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableOpacity
        style={dStyles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={{ flex: 1 }} />
      </TouchableOpacity>

      <View style={dStyles.dropdownContainer} pointerEvents="box-none">
        <View style={dStyles.dropdown} {...panResponder.panHandlers}>
          {/* Group list */}
          {localGroups.map((group, idx) => {
            const isThisDragging = draggingIdx === idx;
            return (
              <Animated.View
                key={group.group_id || group.id}
                style={[
                  isThisDragging && {
                    zIndex: 100,
                    elevation: 8,
                    transform: [{ translateY: dragY }],
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.18,
                    shadowRadius: 12,
                  },
                  !isThisDragging && draggingIdx !== null && {
                    // Non-dragging rows stay in place
                    zIndex: 1,
                  },
                ]}
              >
                <GroupRow
                  group={group}
                  idx={idx}
                  isActive={(group.group_id || group.id) === activeGroupId}
                  onSelectGroup={onSelectGroup}
                  onClose={onClose}
                  isDragging={isThisDragging}
                  onLongPress={handleLongPress}
                />
              </Animated.View>
            );
          })}

          {/* Hint */}
          <View style={dStyles.hintRow}>
            <Feather name="move" size={10} color="#B0A898" style={{ marginRight: 4 }} />
            <Text style={dStyles.hint}>Houd ingedrukt om te slepen</Text>
          </View>

          {/* Divider + management actions */}
          <View style={dStyles.actionsDivider} />

          <TouchableOpacity
            style={dStyles.actionBtnPrimary}
            onPress={() => { lightHaptic(); onClose(); onCreateGroup?.(); }}
            activeOpacity={0.7}
          >
            <View style={dStyles.actionIconWrap}>
              <Feather name="plus" size={16} color="#FFFFFF" />
            </View>
            <Text style={dStyles.actionBtnPrimaryText}>Nieuwe Groep</Text>
          </TouchableOpacity>

          <View style={dStyles.divider} />

          <TouchableOpacity
            style={dStyles.actionBtnSecondary}
            onPress={() => { lightHaptic(); onClose(); onJoinGroup?.(); }}
            activeOpacity={0.7}
          >
            <Feather name="log-in" size={16} color="#FF6B00" />
            <Text style={dStyles.actionBtnSecondaryText}>Join groep met code</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const dStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 100,
    left: 12,
    right: 12,
    zIndex: 100,
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#E8E2DA',
    overflow: 'visible',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 10,
    minHeight: ROW_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  rowActive: {
    backgroundColor: '#F8F6F3',
  },
  rowDragging: {
    backgroundColor: '#F3F0EB',
    borderRadius: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0EDE8',
  },
  dragHandleWrap: {
    width: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  avatarPlaceholder: {
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1000',
  },
  members: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#FF6B00',
    marginTop: 1,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0EDE8',
  },
  hint: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#B0A898',
  },
  actionsDivider: {
    height: 6,
    backgroundColor: '#F3F0EB',
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  actionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimaryText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1000',
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  actionBtnSecondaryText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#FF6B00',
  },
});
