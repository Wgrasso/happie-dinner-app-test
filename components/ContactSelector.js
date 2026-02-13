import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView, 
  TextInput, ActivityIndicator, Animated
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { getAllContacts } from '../lib/specialOccasionService';
import { log, debugError } from '../lib/debugConfig';

/**
 * Contact Selector Component
 * Allows selecting multiple contacts from all user's groups
 */
const ContactSelector = ({ 
  visible, 
  onClose, 
  onConfirm, 
  selectedIds = [],
  title = 'Select Participants'
}) => {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState(new Set(selectedIds));
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      loadContacts();
      setSelectedUserIds(new Set(selectedIds));
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const result = await getAllContacts();
      if (result.success) {
        setContacts(result.contacts || []);
      } else {
        log.occasions('Failed to load contacts:', result.error);
        setContacts([]);
      }
    } catch (error) {
      debugError('Error loading contacts:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleContact = (userId) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedUserIds));
    onClose();
  };

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const selectAll = () => {
    const allIds = filteredContacts.map(c => c.user_id);
    setSelectedUserIds(new Set(allIds));
  };

  const deselectAll = () => {
    setSelectedUserIds(new Set());
  };

  // Filter contacts by search query
  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const name = contact.full_name || contact.user_name || '';
    const email = contact.email || contact.user_email || '';
    return (
      name.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query) ||
      contact.group_names?.some(g => g.toLowerCase().includes(query))
    );
  });

  // Group contacts by first letter
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    const name = contact.full_name || contact.user_name || 'U';
    const firstLetter = name[0].toUpperCase();
    if (!acc[firstLetter]) acc[firstLetter] = [];
    acc[firstLetter].push(contact);
    return acc;
  }, {});

  const sortedLetters = Object.keys(groupedContacts).sort();

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.backdropTouch} onPress={handleClose} />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0]
                })
              }]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.selectedCount}>
              {selectedUserIds.size} geselecteerd
            </Text>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Zoeken..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={selectAll}>
              <Text style={styles.quickActionText}>Alles selecteren</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={deselectAll}>
              <Text style={styles.quickActionText}>Wis selectie</Text>
            </TouchableOpacity>
          </View>

          {/* Contact List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B7355" />
              <Text style={styles.loadingText}>Contacten laden...</Text>
            </View>
          ) : filteredContacts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Geen contacten gevonden' : 'Nog geen contacten beschikbaar'}
              </Text>
              <Text style={styles.emptySubtext}>
                {!searchQuery && 'Word lid van groepen om contacten te zien'}
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.contactList} showsVerticalScrollIndicator={false}>
              {sortedLetters.map(letter => (
                <View key={letter}>
                  <Text style={styles.sectionHeader}>{letter}</Text>
                  {groupedContacts[letter].map(contact => {
                    const isSelected = selectedUserIds.has(contact.user_id);
                    return (
                      <TouchableOpacity
                        key={contact.user_id}
                        style={[styles.contactItem, isSelected && styles.contactItemSelected]}
                        onPress={() => toggleContact(contact.user_id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
                          <Text style={[styles.avatarText, isSelected && styles.avatarTextSelected]}>
                            {(contact.full_name || contact.user_name || 'U')[0].toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.contactInfo}>
                          <Text style={styles.contactName}>
                            {contact.full_name || contact.user_name || 'User'}
                          </Text>
                          <Text style={styles.contactGroups} numberOfLines={1}>
                            {contact.group_names?.join(', ') || 'Geen groep'}
                          </Text>
                        </View>
                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                          {isSelected && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Annuleren</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.confirmButton, selectedUserIds.size === 0 && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={selectedUserIds.size === 0}
            >
              <Text style={styles.confirmButtonText}>
                Bevestigen ({selectedUserIds.size})
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdropTouch: {
    flex: 1,
  },
  container: {
    width: '92%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: '#FEFEFE',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE8',
  },
  title: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  selectedCount: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#8B7355',
  },
  searchContainer: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#F8F6F3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#2D2D2D',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  quickAction: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F8F6F3',
    borderRadius: 8,
  },
  quickActionText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#8B7355',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#999',
    textAlign: 'center',
  },
  contactList: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#8B7355',
    backgroundColor: '#F8F6F3',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE8',
  },
  contactItemSelected: {
    backgroundColor: 'rgba(139, 115, 85, 0.08)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F6F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarSelected: {
    backgroundColor: '#8B7355',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#8B7355',
  },
  avatarTextSelected: {
    color: '#FEFEFE',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#2D2D2D',
    marginBottom: 2,
  },
  contactGroups: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#8B8885',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D0CCC7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#FEFEFE',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EDE8',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F8F6F3',
  },
  cancelButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#8B7355',
  },
  confirmButtonDisabled: {
    backgroundColor: '#D0CCC7',
  },
  confirmButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#FEFEFE',
  },
});

export default ContactSelector;

