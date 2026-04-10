import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  TextInput, ActivityIndicator, Image, Modal, Animated, RefreshControl,
  Dimensions, LayoutAnimation, Platform, UIManager, Alert,
  Keyboard, Pressable, InteractionManager, Share, SafeAreaView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { createGroupInSupabase, joinGroupByCode, leaveGroup, deleteGroup } from '../lib/groupsService';
import { uploadGroupPhoto, updateGroupPhoto } from '../lib/groupPhotoService';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { lightHaptic, mediumHaptic, successHaptic } from '../lib/haptics';
import { supabase } from '../lib/supabase';
import { setMyResponseToday } from '../lib/dailyResponseService';
import { useTranslation } from 'react-i18next';
import { formatDateShortNL } from '../lib/dateFormatting';
import { log, debugError } from '../lib/debugConfig';
import { getTopVotedMeals } from '../lib/mealRequestService';
import { useAppState } from '../lib/AppStateContext';
import { useToast } from './ui/Toast';
import { GroupCardSkeleton, MemberListSkeleton, TopMealsSkeleton, InlineLoader } from './ui/SkeletonLoader';
import ServingSelector from './ui/ServingSelector';
import { scaleIngredients } from '../lib/ingredientScaler';
import { getRecipeExtras } from '../lib/recipeExtrasService';
import { EmptyGroups, EmptyVotes, EmptyOccasions } from './ui/EmptyState';
import GroupRecipesScreen from './GroupRecipesScreen';
import { 
  getMySpecialOccasions, 
  getPastOccasions,
  respondToOccasion, 
  getOccasionParticipants,
  getOccasionMealOptions,
  createOccasionMealOptions,
  getOccasionTopMeals,
  createSpecialOccasion,
  leaveOccasion,
  deleteSpecialOccasion
} from '../lib/specialOccasionService';
import { Swipeable } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { notifyOccasionParticipants } from '../lib/notificationService';
import { sortTopMeals } from '../lib/sortTopMeals';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import GroupSwitcherDropdown, { loadGroupOrder, saveGroupOrder, sortGroupsByOrder } from './GroupSwitcherDropdown';
import { getActiveShopperToday, startShopping, stopShopping } from '../lib/shoppingService';

// Configure Dutch locale for calendar
LocaleConfig.locales['nl'] = {
  monthNames: ['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December'],
  monthNamesShort: ['Jan','Feb','Mrt','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec'],
  dayNames: ['Zondag','Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag'],
  dayNamesShort: ['Zo','Ma','Di','Wo','Do','Vr','Za'],
  today: 'Vandaag',
};
LocaleConfig.defaultLocale = 'nl';

const FEATURE_SPECIAL_OCCASIONS = false;

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Safe image component with load handling
const SafeDrawing = ({ source, style, resizeMode = "contain" }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  return (
    <Image
      source={source}
      style={[style, { opacity: imageLoaded ? 1 : 0 }]}
      resizeMode={resizeMode}
      onLoad={() => setImageLoaded(true)}
      onError={() => setImageLoaded(false)}
    />
  );
};

// Get today's date string
const getTodayDate = () => new Date().toISOString().split('T')[0];

// Safe time display - handles "14:00:00", "14:00", or null
const formatTimeDisplay = (t) => {
  if (!t) return '';
  const s = String(t);
  return s.length >= 5 ? s.slice(0, 5) : s;
};

// ============================================
// YES/NO TOGGLE COMPONENT
// ============================================
const YesNoToggle = ({ value, onChange, disabled = false }) => {
  const { t } = useTranslation();
  const slideAnimation = useRef(new Animated.Value(value === 'yes' ? 1 : value === 'no' ? 0 : 0.5)).current;
  
  useEffect(() => {
    Animated.spring(slideAnimation, {
      toValue: value === 'yes' ? 1 : value === 'no' ? 0 : 0.5,
      useNativeDriver: false,
      tension: 100,
      friction: 12,
    }).start();
  }, [value]);

  const handlePress = (selection) => {
    if (disabled) return;
    // Toggle: if clicking same value, no change; if different, switch
    if ((selection === 'yes' && value !== 'yes') || (selection === 'no' && value !== 'no')) {
      lightHaptic();
      onChange(selection);
    } else if (value === selection) {
      // Clicking the same resets? Or keep same? Let's keep the value
    }
  };

  const isYes = value === 'yes';
  const isNo = value === 'no';
  const isUndecided = !isYes && !isNo;

  // Interpolate background colors
  const highlightLeft = slideAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#FF9800', '#E8E2DA', '#E8E2DA'],
  });

  const highlightRight = slideAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#E8E2DA', '#E8E2DA', '#FF6B00'],
  });

  return (
    <View style={toggleStyles.container}>
      {/* No Button */}
      <TouchableOpacity
        style={toggleStyles.buttonWrapper}
        onPress={() => handlePress('no')}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Animated.View style={[
          toggleStyles.button,
          toggleStyles.buttonLeft,
          { backgroundColor: highlightLeft }
        ]}>
          <Text style={[
            toggleStyles.buttonText,
            isNo && toggleStyles.buttonTextActive
          ]}>
            {t('dinner.no')}
          </Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Yes Button */}
      <TouchableOpacity
        style={toggleStyles.buttonWrapper}
        onPress={() => handlePress('yes')}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Animated.View style={[
          toggleStyles.button,
          toggleStyles.buttonRight,
          { backgroundColor: highlightRight }
        ]}>
          <Text style={[
            toggleStyles.buttonText,
            isYes && toggleStyles.buttonTextActive
          ]}>
            {t('dinner.yes')}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const toggleStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: '#F0EDE8',
    padding: 3,
  },
  buttonWrapper: {
    flex: 1,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    borderRadius: 11,
  },
  buttonLeft: {
    borderTopLeftRadius: 11,
    borderBottomLeftRadius: 11,
  },
  buttonRight: {
    borderTopRightRadius: 11,
    borderBottomRightRadius: 11,
  },
  buttonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#8B8580',
  },
  buttonTextActive: {
    color: '#FEFEFE',
  },
});

// ============================================
// TOP 3 MODAL - Fetches fresh data every time it opens
// ============================================
const Top3Modal = React.memo(({ visible, onClose, loadMeals, onRecipePress }) => {
  const { t } = useTranslation();
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Initial fetch when modal opens
  useEffect(() => {
    if (!visible || typeof loadMeals !== 'function') return;
    setLoading(true);
    setMeals([]);
    loadMeals()
      .then(data => setMeals(Array.isArray(data) ? data : []))
      .catch(() => setMeals([]))
      .finally(() => setLoading(false));
  }, [visible, loadMeals]);
  
  // Auto-refresh every 1 second while modal is open (live vote updates)
  useEffect(() => {
    if (!visible || typeof loadMeals !== 'function') return;
    const interval = setInterval(() => {
      loadMeals()
        .then(data => {
          if (Array.isArray(data)) setMeals(data);
        })
        .catch(() => {}); // Silently fail on refresh
    }, 1000);
    return () => clearInterval(interval);
  }, [visible, loadMeals]);
  
  const displayMeals = meals?.slice(0, 3) || [];
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity 
        style={top3ModalStyles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={top3ModalStyles.container} onStartShouldSetResponder={() => true}>
          <View style={top3ModalStyles.header}>
            <Text style={top3ModalStyles.title}>{t('meals.topRecipes')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={top3ModalStyles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={top3ModalStyles.loading}>
              <ActivityIndicator size="large" color="#8B7355" />
            </View>
          ) : displayMeals.length === 0 ? (
            <Text style={top3ModalStyles.emptyText}>{t('meals.noVotesYet')}</Text>
          ) : (
            <View style={top3ModalStyles.list}>
              {displayMeals.map((meal, index) => {
                const mealName = meal.meal_data?.name || t('meals.recipe');
                const voteCount = meal.yes_votes ?? meal.vote_total ?? 0;
                return (
                  <TouchableOpacity
                    key={meal.meal_option_id || meal.option_id || index}
                    style={top3ModalStyles.recipeItem}
                    onPress={() => { onRecipePress?.(meal); onClose(); }}
                    activeOpacity={0.7}
                  >
                    <View style={top3ModalStyles.recipeInfo}>
                      <Text style={top3ModalStyles.recipeName} numberOfLines={1}>{mealName}</Text>
                      <Text style={top3ModalStyles.voteCount}>{voteCount} {voteCount === 1 ? t('meals.vote') : t('meals.votes')}</Text>
                    </View>
                    <Text style={top3ModalStyles.chevron}>›</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
});

const top3ModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#FDFCFA',
    borderRadius: 22,
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
    overflow: 'hidden',
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE8',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#2D2D2D',
  },
  closeBtn: {
    fontSize: 20,
    color: '#8B7355',
    padding: 4,
  },
  loading: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 24,
  },
  list: {
    padding: 16,
    gap: 8,
  },
  recipeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F2EE',
    borderRadius: 14,
    padding: 14,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#FEFEFE',
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#2D2D2D',
    marginBottom: 2,
  },
  voteCount: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#8B7355',
  },
  chevron: {
    fontSize: 22,
    color: '#8B7355',
    marginLeft: 8,
  },
});

// ============================================
// EXPANDABLE GROUP CARD COMPONENT
// ============================================
const ExpandableGroupCard = React.memo(({ 
  group, 
  isExpanded, 
  onToggle, 
  currentUserId,
  memberResponses,
  members,
  myResponse,
  onResponseChange,
  onStartVoting,
  loadingMembers,
  actionLoading,
  topMeals = [],
  topMealsLoading = false,
  onRecipePress,
  onOpenTop3,
  recipeType = 'voting', // 'voting' or 'no_voting'
  onLeaveGroup,
  onDeleteGroup,
  isCreator = false,
  onOpenChat,
  hasUnread = false,
  onChangePhoto,
}) => {
  const expandAnimation = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showGroupRecipesModal, setShowGroupRecipesModal] = useState(false);
  const { t } = useTranslation();
  const toast = useToast();
  
  useEffect(() => {
    Animated.spring(expandAnimation, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: false,
      tension: 80,
      friction: 12,
    }).start();
  }, [isExpanded]);

  // Count responses
  const getResponseCounts = () => {
    let yes = 0, no = 0;
    Object.values(memberResponses || {}).forEach(r => {
      if (r === 'yes') yes++;
      if (r === 'no') no++;
    });
    return { yes, no, pending: (members?.length || 0) - yes - no };
  };

  const counts = getResponseCounts();
  const memberCount =
    group.member_count ??
    group.memberCount ??
    group.members_count ??
    group.membersCount ??
    group.member_total ??
    group.memberTotal ??
    members?.length ??
    0;

  // Status dot color based on my response
  const getStatusColor = () => {
    if (myResponse === 'yes') return '#FF6B00';
    if (myResponse === 'no') return '#FF9800';
    return '#D0D0D0';
  };

  // Calculate dynamic height based on content
  const yesCount = members?.filter(m => memberResponses?.[m.user_id] === 'yes').length || 0;
  const noCount = members?.filter(m => memberResponses?.[m.user_id] === 'no').length || 0;
  const maxColumnCount = Math.max(yesCount, noCount, 1);
  // Avatar layout: rows of ~3-4 avatars per row, each row ~60px
  const avatarRows = Math.ceil(maxColumnCount / 3);
  const attendeesHeight = 14 + 30 + (avatarRows * 64); // paddingTop + label row + avatar rows
  // Voting CTA: big (60px) or small (48px)
  const hasCTA = recipeType !== 'no_voting' && myResponse === 'yes';
  const isFirstVote = hasCTA && (!topMeals || topMeals.length === 0);
  const actionButtonsHeight = hasCTA ? (isFirstVote ? 74 : 58) : 0;
  const top3CardCount = topMeals?.length > 0 ? Math.min(topMeals.length, 3) : 0;
  const top3Height = recipeType !== 'no_voting' && top3CardCount > 0 ? (28 + top3CardCount * 80) : 0;
  const threeDotsHeight = 48;
  const bottomPadding = 18;
  
  const expandedHeight = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, attendeesHeight + actionButtonsHeight + top3Height + threeDotsHeight + bottomPadding],
  });

  const handleCopyCode = () => {
    Clipboard.setStringAsync(group.join_code);
    successHaptic();
  };

  const handleShareGroup = async () => {
    const code = group.join_code;
    // Copy code to clipboard immediately so the user has it
    Clipboard.setStringAsync(code);
    toast.success(t('groups.codeCopied') || 'Code gekopieerd!');
    try {
      await Share.share({
        message: `═══════════════════\n  HAPPIE GROEP JOINEN\n═══════════════════\n\nJe bent uitgenodigd! Open deze link:\nhttps://studentenhappie.nl/join/${code}\n\nOf download de app en vul de code in:\n\n🔑 Code: ${code}\n\n📲 https://apps.apple.com/app/happie/id6757129676\n\n═══════════════════`,
      });
    } catch (_) {}
  };

  return (
    <View style={cardStyles.container}>
      {/* Header - Always Visible (like occasions) */}
      <TouchableOpacity
        style={cardStyles.header}
        onPress={onToggle}
        activeOpacity={1}
      >
        {/* Left: Group Photo */}
        {group.photo_url ? (
          <ExpoImage
            source={{ uri: group.photo_url }}
            style={cardStyles.groupPhoto}
            contentFit="cover"
            transition={0}
            cachePolicy="memory-disk"
            priority="high"
          />
        ) : null}

        {/* Group Info */}
        <View style={[cardStyles.info, group.photo_url && { marginLeft: 12 }]}>
          <Text
            style={cardStyles.name}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {group.name || group.group_name}
          </Text>
          {group.join_code && (
            <Text style={cardStyles.joinCodeText}>{group.join_code}</Text>
          )}
        </View>

        {/* Right: Yes/No Buttons + Chat */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={cardStyles.responseButtons}>
            <TouchableOpacity 
              style={[
                cardStyles.responseBtn, 
                cardStyles.responseBtnYes,
                myResponse === 'yes' && cardStyles.responseBtnYesActive
              ]}
              onPress={(e) => {
                e.stopPropagation();
                onResponseChange(currentUserId, myResponse === 'yes' ? null : 'yes');
              }}
            >
              <Text style={[
                cardStyles.responseBtnText,
                myResponse === 'yes' && cardStyles.responseBtnTextActive
              ]}>{ t('dinner.yes') }</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                cardStyles.responseBtn,
                cardStyles.responseBtnNo,
                myResponse === 'no' && cardStyles.responseBtnNoActive
              ]}
              onPress={(e) => {
                e.stopPropagation();
                onResponseChange(currentUserId, myResponse === 'no' ? null : 'no');
              }}
            >
              <Text style={[
                cardStyles.responseBtnText,
                myResponse === 'no' && cardStyles.responseBtnTextActive
              ]}>{ t('dinner.no') }</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={cardStyles.chatButton}
            onPress={(e) => { e.stopPropagation(); onOpenChat(); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="message-circle" size={20} color="#8B7355" />
            {hasUnread && <View style={cardStyles.unreadDot} />}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      <Animated.View style={[
        cardStyles.expandedContent,
        { maxHeight: expandedHeight, opacity: expandAnimation }
      ]}>
        <View style={cardStyles.expandedInner}>
          {/* === SECTION 2: WHO'S EATING — Avatar-based layout === */}
          <View style={cardStyles.attendeesRow}>
            {/* Attending Column */}
            <View style={[cardStyles.attendeesColumn, cardStyles.attendeesColumnYes]}>
              <View style={cardStyles.attendeesLabelRow}>
                <Text style={cardStyles.attendeesLabelGreen}>{t('common.attending')}</Text>
                {!loadingMembers && (
                  <Text style={cardStyles.attendeesCount}>
                    {members?.filter(m => memberResponses?.[m.user_id] === 'yes').length || 0}
                  </Text>
                )}
              </View>
              {loadingMembers ? (
                <ActivityIndicator size="small" color="#FF6B00" style={{ marginTop: 8 }} />
              ) : (
                <View style={cardStyles.avatarRow}>
                  {members?.filter(m => memberResponses?.[m.user_id] === 'yes').length > 0 ? (
                    members
                      .filter(m => memberResponses?.[m.user_id] === 'yes')
                      .map(m => {
                        const isMe = m.user_id === currentUserId;
                        const displayName = m.full_name || m.user_name || '?';
                        return (
                          <View key={m.user_id} style={cardStyles.avatarItem}>
                            <View style={[
                              cardStyles.avatarCircle,
                              cardStyles.avatarCircleYes,
                              isMe && cardStyles.avatarCircleMe,
                            ]}>
                              <Text style={[cardStyles.avatarInitial, isMe && cardStyles.avatarInitialMe]}>
                                {displayName.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <Text style={cardStyles.avatarName} numberOfLines={1}>
                              {isMe ? t('common.you') : displayName.split(' ')[0]}
                            </Text>
                          </View>
                        );
                      })
                  ) : (
                    <Text style={cardStyles.noAttendees}>-</Text>
                  )}
                </View>
              )}
            </View>

            {/* Not Attending Column */}
            <View style={[cardStyles.attendeesColumn, cardStyles.attendeesColumnNo]}>
              <View style={cardStyles.attendeesLabelRow}>
                <Text style={cardStyles.attendeesLabelRed}>{t('common.notAttending')}</Text>
                {!loadingMembers && (
                  <Text style={cardStyles.attendeesCountNo}>
                    {members?.filter(m => memberResponses?.[m.user_id] === 'no').length || 0}
                  </Text>
                )}
              </View>
              {loadingMembers ? (
                <ActivityIndicator size="small" color="#E57373" style={{ marginTop: 8 }} />
              ) : (
                <View style={cardStyles.avatarRow}>
                  {members?.filter(m => memberResponses?.[m.user_id] === 'no').length > 0 ? (
                    members
                      .filter(m => memberResponses?.[m.user_id] === 'no')
                      .map(m => {
                        const isMe = m.user_id === currentUserId;
                        const displayName = m.full_name || m.user_name || '?';
                        return (
                          <View key={m.user_id} style={cardStyles.avatarItem}>
                            <View style={[
                              cardStyles.avatarCircle,
                              cardStyles.avatarCircleNo,
                              isMe && cardStyles.avatarCircleMeNo,
                            ]}>
                              <Text style={cardStyles.avatarInitial}>
                                {displayName.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <Text style={cardStyles.avatarNameNo} numberOfLines={1}>
                              {isMe ? t('common.you') : displayName.split(' ')[0]}
                            </Text>
                          </View>
                        );
                      })
                  ) : (
                    <Text style={cardStyles.noAttendees}>-</Text>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* === SECTION 3: VOTING CTA — Prominent when user hasn't voted === */}
          {recipeType !== 'no_voting' && myResponse === 'yes' && (
            <View style={cardStyles.votingCTASection}>
              {(!topMeals || topMeals.length === 0) ? (
                /* No votes yet — big prominent CTA */
                <TouchableOpacity
                  style={cardStyles.votingCTABig}
                  onPress={onStartVoting}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={cardStyles.votingCTAEmoji}>🗳</Text>
                      <View style={cardStyles.votingCTATextWrap}>
                        <Text style={cardStyles.votingCTATitle}>{t('meals.voteOnMeals') || 'Kies wat we eten vanavond'}</Text>
                        <Text style={cardStyles.votingCTASubtitle}>{t('meals.tapToVote') || 'Stem op je favoriete gerecht'}</Text>
                      </View>
                      <Feather name="chevron-right" size={20} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                /* Already has votes — smaller action button */
                <TouchableOpacity
                  style={cardStyles.votingCTASmall}
                  onPress={onStartVoting}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#FF6B00" size="small" />
                  ) : (
                    <>
                      <Feather name="check-circle" size={16} color="#FF6B00" />
                      <Text style={cardStyles.votingCTASmallText}>{t('common.voting')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* === SECTION 1: DISH LIST — Redesigned recipe cards with vote bars === */}
          {recipeType !== 'no_voting' && (topMeals?.length > 0 || topMealsLoading) && (() => {
            // Sort by votes (highest first)
            const sortedMeals = topMeals ? [...topMeals].sort((a, b) => {
              const votesA = a.yes_votes ?? a.vote_total ?? 0;
              const votesB = b.yes_votes ?? b.vote_total ?? 0;
              return votesB - votesA;
            }) : [];
            const maxVotes = sortedMeals.length > 0 ? Math.max(1, sortedMeals[0]?.yes_votes ?? sortedMeals[0]?.vote_total ?? 0) : 1;

            return (
              <View style={cardStyles.top3Section}>
                <Text style={cardStyles.top3SectionTitle}>{t('meals.topRecipes')}</Text>
                {sortedMeals.length > 0 && (
                  <View style={cardStyles.top3Preview}>
                    {sortedMeals.slice(0, 3).map((meal, idx) => {
                      const name = meal.meal_data?.name || t('meals.recipe');
                      const votes = meal.yes_votes ?? meal.vote_total ?? 0;
                      const thumbnailUrl = meal.meal_data?.thumbnail_url;
                      const cookingTime = meal.meal_data?.total_time_minutes;
                      const isTopVoted = idx === 0 && votes > 0;
                      const voteRatio = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
                      const tags = meal.meal_data?.tags;

                      return (
                        <TouchableOpacity
                          key={meal.meal_option_id || idx}
                          style={[
                            cardStyles.top3RecipeCard,
                            isTopVoted && cardStyles.top3RecipeCardTop,
                          ]}
                          onPress={() => onRecipePress?.(meal)}
                          activeOpacity={0.7}
                        >
                          {/* Rank badge */}
                          <View style={[
                            cardStyles.top3RankBadge,
                            { backgroundColor: idx === 0 ? '#FF6B00' : idx === 1 ? '#A09485' : '#C0B9AE' },
                          ]}>
                            <Text style={cardStyles.top3RankText}>{idx + 1}</Text>
                          </View>

                          {/* Thumbnail */}
                          {thumbnailUrl ? (
                            <Image
                              source={{ uri: thumbnailUrl }}
                              style={cardStyles.top3RecipeImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={[cardStyles.top3RecipeImage, cardStyles.top3RecipeImagePlaceholder]}>
                              <Text style={cardStyles.top3RecipeImageEmoji}>🍽</Text>
                            </View>
                          )}

                          {/* Info + vote bar */}
                          <View style={cardStyles.top3RecipeInfo}>
                            <Text style={[cardStyles.top3RecipeName, isTopVoted && cardStyles.top3RecipeNameTop]} numberOfLines={1}>{name}</Text>
                            <View style={cardStyles.top3RecipeMeta}>
                              {cookingTime ? (
                                <Text style={cardStyles.top3RecipeTime}>⏱ {cookingTime} min</Text>
                              ) : null}
                              {tags && tags.length > 0 && tags.slice(0, 1).map((tag, ti) => (
                                <View key={ti} style={cardStyles.top3RecipeTag}>
                                  <Text style={cardStyles.top3RecipeTagText}>{tag}</Text>
                                </View>
                              ))}
                            </View>
                            {/* Vote progress bar */}
                            <View style={cardStyles.voteBarContainer}>
                              <View style={[cardStyles.voteBarFill, { width: `${voteRatio}%` }, isTopVoted && cardStyles.voteBarFillTop]} />
                            </View>
                          </View>

                          {/* Vote count */}
                          <View style={cardStyles.top3VoteCount}>
                            <Text style={[cardStyles.top3VoteNumber, isTopVoted && cardStyles.top3VoteNumberTop]}>{votes}</Text>
                            <Text style={cardStyles.top3VoteLabel}>{votes === 1 ? t('meals.vote') : t('meals.votes')}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
                {topMealsLoading && (!topMeals || topMeals.length === 0) && (
                  <View style={cardStyles.top3Preview}>
                    <ActivityIndicator size="small" color="#8B7355" />
                  </View>
                )}
              </View>
            );
          })()}

          {/* Bottom row: invite + recipes, menu right */}
          <View style={cardStyles.bottomRow}>
            <View style={cardStyles.bottomRowButtons}>
              <TouchableOpacity style={cardStyles.inviteButton} onPress={handleShareGroup}>
                <Feather name="user-plus" size={13} color="#FEFEFE" style={{ marginRight: 6 }} />
                <Text style={cardStyles.inviteButtonText}>{t('common.inviteMembers') || 'Groepsleden uitnodigen'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={cardStyles.inviteButton} onPress={() => setShowGroupRecipesModal(true)}>
                <Feather name="book-open" size={13} color="#FEFEFE" style={{ marginRight: 6 }} />
                <Text style={cardStyles.inviteButtonText}>{t('groups.recipes') || 'Recepten'}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={cardStyles.menuButton}
              onPress={() => setShowActionsMenu(true)}
            >
              <Feather name="settings" size={18} color="#999" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Actions Menu Modal */}
      <Modal
        visible={showActionsMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActionsMenu(false)}
      >
        <TouchableOpacity 
          style={cardStyles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowActionsMenu(false)}
        >
          <View style={cardStyles.menuContainer}>
            <TouchableOpacity
              style={cardStyles.menuItem}
              onPress={() => {
                handleCopyCode();
                setShowActionsMenu(false);
              }}
            >
              <Text style={cardStyles.menuItemText}>{t('common.copyCode')}</Text>
              <Text style={cardStyles.menuItemCode}>{group.join_code}</Text>
            </TouchableOpacity>
            
            <View style={cardStyles.menuDivider} />
            
            <TouchableOpacity
              style={cardStyles.menuItem}
              onPress={() => {
                setShowActionsMenu(false);
                setShowMembersModal(true);
              }}
            >
              <Text style={cardStyles.menuItemText}>{t('common.members')}</Text>
            </TouchableOpacity>

            <View style={cardStyles.menuDivider} />

            <TouchableOpacity
              style={cardStyles.menuItem}
              onPress={() => {
                setShowActionsMenu(false);
                setShowGroupRecipesModal(true);
              }}
            >
              <Text style={cardStyles.menuItemText}>{t('groups.recipes') || 'Recepten'}</Text>
            </TouchableOpacity>

            <View style={cardStyles.menuDivider} />

            <TouchableOpacity
              style={cardStyles.menuItem}
              onPress={() => {
                setShowActionsMenu(false);
                onChangePhoto?.();
              }}
            >
              <Text style={cardStyles.menuItemText}>{group.photo_url ? 'Foto wijzigen' : 'Groepsfoto toevoegen'}</Text>
            </TouchableOpacity>

            <View style={cardStyles.menuDivider} />

            <TouchableOpacity
              style={cardStyles.menuItem}
              onPress={() => {
                setShowActionsMenu(false);
                onLeaveGroup();
              }}
            >
              <Text style={cardStyles.menuItemTextMuted}>{t('common.leave')}</Text>
            </TouchableOpacity>

            {isCreator && (
              <>
                <View style={cardStyles.menuDivider} />
                <TouchableOpacity
                  style={cardStyles.menuItem}
                  onPress={() => {
                    setShowActionsMenu(false);
                    onDeleteGroup();
                  }}
                >
                  <Text style={cardStyles.menuItemTextDanger}>{t('common.delete')}</Text>
                </TouchableOpacity>
              </>
            )}
            
            <View style={cardStyles.menuDivider} />
            
            <TouchableOpacity
              style={cardStyles.menuItemCancel}
              onPress={() => setShowActionsMenu(false)}
            >
              <Text style={cardStyles.menuItemTextCancel}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Members Modal */}
      <Modal
        visible={showMembersModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMembersModal(false)}
      >
        <TouchableOpacity 
          style={cardStyles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMembersModal(false)}
        >
          <View style={cardStyles.membersContainer} onStartShouldSetResponder={() => true}>
            <View style={cardStyles.membersHeader}>
              <Text style={cardStyles.membersTitle}>{t('common.members')}</Text>
              <TouchableOpacity onPress={() => setShowMembersModal(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={cardStyles.membersClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={cardStyles.membersList} showsVerticalScrollIndicator={false}>
              {members && members.length > 0 ? members.map(m => (
                <View key={m.user_id} style={cardStyles.memberRow}>
                  <View style={cardStyles.memberAvatar}>
                    <Text style={cardStyles.memberAvatarText}>
                      {(m.full_name || m.user_name || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={cardStyles.memberName}>
                    {m.full_name || m.user_name || t('common.unknown')}
                    {m.user_id === currentUserId && ` (${t('common.you')})`}
                  </Text>
                </View>
              )) : (
                <Text style={cardStyles.membersEmpty}>{t('emptyStates.noMembers')}</Text>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Group Recipes Modal */}
      <GroupRecipesScreen
        visible={showGroupRecipesModal}
        onClose={() => setShowGroupRecipesModal(false)}
        groupId={group.id}
        groupName={group.name}
      />
    </View>
  );
});

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    marginBottom: 14,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  groupPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: '#2D2D2D',
    marginBottom: 3,
  },
  attendanceCount: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#A09485',
  },
  joinCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  joinCodeText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#C0B9AE',
    letterSpacing: 1,
  },
  // Yes/No buttons on header -- segmented control
  responseButtons: {
    flexDirection: 'row',
    marginLeft: 12,
    backgroundColor: '#F0EDE8',
    borderRadius: 14,
    padding: 3,
  },
  responseBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 11,
    borderWidth: 0,
  },
  responseBtnYes: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  responseBtnYesActive: {
    backgroundColor: '#FF6B00',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  responseBtnNo: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  responseBtnNoActive: {
    backgroundColor: '#E57373',
    shadowColor: '#E57373',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  responseBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#8B8580',
  },
  responseBtnTextActive: {
    color: '#FFFFFF',
  },
  expandedContent: {
    overflow: 'hidden',
  },
  expandedInner: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: '#F0EDE8',
  },
  loadingMembers: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  // === SECTION 2: Avatar-based attendee layout ===
  attendeesRow: {
    flexDirection: 'row',
    paddingTop: 14,
    gap: 10,
  },
  attendeesColumn: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
  },
  attendeesColumnYes: {
    backgroundColor: 'rgba(255, 107, 0, 0.06)',
  },
  attendeesColumnNo: {
    backgroundColor: 'rgba(229, 115, 115, 0.06)',
  },
  attendeesLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  attendeesLabelGreen: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#FF6B00',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  attendeesLabelRed: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#E57373',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  attendeesCount: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#FF6B00',
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  attendeesCountNo: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#E57373',
    backgroundColor: 'rgba(229, 115, 115, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  avatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  avatarItem: {
    alignItems: 'center',
    width: 44,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  avatarCircleYes: {
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
  },
  avatarCircleNo: {
    backgroundColor: 'rgba(229, 115, 115, 0.12)',
  },
  avatarCircleMe: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B00',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarCircleMeNo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E57373',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarInitial: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#5A4A3A',
  },
  avatarInitialMe: {
    color: '#FFFFFF',
  },
  avatarName: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: '#5A4A3A',
    textAlign: 'center',
  },
  avatarNameNo: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: '#A09A92',
    textAlign: 'center',
  },
  noAttendees: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#CCC',
    fontStyle: 'italic',
  },
  // === SECTION 3: Voting CTA ===
  votingCTASection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0EDE8',
  },
  votingCTABig: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  votingCTAEmoji: {
    fontSize: 22,
    marginRight: 12,
  },
  votingCTATextWrap: {
    flex: 1,
  },
  votingCTATitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  votingCTASubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  votingCTASmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.2)',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  votingCTASmallText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FF6B00',
  },
  // === SECTION 1: Redesigned dish list ===
  top3Section: {
    marginTop: 12,
  },
  top3SectionTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#8B7355',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  top3Preview: {
    gap: 8,
  },
  top3RecipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F6F3',
    borderRadius: 14,
    padding: 10,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  top3RecipeCardTop: {
    backgroundColor: 'rgba(255, 107, 0, 0.06)',
    borderColor: 'rgba(255, 107, 0, 0.15)',
  },
  top3RankBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  top3RankText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  top3RecipeImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 10,
  },
  top3RecipeImagePlaceholder: {
    backgroundColor: '#E8E4DF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  top3RecipeImageEmoji: {
    fontSize: 20,
  },
  top3RecipeInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  top3RecipeName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#2D2D2D',
    marginBottom: 3,
  },
  top3RecipeNameTop: {
    color: '#FF6B00',
  },
  top3RecipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  top3RecipeTime: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#8B8885',
  },
  top3RecipeTag: {
    backgroundColor: 'rgba(139, 115, 85, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  top3RecipeTagText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: '#8B7355',
  },
  // Vote progress bar
  voteBarContainer: {
    height: 4,
    backgroundColor: 'rgba(139, 115, 85, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  voteBarFill: {
    height: '100%',
    backgroundColor: '#C0B9AE',
    borderRadius: 2,
  },
  voteBarFillTop: {
    backgroundColor: '#FF6B00',
  },
  // Vote count badge
  top3VoteCount: {
    alignItems: 'center',
    marginLeft: 10,
    minWidth: 30,
  },
  top3VoteNumber: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#8B7355',
  },
  top3VoteNumberTop: {
    color: '#FF6B00',
  },
  top3VoteLabel: {
    fontSize: 9,
    fontFamily: 'Inter_400Regular',
    color: '#A09A92',
    textTransform: 'uppercase',
  },
  // Three-dot menu button
  threeDotsButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  threeDotsText: {
    fontSize: 18,
    color: '#999',
    letterSpacing: 2,
  },
  chatButton: {
    padding: 4,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B7355',
  },
  // Actions menu modal
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  menuContainer: {
    backgroundColor: '#FDFCFA',
    borderRadius: 20,
    width: '100%',
    maxWidth: 300,
    overflow: 'hidden',
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    paddingTop: 10,
    paddingBottom: 4,
  },
  bottomRowButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B7355',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  inviteButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#FEFEFE',
  },
  menuButton: {
    padding: 8,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#2D2D2D',
  },
  menuItemCode: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#8B7355',
    marginTop: 4,
    letterSpacing: 1,
  },
  menuItemTextMuted: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#666',
  },
  menuItemTextDanger: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#E57373',
  },
  menuItemCancel: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#F5F2EE',
  },
  menuItemTextCancel: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#8B7355',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F0EDE8',
  },
  membersContainer: {
    backgroundColor: '#FEFEFE',
    borderRadius: 22,
    width: '100%',
    maxWidth: 360,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  membersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE8',
  },
  membersTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#2D2D2D',
  },
  membersClose: {
    fontSize: 18,
    color: '#C0B9AE',
  },
  membersList: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  memberName: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#2D2D2D',
  },
  membersEmpty: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#8B8B8B',
    textAlign: 'center',
    paddingVertical: 20,
  },
  // Legacy styles (kept for compatibility)
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F6F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarYes: {
    backgroundColor: '#E8F5E9',
  },
  memberAvatarNo: {
    backgroundColor: '#FFF3E0',
  },
  memberAvatarText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#8B7355',
  },
  memberName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#2D2D2D',
  },
  youLabel: {
    fontFamily: 'Inter_400Regular',
    color: '#8B7355',
  },
  memberStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F8F6F3',
    minWidth: 50,
    alignItems: 'center',
  },
  memberStatusYes: {
    backgroundColor: '#E8F5E9',
  },
  memberStatusNo: {
    backgroundColor: '#FFF3E0',
  },
  memberStatusText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#999',
  },
  memberStatusTextYes: {
    color: '#FF6B00',
  },
  memberStatusTextNo: {
    color: '#FF9800',
  },
  voteButton: {
    marginTop: 16,
    backgroundColor: '#8B7355',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  voteButtonAccepted: {
    marginTop: 16,
    backgroundColor: '#FF6B00',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  voteButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  voteButtonDisabled: {
    marginTop: 16,
    backgroundColor: '#E8E2DA',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  voteButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#FEFEFE',
  },
  voteButtonTextDisabled: {
    color: '#8B8885',
  },
  top3Button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F8F6F3',
    borderRadius: 10,
  },
  top3ButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#8B7355',
  },
  top3ButtonChevron: {
    fontSize: 18,
    color: '#8B7355',
  },
  groupActionsSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0EDE8',
  },
  groupActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  leaveGroupButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF9800',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  leaveGroupText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#FF9800',
  },
  deleteGroupButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#CC4444',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteGroupText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#CC4444',
  },
});

// ============================================
// EXPANDABLE SPECIAL OCCASION CARD COMPONENT
// ============================================
const ExpandableOccasionCard = React.memo(({ 
  occasion, 
  occasionLabels, 
  isExpanded,
  onToggle,
  currentUserId,
  memberResponses,
  members,
  myResponse,
  onResponseChange,
  loadingMembers,
  actionLoading,
  isPast = false // If true, hides voting controls (for old events)
}) => {
  const { t } = useTranslation();
  const expandAnimation = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
  const occasionInfo = occasionLabels[occasion.occasion_type] || occasionLabels.other;
  const isToday = occasion.date === getTodayDate();

  useEffect(() => {
    Animated.spring(expandAnimation, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: false,
      tension: 80,
      friction: 12,
    }).start();
  }, [isExpanded]);

  // Count responses
  const getResponseCounts = () => {
    let yes = 0, no = 0;
    Object.values(memberResponses || {}).forEach(r => {
      if (r === 'yes') yes++;
      if (r === 'no') no++;
    });
    return { yes, no, pending: (members?.length || 0) - yes - no };
  };

  const counts = getResponseCounts();

  // Status dot color based on my response
  const getStatusColor = () => {
    if (myResponse === 'yes') return '#FF6B00';
    if (myResponse === 'no') return '#FF9800';
    return '#D0D0D0';
  };

  // Calculate dynamic height based on content
  const baseHeight = 280; // message + toggle + summary + footer + padding
  const membersHeight = (members?.length || 0) * 50;
  
  const expandedHeight = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, baseHeight + membersHeight],
  });

  const chevronRotation = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={[occasionStyles.card, { borderLeftColor: occasionInfo.color }]}>
      {/* Header - Always Visible - Entire card is tappable to expand */}
      <TouchableOpacity
        style={occasionStyles.header}
        onPress={() => {
          log.occasions('Header tapped');
          onToggle();
        }}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View style={[occasionStyles.typeBar, { backgroundColor: occasionInfo.color }]} />
        
        <View style={occasionStyles.headerContent}>
          <View style={occasionStyles.titleRow}>
            <Text style={occasionStyles.type}>{occasionInfo.label}</Text>
            <View style={occasionStyles.headerRight}>
              <View style={[occasionStyles.statusDot, { backgroundColor: getStatusColor() }]} />
              <View style={[occasionStyles.dateBadge, isToday && occasionStyles.dateBadgeToday]}>
                <Text style={[occasionStyles.dateText, isToday && occasionStyles.dateTextToday]}>
                  {isToday ? t('common.today') : formatDateShortNL(new Date(occasion.date))}
                </Text>
              </View>
              <Animated.Text style={[
                occasionStyles.chevron,
                { transform: [{ rotate: chevronRotation }] }
              ]}>
                ▼
              </Animated.Text>
            </View>
          </View>
          <Text style={occasionStyles.group}>{occasion.groupName}</Text>
        </View>
      </TouchableOpacity>
      
      {occasion.occasion_message && !isExpanded && (
        <Text style={occasionStyles.message} numberOfLines={1}>
          "{occasion.occasion_message}"
        </Text>
      )}
      
      {!isExpanded && (
        <View style={occasionStyles.footer}>
          <Text style={occasionStyles.creator}>{occasion.requesterName}</Text>
          {occasion.time && <Text style={occasionStyles.time}>{occasion.time.substring(0, 5)}</Text>}
        </View>
      )}

      {/* Expanded Content */}
      <Animated.View style={[
        occasionStyles.expandedContent,
        { maxHeight: expandedHeight, opacity: expandAnimation }
      ]}>
        <View style={occasionStyles.expandedInner}>
          {/* Full Message */}
          {occasion.occasion_message && (
            <Text style={occasionStyles.fullMessage}>"{occasion.occasion_message}"</Text>
          )}

          {/* Your Response Toggle - Only show for current events */}
          {!isPast && (
          <View style={occasionStyles.myResponseSection}>
              <Text style={occasionStyles.myResponseLabel}>{t('specialOccasion.areYouJoining')}</Text>
            {loadingMembers ? (
              <View style={occasionStyles.toggleLoading}>
                <ActivityIndicator size="small" color="#8B7355" />
              </View>
            ) : (
              <YesNoToggle
                value={myResponse}
                onChange={(newValue) => onResponseChange(currentUserId, newValue)}
              />
            )}
          </View>
          )}

          {/* Response Summary */}
          <View style={occasionStyles.summarySection}>
            <View style={occasionStyles.summaryItem}>
              <View style={[occasionStyles.summaryDot, { backgroundColor: '#FF6B00' }]} />
              <Text style={occasionStyles.summaryText}>{counts.yes} {t('common.yes').toLowerCase()}</Text>
            </View>
            <View style={occasionStyles.summaryItem}>
              <View style={[occasionStyles.summaryDot, { backgroundColor: '#FF9800' }]} />
              <Text style={occasionStyles.summaryText}>{counts.no} {t('common.no').toLowerCase()}</Text>
            </View>
            {counts.pending > 0 && (
              <View style={occasionStyles.summaryItem}>
                <View style={[occasionStyles.summaryDot, { backgroundColor: '#D0D0D0' }]} />
                <Text style={occasionStyles.summaryText}>{counts.pending} {t('common.pending')}</Text>
              </View>
            )}
          </View>

          {/* Members List */}
          {loadingMembers ? (
            <View style={occasionStyles.loadingMembers}>
              <ActivityIndicator size="small" color="#8B7355" />
            </View>
          ) : (
            <View style={occasionStyles.membersList}>
              {members?.map((member) => {
                const response = memberResponses?.[member.user_id];
                const isYes = response === 'yes';
                const isNo = response === 'no';
                const isCurrentUser = member.user_id === currentUserId;

                return (
                  <View key={member.user_id} style={occasionStyles.memberRow}>
                    <View style={[
                      occasionStyles.memberAvatar,
                      isYes && occasionStyles.memberAvatarYes,
                      isNo && occasionStyles.memberAvatarNo
                    ]}>
                      <Text style={occasionStyles.memberAvatarText}>
                        {(member.full_name || member.user_name || 'U')[0].toUpperCase()}
                      </Text>
                    </View>
                    <Text style={occasionStyles.memberName} numberOfLines={1}>
                      {member.full_name || member.user_name || 'User'}
                      {isCurrentUser && <Text style={occasionStyles.youLabel}> ({t('common.you')})</Text>}
                    </Text>
                    <View style={[
                      occasionStyles.memberStatus,
                      isYes && occasionStyles.memberStatusYes,
                      isNo && occasionStyles.memberStatusNo
                    ]}>
                      <Text style={[
                        occasionStyles.memberStatusText,
                        isYes && occasionStyles.memberStatusTextYes,
                        isNo && occasionStyles.memberStatusTextNo
                      ]}>
                        {isYes ? t('common.yes') : isNo ? t('common.no') : '—'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Footer with creator info */}
          <View style={occasionStyles.expandedFooter}>
            <Text style={occasionStyles.creator}>{t('common.createdBy')} {occasion.requesterName}</Text>
            {occasion.time && <Text style={occasionStyles.time}>{occasion.time.substring(0, 5)}</Text>}
          </View>
        </View>
      </Animated.View>
    </View>
  );
});

const occasionStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    marginBottom: 14,
    borderWidth: 0,
    borderColor: 'transparent',
    borderLeftWidth: 4,
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
  },
  typeBar: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  type: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#2D2D2D',
  },
  dateBadge: {
    backgroundColor: '#F8F6F3',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  dateBadgeToday: {
    backgroundColor: '#8B7355',
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#666',
  },
  dateTextToday: {
    color: '#FEFEFE',
  },
  chevron: {
    fontSize: 10,
    color: '#AAA',
    marginLeft: 4,
  },
  group: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#8B7355',
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6B6B6B',
    fontStyle: 'italic',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  fullMessage: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6B6B6B',
    fontStyle: 'italic',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8F6F3',
  },
  creator: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#999',
  },
  time: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#8B7355',
  },
  expandedContent: {
    overflow: 'hidden',
  },
  expandedInner: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F0EDE8',
  },
  myResponseSection: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE8',
  },
  myResponseLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#2D2D2D',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  summarySection: {
    flexDirection: 'row',
    paddingVertical: 12,
    gap: 18,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  summaryText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#666',
  },
  loadingMembers: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  toggleLoading: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  membersList: {
    paddingTop: 4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F6F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  memberAvatarYes: {
    backgroundColor: '#E8F5E9',
  },
  memberAvatarNo: {
    backgroundColor: '#FFF3E0',
  },
  memberAvatarText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#8B7355',
  },
  memberName: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#2D2D2D',
  },
  youLabel: {
    fontFamily: 'Inter_400Regular',
    color: '#8B7355',
  },
  memberStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#F8F6F3',
    minWidth: 44,
    alignItems: 'center',
  },
  memberStatusYes: {
    backgroundColor: '#E8F5E9',
  },
  memberStatusNo: {
    backgroundColor: '#FFF3E0',
  },
  memberStatusText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#999',
  },
  memberStatusTextYes: {
    color: '#FF6B00',
  },
  memberStatusTextNo: {
    color: '#FF9800',
  },
  voteButton: {
    marginTop: 12,
    backgroundColor: '#8B7355',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  voteButtonAccepted: {
    marginTop: 12,
    backgroundColor: '#FF6B00',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  voteButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  voteButtonDisabled: {
    backgroundColor: '#D0CCC7',
    shadowOpacity: 0,
    elevation: 0,
  },
  voteButtonDisabledView: {
    marginTop: 12,
    backgroundColor: '#E8E2DA',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  voteButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FEFEFE',
  },
  voteButtonTextDisabled: {
    color: '#8B8885',
  },
  expandedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8F6F3',
  },
});

// ============================================
// MAIN COMPONENT
// ============================================
export default function GroupsScreenSimple({ navigation, route, isActive = true, onReady, pendingGroupReopen, onPendingGroupReopenCleared, pendingJoinCode, onJoinCodeHandled }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  
  // Use AppStateContext for cached data
  const appState = useAppState();
  const {
    groups: contextGroups,
    groupsLoading: contextGroupsLoading,
    userProfile,
    loadGroups: contextLoadGroups,
    loadGroupMembers: contextLoadGroupMembers,
    loadDailyResponses: contextLoadDailyResponses,
    loadActiveMealRequest: contextLoadActiveMealRequest,
    loadTopMeals: contextLoadTopMeals,
    getCachedGroupMembers,
    getCachedDailyResponses,
    getCachedActiveMealRequest,
    updateCachedResponse,
    updateGroup,
    setGuestStatus,
    getPreloadedExpansionData,
    preloadAllGroupData,
    invalidateCache,
    invalidateGroupCache,
    refreshTrigger,
  } = appState;

  // Keep stable references to context functions so effects don't retrigger
  const loadTopMealsRef = useRef(contextLoadTopMeals);
  const loadGroupsRef = useRef(contextLoadGroups);
  const setGuestStatusRef = useRef(setGuestStatus);
  const preloadAllGroupDataRef = useRef(preloadAllGroupData);
  const fetchResponsesRef = useRef(null);
  const applyResponsesRef = useRef(null);
  const buildKeyRef = useRef(null);

  useEffect(() => {
    loadTopMealsRef.current = contextLoadTopMeals;
    loadGroupsRef.current = contextLoadGroups;
    setGuestStatusRef.current = setGuestStatus;
    preloadAllGroupDataRef.current = preloadAllGroupData;
  }, [contextLoadTopMeals, contextLoadGroups, setGuestStatus, preloadAllGroupData]);
  
  // Local profile state as fallback if context hasn't loaded yet
  const [localProfile, setLocalProfile] = useState(null);
  
  // Load profile directly from AsyncStorage if context profile is null (faster display)
  useEffect(() => {
    if (!userProfile && !localProfile) {
      // Try to load from AsyncStorage directly for instant display
      const loadLocalProfile = async () => {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const cached = await AsyncStorage.getItem('cachedUserProfile');
          if (cached) {
            const profile = JSON.parse(cached);
            setLocalProfile(profile);
            log.groups('Loaded local profile fallback:', profile?.full_name);
          }
        } catch (error) {
          // Ignore errors, context will load eventually
        }
      };
      loadLocalProfile();
    }
  }, [userProfile, localProfile]);
  
  // Use context profile if available, otherwise fallback to local
  const effectiveProfile = userProfile || localProfile;
  
  // Derive user name from profile, auth user metadata, or email as last resort
  const [authUserName, setAuthUserName] = useState('');
  const userName = effectiveProfile?.full_name || effectiveProfile?.display_name || authUserName || '';
  
  // Core state - groups now come from context (includes AsyncStorage cache)
  const groups = contextGroups || [];
  // Only show loading if no cached groups AND context is loading
  const [loading, setLoading] = useState(false);
  
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Selected group state (full-page view)
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const expandedGroupId = selectedGroupId; // alias for compatibility
  const setExpandedGroupId = setSelectedGroupId; // alias for compatibility
  const expandedGroupIdRef = useRef(null); // Ref to track current selected group for async operations
  const activeRequestIdRef = useRef(null); // Ref to track current request ID for polling
  const [expandedMembers, setExpandedMembers] = useState([]);
  const [expandedResponses, setExpandedResponses] = useState({});
  const [expandedLoading, setExpandedLoading] = useState(false);
  const [myResponse, setMyResponse] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Track my response for each group (for collapsed state display)
  const [allGroupResponses, setAllGroupResponses] = useState({});

  // Group switcher dropdown state
  const [showGroupSwitcher, setShowGroupSwitcher] = useState(false);
  const [groupOrder, setGroupOrder] = useState(null);

  // Group action modals (moved from ExpandableGroupCard to screen level)
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showGroupRecipesModal, setShowGroupRecipesModal] = useState(false);

  // Shopping state
  const [activeShopper, setActiveShopper] = useState(null); // { user_id, user_name, started_at }
  const [shoppingLoading, setShoppingLoading] = useState(false);

  // When midnight reset fires (refreshTrigger changes), clear all local response state
  // and reload everything fresh for the new day
  const initialRefreshTrigger = useRef(refreshTrigger);
  useEffect(() => {
    if (refreshTrigger === initialRefreshTrigger.current) return; // skip initial mount
    log.groups('Midnight reset detected (refreshTrigger changed) - clearing all response state and reloading');
    setAllGroupResponses({});
    setExpandedResponses({});
    setMyResponse(null);
    setExpandedGroupId(null);
    expandedGroupIdRef.current = null;
    setTopMeals([]);
    setActiveRequestId(null);
    activeRequestIdRef.current = null;
    setActiveRecipeType(null);
    knownActiveRequests.current = {};
    // Force reload all groups data fresh
    contextLoadGroups(true).catch(() => {});
    // Re-fetch responses for collapsed cards
    if (groups?.length && fetchResponsesRef.current && currentUserId) {
      setTimeout(() => {
        fetchResponsesRef.current(groups, currentUserId).then(responses => {
          if (responses && applyResponsesRef.current) {
            applyResponsesRef.current(responses, '');
          }
        }).catch(() => {});
      }, 500);
    }
  }, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load saved group order on mount
  useEffect(() => {
    loadGroupOrder().then(order => {
      if (order) setGroupOrder(order);
    });
  }, []);

  // Sort groups by saved order
  const sortedGroups = groupOrder ? sortGroupsByOrder(groups, groupOrder) : groups;

  // Auto-select first group when groups load and none is selected
  useEffect(() => {
    if (sortedGroups.length > 0 && !selectedGroupId) {
      const firstId = sortedGroups[0].group_id || sortedGroups[0].id;
      setSelectedGroupId(firstId);
      expandedGroupIdRef.current = firstId;
    }
    // If selected group was removed, switch to first
    if (selectedGroupId && sortedGroups.length > 0) {
      const exists = sortedGroups.some(g => (g.group_id || g.id) === selectedGroupId);
      if (!exists) {
        const firstId = sortedGroups[0].group_id || sortedGroups[0].id;
        setSelectedGroupId(firstId);
        expandedGroupIdRef.current = firstId;
      }
    }
    // If no groups left, clear selection
    if (sortedGroups.length === 0 && selectedGroupId) {
      setSelectedGroupId(null);
      expandedGroupIdRef.current = null;
    }
  }, [sortedGroups.length, selectedGroupId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get the currently selected group object
  const selectedGroup = sortedGroups.find(g => (g.group_id || g.id) === selectedGroupId) || null;

  // Unread chat messages per group
  const [unreadGroups, setUnreadGroups] = useState({});
  const chatOpenGroupRef = useRef(null);
  const chatLastReadRef = useRef({});

  // Load last-read timestamps and check for unread messages on mount
  useEffect(() => {
    if (!currentUserId || !groups.length) return;
    (async () => {
      try {
        const AsyncStorageMod = require('@react-native-async-storage/async-storage').default;
        const stored = await AsyncStorageMod.getItem('chatLastRead');
        const lastRead = stored ? JSON.parse(stored) : {};
        chatLastReadRef.current = lastRead;

        // Check each group for messages newer than last read
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const unread = {};

        for (const group of groups) {
          const groupId = group.group_id || group.id;
          const lastReadAt = lastRead[groupId] || todayStart.toISOString();

          const { data } = await supabase
            .from('group_messages')
            .select('id')
            .eq('group_id', groupId)
            .gt('created_at', lastReadAt)
            .neq('user_id', currentUserId)
            .limit(1);

          if (data?.length > 0) {
            unread[groupId] = true;
          }
        }

        if (Object.keys(unread).length > 0) {
          setUnreadGroups(prev => ({ ...prev, ...unread }));
        }
      } catch (_) {}
    })();
  }, [currentUserId, groups.length]);

  // INSTANT: Load cached responses from AsyncStorage on mount for immediate yes/no display
  useEffect(() => {
    const loadCachedResponsesInstant = async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const cached = await AsyncStorage.getItem('cachedDailyResponses');
        if (cached) {
          const data = JSON.parse(cached);
          const today = new Date().toISOString().split('T')[0];
          
          // Only use if from today
          if (data.date === today && data.responses) {
            // Get current user ID
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            // Convert format: { groupId: { odId: response } } → { groupId: response }
            const myResponses = {};
            Object.entries(data.responses).forEach(([groupId, groupResponses]) => {
              if (groupResponses && groupResponses[user.id]) {
                myResponses[groupId] = groupResponses[user.id];
              }
            });
            
            if (Object.keys(myResponses).length > 0) {
              log.groups('INSTANT: Loaded cached yes/no from AsyncStorage:', Object.keys(myResponses).length, 'groups');
              setAllGroupResponses(prev => ({ ...prev, ...myResponses }));
            }
          }
        }
      } catch (error) {
        // Ignore errors - context will load responses anyway
      }
    };
    
    loadCachedResponsesInstant();
  }, []); // Run once on mount

  // Top meals state (for expanded groups/occasions)
  const [topMeals, setTopMealsRaw] = useState([]);
  const setTopMeals = (meals) => setTopMealsRaw(Array.isArray(meals) && meals.length > 0 ? sortTopMeals(meals) : meals || []);
  const [topMealsLoading, setTopMealsLoading] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState(null);
  const [activeRecipeType, setActiveRecipeType] = useState(null); // 'voting' or 'no_voting'
  
  // Persistent memory of known active requests per group.
  // Survives collapse/expand cycles so Top 3 is restored immediately.
  // Updated whenever we discover an active request (preload, background refresh, handleStartVoting).
  const knownActiveRequests = useRef({}); // { [groupId]: { requestId, recipeType } }
  
  // Recipe modal state
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [servingCount, setServingCount] = useState(4);
  
  // Top 3 modal - fetches fresh data every time it opens
  const [showTop3Modal, setShowTop3Modal] = useState(false);
  const [top3ModalLoadFn, setTop3ModalLoadFn] = useState(null);
  
  // Swipeable refs to close them when tapping elsewhere
  const swipeableRefs = useRef({});
  const openSwipeableId = useRef(null);
  
  // Track optimistic updates to prevent realtime subscription from overwriting
  const optimisticUpdateInProgress = useRef(false);
  
  // Track real-time subscription health for adaptive polling
  const realtimeHealthyRef = useRef(false);
  
  // Pending top-meals refresh flag (set when returning from voting before group expands)
  const pendingTopMealsRefreshRef = useRef(false);
  
  // Close any open swipeable
  const closeOpenSwipeable = () => {
    if (openSwipeableId.current && swipeableRefs.current[openSwipeableId.current]) {
      swipeableRefs.current[openSwipeableId.current].close();
      openSwipeableId.current = null;
    }
  };
  
  // Create/Join modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const [newGroupCode, setNewGroupCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupPhotoUri, setGroupPhotoUri] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [modalActionLoading, setModalActionLoading] = useState(false);

  // Handle deep link join code
  useEffect(() => {
    if (pendingJoinCode) {
      setJoinCode(pendingJoinCode);
      setShowJoinModal(true);
      onJoinCodeHandled?.();
    }
  }, [pendingJoinCode]);
  
  // Special occasions state
  const [specialOccasions, setSpecialOccasions] = useState([]);
  const [occasionsLoading, setOccasionsLoading] = useState(false);
  
  // Expanded occasion state (for special occasions)
  const [expandedOccasionId, setExpandedOccasionId] = useState(null);
  const [occasionMembers, setOccasionMembers] = useState([]);
  const [occasionResponses, setOccasionResponses] = useState({});
  const [occasionLoading, setOccasionLoading] = useState(false);
  const [myOccasionResponse, setMyOccasionResponse] = useState(null);
  const [occasionActionLoading, setOccasionActionLoading] = useState(false);
  
  // Occasion top meals state
  const [occasionTopMeals, setOccasionTopMeals] = useState([]);
  const [occasionTopMealsLoading, setOccasionTopMealsLoading] = useState(false);
  
  // Create occasion modal state
  const [showCreateOccasionModal, setShowCreateOccasionModal] = useState(false);
  const [newOccasionType, setNewOccasionType] = useState('celebration');
  const [newOccasionMessage, setNewOccasionMessage] = useState('');
  const [newOccasionDate, setNewOccasionDate] = useState('');
  const [newOccasionTime, setNewOccasionTime] = useState('18:00');
  const [createOccasionLoading, setCreateOccasionLoading] = useState(false);
  const [occasionSelectedGroups, setOccasionSelectedGroups] = useState([]);
  const [occasionStep, setOccasionStep] = useState(1); // 1=details, 2=date, 3=groups
  
  // Past occasions state (Old Events)
  const [pastOccasions, setPastOccasions] = useState([]);
  const [showPastOccasions, setShowPastOccasions] = useState(false);
  const [pastOccasionsLoading, setPastOccasionsLoading] = useState(false);
  const [expandedPastOccasionId, setExpandedPastOccasionId] = useState(null);
  const [pastOccasionParticipants, setPastOccasionParticipants] = useState({});
  const [pastParticipantsLoading, setPastParticipantsLoading] = useState(false);

  // Track which group set has already had responses prefetched so we can avoid duplicate work.
  const lastResponsePrefetchKey = useRef('');

  const buildGroupKey = useCallback((groupList = []) => (
    groupList
      .map(group => group.group_id || group.id)
      .filter(Boolean)
      .sort()
      .join('|')
  ), []);

  const applyCollapsedResponses = useCallback((responses, signature) => {
    // MERGE responses instead of replacing - this preserves optimistic updates
    setAllGroupResponses(prev => {
      // If optimistic update is in progress, don't overwrite current user's responses
      if (optimisticUpdateInProgress.current) {
        // Only update responses for OTHER groups, keep current ones
        const merged = { ...prev };
        Object.entries(responses || {}).forEach(([groupId, response]) => {
          // Only update if we don't have a local value (optimistic update takes priority)
          if (prev[groupId] === undefined) {
            merged[groupId] = response;
          }
        });
        return merged;
      }
      // Normal case: merge new responses with existing
      return { ...prev, ...responses };
    });
    lastResponsePrefetchKey.current = signature || '';
  }, []);

  const fetchResponsesForGroups = useCallback(async (groupList, explicitUserId = null) => {
    const targetUserId = explicitUserId || currentUserId;
    if (!targetUserId || !groupList?.length) {
      return null;
    }

    const responseMap = {};

    for (const group of groupList) {
      const groupId = group.group_id || group.id;
      if (!groupId) continue;

      try {
        const cachedResponses = getCachedDailyResponses(groupId);
        if (cachedResponses) {
          if (cachedResponses[targetUserId]) {
            responseMap[groupId] = cachedResponses[targetUserId];
          }
          continue;
        }

        const freshResponses = await contextLoadDailyResponses(groupId);
        if (freshResponses && freshResponses[targetUserId]) {
          responseMap[groupId] = freshResponses[targetUserId];
        }
      } catch (error) {
        debugError('COMPONENTS', 'Error loading collapsed responses:', error);
      }
    }

    return responseMap;
  }, [currentUserId, getCachedDailyResponses, contextLoadDailyResponses]);
  
  const occasionLabels = {
    birthday: { label: t('specialOccasion.occasionTypes.birthday'), color: '#E91E63' },
    celebration: { label: t('specialOccasion.occasionTypes.celebration'), color: '#9C27B0' },
    holiday: { label: t('specialOccasion.occasionTypes.holiday'), color: '#F44336' },
    graduation: { label: t('specialOccasion.occasionTypes.graduation'), color: '#2196F3' },
    dinner: { label: t('specialOccasion.dinnerParty'), color: '#FF6B00' },
    bbq: { label: t('specialOccasion.barbecue'), color: '#FF9800' },
    other: { label: t('specialOccasion.specialMoment'), color: '#8B7355' },
  };

  // Get current user on mount and load data from context
  useEffect(() => {
    let isCancelled = false;
    const deferredTasks = [];
    
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        if (!effectiveProfile?.full_name) {
          setAuthUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
        }
      }
      
      // Sync auth status with context (important for cache to work!)
      setGuestStatusRef.current(false);
      
      // Load groups from context (uses cache if available)
      const loadedGroups = await loadGroupsRef.current();
      setLoading(false);
      
      // Signal that groups screen is ready (triggers preloading of other tabs)
      if (onReady) {
        onReady();
      }
      
      // IMMEDIATELY return control - everything else happens in background
      // This ensures the UI renders as fast as possible
      
      if (loadedGroups && loadedGroups.length > 0 && !isCancelled) {
        // Defer ALL heavy work after initial paint
        const handle = InteractionManager.runAfterInteractions(async () => {
          if (isCancelled) return;
          
          // Prefetch today's responses for collapsed cards
          if (fetchResponsesRef.current) {
            try {
              const responses = await fetchResponsesRef.current(loadedGroups, user?.id);
              if (isCancelled) return;
              const signature = buildKeyRef.current?.(loadedGroups || []) || '';
              if (applyResponsesRef.current) {
                applyResponsesRef.current(responses || {}, signature);
              }
            } catch (e) {
              // Ignore errors - responses will load when user expands card
            }
          }
          
          // Preload ALL group data for instant expansion
          if (!isCancelled && preloadAllGroupDataRef.current) {
            preloadAllGroupDataRef.current(loadedGroups);
          }
        });
        deferredTasks.push(handle);
      }

      // Load secondary sections (special occasions + history) after the
      // first render completes so they don't block the main UI.
      if (!isCancelled) {
        const handle = InteractionManager.runAfterInteractions(() => {
          if (isCancelled) {
            return;
          }
          if (FEATURE_SPECIAL_OCCASIONS) {
            loadSpecialOccasionsIndependent();
            loadPastOccasions();
          }
        });
        deferredTasks.push(handle);
      }
    };
    init();

    return () => {
      isCancelled = true;
      deferredTasks.forEach(task => {
        if (task?.cancel) {
          task.cancel();
        }
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount - callbacks are accessed via refs

  // Auto-expand when the user has exactly 1 group
  useEffect(() => {
    if (groups.length === 1 && !expandedGroupId) {
      const g = groups[0];
      const gid = g.group_id || g.id;
      setExpandedGroupId(gid);
      expandedGroupIdRef.current = gid;
      const preloaded = getPreloadedExpansionData(gid);
      if (preloaded) {
        setExpandedMembers(preloaded.members || []);
        const autoMerged = { ...(preloaded.responses || {}) };
        if (currentUserId && allGroupResponses[gid]) {
          autoMerged[currentUserId] = allGroupResponses[gid];
        }
        setExpandedResponses(autoMerged);
        if (currentUserId && autoMerged[currentUserId]) {
          setMyResponse(autoMerged[currentUserId]);
        }
        setExpandedLoading(false);
        if (preloaded.mealRequest?.id) {
          setActiveRequestId(preloaded.mealRequest.id);
          activeRequestIdRef.current = preloaded.mealRequest.id;
          setActiveRecipeType(preloaded.mealRequest.recipe_type || 'voting');
          if (preloaded.topMeals?.length) setTopMeals(preloaded.topMeals);
        }
      }
    }
  }, [groups.length]);

  // Load responses for all groups (for collapsed state display)
  // Update refs when callbacks change
  useEffect(() => {
    fetchResponsesRef.current = fetchResponsesForGroups;
    applyResponsesRef.current = applyCollapsedResponses;
    buildKeyRef.current = buildGroupKey;
  }, [fetchResponsesForGroups, applyCollapsedResponses, buildGroupKey]);
  
  useEffect(() => {
    if (!currentUserId || !groups.length) return;
    const signature = buildKeyRef.current(groups);
    if (signature === lastResponsePrefetchKey.current) {
      return;
    }

    let isActive = true;
    (async () => {
      const responses = await fetchResponsesRef.current(groups);
      if (!isActive) return;
      applyResponsesRef.current(responses || {}, signature);
    })();

    return () => {
      isActive = false;
    };
  }, [currentUserId, groups]); // Reduced dependencies - only re-run when these actually change

  // Real-time subscription for vote updates - updates Top 3 when anyone votes
  // Includes error handling and automatic reconnection (max 3 retries)
  useEffect(() => {
    if (!activeRequestId) {
      realtimeHealthyRef.current = false;
      return;
    }

    let channel = null;
    let debounceTimer = null;
    let retryCount = 0;
    let retryTimer = null;
    let disposed = false;
    const MAX_RETRIES = 3;
    
    // Debounced refresh - short delay for snappy live updates
    const debouncedRefresh = () => {
      if (disposed) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        if (disposed) return;
        try {
          const topMealsData = await loadTopMealsRef.current?.(activeRequestId, true);
          if (!disposed && expandedGroupIdRef.current && activeRequestIdRef.current === activeRequestId) {
            setTopMeals(topMealsData || []);
            log.groups('Top meals refreshed after vote change:', topMealsData?.length || 0);
          }
        } catch (error) {
          debugError('COMPONENTS', 'Error refreshing top meals after vote:', error);
        }
      }, 150); // 150ms for fast live updates
    };
    
    const createSubscription = () => {
      if (disposed) return;
      
      // Clean up previous channel before creating new one
      if (channel) {
        try { supabase.removeChannel(channel); } catch (e) {}
        channel = null;
      }

      try {
        const channelName = `votes-${activeRequestId}-${Date.now()}`;
        log.groups('Setting up real-time vote subscription for request:', activeRequestId, '(attempt', retryCount + 1, ')');

        channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'meal_votes',
              filter: `request_id=eq.${activeRequestId}`
            },
            (payload) => {
              log.groups('Vote change detected via realtime, scheduling refresh...', payload?.eventType);
              debouncedRefresh();
            }
          )
          .subscribe((status) => {
            if (disposed) return;
            
            if (status === 'SUBSCRIBED') {
              realtimeHealthyRef.current = true;
              retryCount = 0; // Reset retry count on success
              log.groups('Realtime vote subscription active');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              realtimeHealthyRef.current = false;
              console.warn(`[REALTIME] Vote subscription ${status} for request ${activeRequestId}`);
              
              // Auto-retry with exponential backoff
              if (retryCount < MAX_RETRIES && !disposed) {
                retryCount++;
                const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 8000); // 1s, 2s, 4s
                console.warn(`[REALTIME] Retrying in ${delay}ms (attempt ${retryCount}/${MAX_RETRIES})`);
                retryTimer = setTimeout(() => {
                  if (!disposed) createSubscription();
                }, delay);
              } else if (retryCount >= MAX_RETRIES) {
                console.warn(`[REALTIME] Max retries reached. Falling back to polling for Top 3 updates.`);
              }
            } else if (status === 'CLOSED') {
              realtimeHealthyRef.current = false;
            }
          });
      } catch (error) {
        realtimeHealthyRef.current = false;
        console.warn('[REALTIME] Could not set up vote subscription:', error);
      }
    };

    createSubscription();

    // Initial refresh when subscription is set up
    loadTopMealsRef.current?.(activeRequestId, true).then(topMealsData => {
      if (!disposed) setTopMeals(topMealsData || []);
    }).catch(() => {});

    return () => {
      disposed = true;
      realtimeHealthyRef.current = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      if (retryTimer) clearTimeout(retryTimer);
      if (channel) {
        log.groups('Cleaning up vote subscription');
        try { supabase.removeChannel(channel); } catch (e) {}
      }
    };
  }, [activeRequestId]);

  // Keep activeRequestIdRef in sync with state
  useEffect(() => {
    activeRequestIdRef.current = activeRequestId;
  }, [activeRequestId]);

  // Polling for Top 3 - checks every 1s when expanded for instant vote updates
  const POLL_INTERVAL_MS = 1000;
  useEffect(() => {
    if (!activeRequestId || !expandedGroupId) {
      return;
    }
    
    // Capture current values for this effect instance
    const capturedGroupId = expandedGroupId;
    const capturedRequestId = activeRequestId;
    let pollTimer = null;
    let disposed = false;
    
    const doPoll = async () => {
      if (disposed) return;
      if (expandedGroupIdRef.current !== capturedGroupId || 
          activeRequestIdRef.current !== capturedRequestId) {
        return;
      }
      try {
        const topMealsData = await loadTopMealsRef.current?.(capturedRequestId, true);
        if (!disposed && expandedGroupIdRef.current === capturedGroupId && 
            activeRequestIdRef.current === capturedRequestId) {
          setTopMeals(topMealsData || []);
        }
      } catch (error) {
        log.groups('Poll error:', error);
      }
    };
    
    const schedulePoll = () => {
      if (disposed) return;
      pollTimer = setTimeout(() => {
        doPoll().finally(() => {
          if (!disposed) schedulePoll();
        });
      }, POLL_INTERVAL_MS);
    };
    
    // Immediate poll on expand, then start adaptive schedule
    doPoll().finally(() => {
      if (!disposed) schedulePoll();
    });
    
    return () => {
      disposed = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [activeRequestId, expandedGroupId]);

  // When returning from voting - refresh Top 3 immediately
  // If activeRequestId is null (e.g. because a new meal request was created during voting
  // but the local state wasn't updated), actively fetch the active request first.
  const lastRefreshedFromVotingRef = useRef(null);
  useEffect(() => {
    const refreshRequested = route?.params?.refreshTopMeals || (pendingGroupReopen?.groupId && pendingGroupReopen.groupId === expandedGroupId);
    if (!refreshRequested) {
      if (pendingGroupReopen?.groupId && onPendingGroupReopenCleared) {
        onPendingGroupReopenCleared();
      }
      return;
    }
    
    // Avoid duplicate refreshes within 2 seconds
    const now = Date.now();
    if (lastRefreshedFromVotingRef.current && (now - lastRefreshedFromVotingRef.current) < 2000) {
      if (onPendingGroupReopenCleared) onPendingGroupReopenCleared();
      return;
    }
    lastRefreshedFromVotingRef.current = now;
    
    const groupId = pendingGroupReopen?.groupId || expandedGroupId;
    
    // If activeRequestId is null, fetch it from the database for this group
    // This handles the case where handleStartVoting created a new request
    // but the state wasn't preserved (e.g. stale preloaded data)
    const doRefresh = async () => {
      let reqId = activeRequestId;
      
      if (!reqId && groupId) {
        try {
          const requestResult = await contextLoadActiveMealRequest(groupId);
          if (requestResult?.hasActiveRequest && requestResult?.request?.id) {
            reqId = requestResult.request.id;
            setActiveRequestId(reqId);
            activeRequestIdRef.current = reqId;
            setActiveRecipeType('voting');
          }
        } catch (e) {
          debugError('COMPONENTS', 'Error fetching active request on voting return:', e);
        }
      }
      
      if (!reqId) {
        pendingTopMealsRefreshRef.current = true;
        return;
      }
      
      pendingTopMealsRefreshRef.current = false;
      invalidateCache(['topMeals']);
      try {
        const topMealsData = await loadTopMealsRef.current?.(reqId, true);
        setTopMeals(topMealsData || []);
      } catch (err) {
        debugError('COMPONENTS', 'Error refreshing top meals after voting:', err);
      }
    };
    
    doRefresh();
    
    if (onPendingGroupReopenCleared) {
      onPendingGroupReopenCleared();
    }
  }, [route?.params?.refreshTopMeals, pendingGroupReopen, expandedGroupId, activeRequestId, invalidateCache, onPendingGroupReopenCleared, contextLoadActiveMealRequest]);

  // Consume pending top-meals refresh when activeRequestId becomes available
  useEffect(() => {
    if (activeRequestId && pendingTopMealsRefreshRef.current) {
      pendingTopMealsRefreshRef.current = false;
      invalidateCache(['topMeals']);
      loadTopMealsRef.current?.(activeRequestId, true)
        .then(topMealsData => {
          setTopMeals(topMealsData || []);
        })
        .catch(err => debugError('COMPONENTS', 'Error in deferred top meals refresh:', err));
      if (onPendingGroupReopenCleared) {
        onPendingGroupReopenCleared();
      }
    }
  }, [activeRequestId, invalidateCache, onPendingGroupReopenCleared]);

  // Refresh top meals and special occasions when screen regains focus (e.g. back from VotingScreen)
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      chatOpenGroupRef.current = null;
      
      if (FEATURE_SPECIAL_OCCASIONS) {
        loadSpecialOccasionsIndependent().catch(error => {
          if (!isActive) return;
          debugError('COMPONENTS', 'Error refreshing occasions on focus:', error);
        });
      }
      
      // Refresh group Top 3 when returning from group voting (or any screen)
      // With goBack() from VotingScreen, activeRequestId and expandedGroupId are preserved.
      const refreshGroupTopMeals = async () => {
        let reqId = activeRequestId;
        
        // If no activeRequestId but a group is expanded, try to fetch the active request
        // This handles edge cases where state was lost
        if (!reqId && expandedGroupId) {
          try {
            const requestResult = await contextLoadActiveMealRequest(expandedGroupId);
            if (!isActive) return;
            if (requestResult?.hasActiveRequest && requestResult?.request?.id) {
              reqId = requestResult.request.id;
              setActiveRequestId(reqId);
              activeRequestIdRef.current = reqId;
              setActiveRecipeType('voting');
            }
          } catch (e) {
            if (!isActive) return;
          }
        }
        
        if (reqId) {
          try {
            // Invalidate cache first to ensure completely fresh data
            invalidateCache(['topMeals']);
            const topMealsData = await loadTopMealsRef.current?.(reqId, true);
            if (!isActive) return;
            setTopMeals(topMealsData || []);
          } catch (error) {
            if (!isActive) return;
            debugError('COMPONENTS', 'Error refreshing top meals on focus:', error);
          }
        }
      };
      
      refreshGroupTopMeals();
      
      // Refresh occasion Top 3 when returning from occasion voting
      if (expandedOccasionId) {
        getOccasionTopMeals(expandedOccasionId)
          .then(result => {
            if (!isActive || !result?.success) return;
            setOccasionTopMeals(result.topMeals || []);
          })
          .catch(() => {});
      }

      return () => {
        isActive = false;
      };
    }, [activeRequestId, expandedOccasionId, expandedGroupId, contextLoadActiveMealRequest, invalidateCache])
  );

  // Global real-time subscription for daily responses across ALL groups
  // Updates both expanded and collapsed cards instantly
  const responseChannelRef = useRef(null);
  const userGroupIdsRef = useRef(new Set());
  useEffect(() => {
    userGroupIdsRef.current = new Set(groups.map(g => g.group_id || g.id).filter(Boolean));
  }, [groups]);
  useEffect(() => {
    if (!currentUserId || !groups.length) return;

    let retryTimer = null;
    const subscribe = () => {
      if (responseChannelRef.current) {
        try { supabase.removeChannel(responseChannelRef.current); } catch (_) {}
      }
      const channel = supabase
        .channel(`responses-global-${currentUserId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'daily_responses' },
          (payload) => {
            const groupId = payload.new?.group_id || payload.old?.group_id;
            if (!groupId) return;

            // Ignore events for groups the user doesn't belong to
            if (!userGroupIdsRef.current.has(groupId)) return;

            // Ignore events for other dates (e.g. stale rows from yesterday)
            const today = new Date().toISOString().split('T')[0];
            const eventDate = payload.new?.response_date || payload.old?.response_date;
            if (eventDate && eventDate !== today) return;

            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const r = payload.new;
              if (!r?.user_id) return;
              const isMe = r.user_id === currentUserId;

              if (isMe && optimisticUpdateInProgress.current) {
                optimisticUpdateInProgress.current = false;
                return;
              }

              // CRITICAL: Always update the AppStateContext cache so collapsed
              // cards (which read from getCachedDailyResponses) see the update.
              // This applies to ALL users, not just the current one.
              updateCachedResponse(groupId, r.user_id, r.response);

              // Always update collapsed card attendance data
              if (isMe) {
                setAllGroupResponses(prev => ({ ...prev, [groupId]: r.response }));
              }

              // Update expanded card if this group is currently expanded
              if (expandedGroupIdRef.current === groupId) {
                setExpandedResponses(prev => ({ ...prev, [r.user_id]: r.response }));
                if (isMe) setMyResponse(r.response);
              }
            } else if (payload.eventType === 'DELETE') {
              const r = payload.old;
              if (!r?.user_id) return;
              const isMe = r.user_id === currentUserId;

              if (isMe && optimisticUpdateInProgress.current) {
                optimisticUpdateInProgress.current = false;
                return;
              }

              if (isMe) {
                setAllGroupResponses(prev => { const n = { ...prev }; delete n[groupId]; return n; });
              }

              // Clear the context cache so stale data doesn't reappear on next expand
              updateCachedResponse(groupId, r.user_id, null);

              if (expandedGroupIdRef.current === groupId) {
                setExpandedResponses(prev => { const n = { ...prev }; delete n[r.user_id]; return n; });
                if (isMe) setMyResponse(null);
              }
            }
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            retryTimer = setTimeout(subscribe, 3000);
          }
        });
      responseChannelRef.current = channel;
    };

    subscribe();

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      if (responseChannelRef.current) {
        try { supabase.removeChannel(responseChannelRef.current); } catch (_) {}
        responseChannelRef.current = null;
      }
    };
  }, [currentUserId, groups.length]);

  // Real-time subscription for group chat unread indicators
  const chatUnreadChannelRef = useRef(null);
  useEffect(() => {
    if (!currentUserId || !groups.length) return;

    let retryTimer = null;
    const subscribe = () => {
      if (chatUnreadChannelRef.current) {
        try { supabase.removeChannel(chatUnreadChannelRef.current); } catch (_) {}
      }
      const channel = supabase
        .channel(`chat-unread-${currentUserId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'group_messages' },
          (payload) => {
            const msg = payload.new;
            if (!msg) return;
            // Skip own messages, but NOT Happie team messages sent as you
            if (msg.user_id === currentUserId && !msg.message?.startsWith('Happie team: ')) return;
            // Ignore messages for groups the user doesn't belong to
            if (!userGroupIdsRef.current.has(msg.group_id)) return;
            if (chatOpenGroupRef.current === msg.group_id) return;
            setUnreadGroups(prev => ({ ...prev, [msg.group_id]: true }));
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            retryTimer = setTimeout(subscribe, 3000);
          }
        });
      chatUnreadChannelRef.current = channel;
    };

    subscribe();

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      if (chatUnreadChannelRef.current) {
        try { supabase.removeChannel(chatUnreadChannelRef.current); } catch (_) {}
        chatUnreadChannelRef.current = null;
      }
    };
  }, [currentUserId, groups.length]);

  // Real-time subscription for the `groups` table itself — picks up live
  // changes to photo_url, name, is_main_group, is_active for any group the
  // current user belongs to. Without this, photos only refresh on app reload.
  const groupsChannelRef = useRef(null);
  useEffect(() => {
    if (!currentUserId || !groups.length) return;

    let retryTimer = null;
    const subscribe = () => {
      if (groupsChannelRef.current) {
        try { supabase.removeChannel(groupsChannelRef.current); } catch (_) {}
      }
      const channel = supabase
        .channel(`groups-watch-${currentUserId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'groups' },
          (payload) => {
            const row = payload.new || payload.old;
            if (!row?.id) return;
            // Only care about groups the user belongs to
            if (!userGroupIdsRef.current.has(row.id)) return;

            if (payload.eventType === 'DELETE' || payload.new?.is_active === false) {
              // Group deleted or deactivated — refresh full list so it disappears
              loadGroupsRef.current?.(true).catch(() => {});
              return;
            }

            // UPDATE / INSERT — patch the in-memory group with new fields
            updateGroup({
              group_id: row.id,
              id: row.id,
              name: payload.new?.name,
              group_name: payload.new?.name,
              description: payload.new?.description,
              photo_url: payload.new?.photo_url,
              is_main_group: payload.new?.is_main_group,
              is_active: payload.new?.is_active,
            });
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            retryTimer = setTimeout(subscribe, 3000);
          }
        });
      groupsChannelRef.current = channel;
    };

    subscribe();

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      if (groupsChannelRef.current) {
        try { supabase.removeChannel(groupsChannelRef.current); } catch (_) {}
        groupsChannelRef.current = null;
      }
    };
  }, [currentUserId, groups.length, updateGroup]);

  // Real-time subscription for group_members — picks up joins/leaves so
  // member counts and member lists stay live. Invalidates caches for the
  // affected group and triggers a full groups reload to refresh counts.
  const groupMembersChannelRef = useRef(null);
  useEffect(() => {
    if (!currentUserId || !groups.length) return;

    let retryTimer = null;
    let refreshDebounceTimer = null;

    const debouncedRefresh = (groupId) => {
      if (refreshDebounceTimer) clearTimeout(refreshDebounceTimer);
      refreshDebounceTimer = setTimeout(() => {
        try {
          if (groupId) invalidateGroupCache(groupId);
          loadGroupsRef.current?.(true).catch(() => {});
        } catch (_) {}
      }, 300);
    };

    const subscribe = () => {
      if (groupMembersChannelRef.current) {
        try { supabase.removeChannel(groupMembersChannelRef.current); } catch (_) {}
      }
      const channel = supabase
        .channel(`group-members-watch-${currentUserId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'group_members' },
          (payload) => {
            const row = payload.new || payload.old;
            const gid = row?.group_id;
            if (!gid) return;
            // Only react to events for groups the user belongs to
            if (!userGroupIdsRef.current.has(gid)) return;
            debouncedRefresh(gid);
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            retryTimer = setTimeout(subscribe, 3000);
          }
        });
      groupMembersChannelRef.current = channel;
    };

    subscribe();

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      if (refreshDebounceTimer) clearTimeout(refreshDebounceTimer);
      if (groupMembersChannelRef.current) {
        try { supabase.removeChannel(groupMembersChannelRef.current); } catch (_) {}
        groupMembersChannelRef.current = null;
      }
    };
  }, [currentUserId, groups.length, invalidateGroupCache]);

  // Real-time subscription for `meal_requests` — picks up when voting starts,
  // is replaced, or completes in any of the user's groups. Without this,
  // other members don't see "voting in progress" until they reload the app.
  const mealRequestsChannelRef = useRef(null);
  useEffect(() => {
    if (!currentUserId || !groups.length) return;

    let retryTimer = null;
    let refreshDebounceTimer = null;

    const debouncedRefresh = (groupId) => {
      if (refreshDebounceTimer) clearTimeout(refreshDebounceTimer);
      refreshDebounceTimer = setTimeout(() => {
        try {
          if (groupId) invalidateGroupCache(groupId);
          // Fetch fresh active meal request for the affected group so the
          // "voting in progress" state appears/disappears immediately.
          contextLoadActiveMealRequest?.(groupId, true).catch(() => {});
        } catch (_) {}
      }, 200);
    };

    const subscribe = () => {
      if (mealRequestsChannelRef.current) {
        try { supabase.removeChannel(mealRequestsChannelRef.current); } catch (_) {}
      }
      const channel = supabase
        .channel(`meal-requests-watch-${currentUserId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'meal_requests' },
          (payload) => {
            const row = payload.new || payload.old;
            const gid = row?.group_id;
            if (!gid) return;
            if (!userGroupIdsRef.current.has(gid)) return;
            debouncedRefresh(gid);
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            retryTimer = setTimeout(subscribe, 3000);
          }
        });
      mealRequestsChannelRef.current = channel;
    };

    subscribe();

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      if (refreshDebounceTimer) clearTimeout(refreshDebounceTimer);
      if (mealRequestsChannelRef.current) {
        try { supabase.removeChannel(mealRequestsChannelRef.current); } catch (_) {}
        mealRequestsChannelRef.current = null;
      }
    };
  }, [currentUserId, groups.length, invalidateGroupCache, contextLoadActiveMealRequest]);

  // Real-time subscription for new special occasions (participant invites or own creations)
  useEffect(() => {
    if (!currentUserId) return;
    if (!FEATURE_SPECIAL_OCCASIONS) return;
    
    let occasionChannel = null;
    let participantChannel = null;
    
    try {
      log.occasions('Setting up real-time subscription for new special occasions');
      
      // Subscribe to new occasions I create
      occasionChannel = supabase
        .channel(`occasions-created-${currentUserId}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'special_occasions',
            filter: `creator_id=eq.${currentUserId}`
          },
          (payload) => {
            log.occasions('New occasion created via realtime:', payload?.new?.id);
            // Reload occasions to get the new one with all enriched data
            loadSpecialOccasionsIndependent();
          }
        )
        .subscribe((status) => {
          log.occasions('Occasions created subscription status:', status);
        });
        
      // Subscribe to new invitations to occasions (participant records)
      participantChannel = supabase
        .channel(`occasions-invited-${currentUserId}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'special_occasion_participants',
            filter: `user_id=eq.${currentUserId}`
          },
          (payload) => {
            log.occasions('New occasion invitation via realtime:', payload?.new?.occasion_id);
            // Reload occasions to get the new invitation
            loadSpecialOccasionsIndependent();
          }
        )
        .subscribe((status) => {
          log.occasions('Occasions invited subscription status:', status);
        });
        
    } catch (error) {
      log.occasions('Could not set up occasions realtime subscription:', error);
    }

    return () => {
      if (occasionChannel) {
        try {
          supabase.removeChannel(occasionChannel);
        } catch (e) {}
      }
      if (participantChannel) {
        try {
          supabase.removeChannel(participantChannel);
        } catch (e) {}
      }
    };
  }, [currentUserId]);

  // Real-time subscription for MY responses across all occasions (works even when collapsed)
  // This updates the myResponse field in the occasions list when I respond from another device
  useEffect(() => {
    if (!currentUserId) return;
    
    let myResponseChannel = null;
    
    try {
      log.occasions('Setting up real-time subscription for my occasion responses');
      
      myResponseChannel = supabase
        .channel(`my-occasion-responses-${currentUserId}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'special_occasion_responses',
            filter: `user_id=eq.${currentUserId}`
          },
          (payload) => {
            log.occasions('My occasion response changed via realtime:', payload?.eventType, payload?.new?.occasion_id);
            
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const newResponse = payload.new;
              if (newResponse && newResponse.occasion_id) {
                // Map 'accepted'/'declined' to 'yes'/'no' for UI
                const responseValue = newResponse.response === 'accepted' ? 'yes' :
                                      newResponse.response === 'declined' ? 'no' : null;
                
                // Update the occasions list with my new response
                setSpecialOccasions(prev => prev.map(occ => 
                  occ.id === newResponse.occasion_id 
                    ? { ...occ, myResponse: responseValue }
                    : occ
                ));
                
                // Also update past occasions if applicable
                setPastOccasions(prev => prev.map(occ => 
                  occ.id === newResponse.occasion_id 
                    ? { ...occ, myResponse: responseValue }
                    : occ
                ));
              }
            } else if (payload.eventType === 'DELETE') {
              const oldResponse = payload.old;
              if (oldResponse && oldResponse.occasion_id) {
                // Response was deleted, clear myResponse
                setSpecialOccasions(prev => prev.map(occ => 
                  occ.id === oldResponse.occasion_id 
                    ? { ...occ, myResponse: null }
                    : occ
                ));
                setPastOccasions(prev => prev.map(occ => 
                  occ.id === oldResponse.occasion_id 
                    ? { ...occ, myResponse: null }
                    : occ
                ));
              }
            }
          }
        )
        .subscribe((status) => {
          log.occasions('My occasion responses subscription status:', status);
        });
        
    } catch (error) {
      log.occasions('Could not set up my occasion responses realtime subscription:', error);
    }

    return () => {
      if (myResponseChannel) {
        try {
          supabase.removeChannel(myResponseChannel);
        } catch (e) {}
      }
    };
  }, [currentUserId]);

  // Real-time subscription for special occasion responses (when an occasion is expanded)
  useEffect(() => {
    if (!expandedOccasionId) return;
    
    let channel = null;
    
    try {
      log.occasions('Setting up real-time occasion_responses subscription for occasion:', expandedOccasionId);
      
      channel = supabase
        .channel(`occasion-responses-${expandedOccasionId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'special_occasion_responses',
          filter: `occasion_id=eq.${expandedOccasionId}`
        },
        async (payload) => {
          log.occasions('Occasion response change detected via realtime:', payload?.eventType);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newResponse = payload.new;
            if (newResponse && newResponse.user_id) {
              // Map response to yes/no (column is 'response', not 'response_status')
              const responseValue = newResponse.response === 'accepted' ? 'yes' :
                                    newResponse.response === 'declined' ? 'no' : null;
              
              setOccasionResponses(prev => ({
                ...prev,
                [newResponse.user_id]: responseValue
              }));
              
              // Update my response if it's the current user
              if (newResponse.user_id === currentUserId) {
                setMyOccasionResponse(responseValue);
                
                // Also update the occasion in the list
                setSpecialOccasions(prev => prev.map(occ => 
                  occ.id === expandedOccasionId 
                    ? { ...occ, myResponse: responseValue }
                    : occ
                ));
              }
            }
          } else if (payload.eventType === 'DELETE') {
            const oldResponse = payload.old;
            if (oldResponse && oldResponse.user_id) {
              setOccasionResponses(prev => {
                const newResponses = { ...prev };
                delete newResponses[oldResponse.user_id];
                return newResponses;
              });
              
              if (oldResponse.user_id === currentUserId) {
                setMyOccasionResponse(null);
                setSpecialOccasions(prev => prev.map(occ => 
                  occ.id === expandedOccasionId 
                    ? { ...occ, myResponse: null }
                    : occ
                ));
              }
            }
          }
        }
      )
      .subscribe((status) => {
        log.occasions('Occasion responses subscription status:', status);
      });
    } catch (error) {
      log.occasions('Could not set up occasion realtime subscription:', error);
    }

    return () => {
      if (channel) {
        log.occasions('Cleaning up occasion responses subscription');
        try {
          supabase.removeChannel(channel);
        } catch (e) {}
      }
    };
  }, [expandedOccasionId, currentUserId]);

  // Load special occasions from INDEPENDENT special_occasions table (not tied to groups)
  const loadSpecialOccasionsIndependent = async () => {
    if (!FEATURE_SPECIAL_OCCASIONS) return;
    setOccasionsLoading(true);
    try {
      const result = await getMySpecialOccasions();

      if (!result.success) {
        setSpecialOccasions([]);
        return;
      }

      const occasions = result.occasions || [];
      
      if (occasions.length > 0) {
        // Map to expected format for UI
        const enrichedOccasions = occasions.map(occasion => ({
          id: occasion.id,
          occasion_type: occasion.occasion_type,
          occasion_message: occasion.occasion_message,
          date: occasion.occasion_date,
          time: occasion.occasion_time,
          deadline: occasion.deadline,
          status: occasion.status,
          creator_id: occasion.creator_id,
          creatorName: occasion.creator_name || 'Someone',
          isCreator: occasion.is_creator || false,
          myResponse: occasion.my_response === 'accepted' ? 'yes' : 
                      occasion.my_response === 'declined' ? 'no' : null,
          // No group_id - independent from groups!
        }));

        setSpecialOccasions(enrichedOccasions);
        log.occasions(`Loaded ${enrichedOccasions.length} independent special occasions`);
      } else {
        setSpecialOccasions([]);
      }
    } catch (error) {
      debugError('COMPONENTS', 'Error loading special occasions:', error);
      setSpecialOccasions([]);
    } finally {
      setOccasionsLoading(false);
    }
  };

  // Handle refresh - force reload from context
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      invalidateCache(['dailyResponses']);
      const loadedGroups = await contextLoadGroups(true); // force = true
      const signature = buildGroupKey(loadedGroups || []);
      const responses = await fetchResponsesForGroups(loadedGroups);
      applyCollapsedResponses(responses || {}, signature);

      if (loadedGroups && loadedGroups.length > 0) {
        InteractionManager.runAfterInteractions(() => {
          preloadAllGroupData(loadedGroups);
        });
      }

      // Load occasions independently (no group dependency)
      if (FEATURE_SPECIAL_OCCASIONS) {
        await loadSpecialOccasionsIndependent();
      }
    } finally {
      setRefreshing(false);
    }
  };
  
  // Shorthand for loading occasions
  const loadSpecialOccasions = () => loadSpecialOccasionsIndependent();

  // Load past/old occasions
  const loadPastOccasions = async () => {
    if (!FEATURE_SPECIAL_OCCASIONS) return;
    if (pastOccasions.length > 0) return; // Already loaded
    
    setPastOccasionsLoading(true);
    try {
      const result = await getPastOccasions();
      
      if (result.success) {
        const occasions = result.occasions || [];
        const enrichedOccasions = occasions.map(occasion => ({
          id: occasion.id,
          occasion_type: occasion.occasion_type,
          occasion_message: occasion.occasion_message,
          date: occasion.occasion_date,
          time: occasion.occasion_time,
          status: occasion.status,
          creator_id: occasion.creator_id,
          creatorName: occasion.creator_name || 'Someone',
          isCreator: occasion.is_creator || false,
          participantCount: occasion.participant_count || 0,
          acceptedCount: occasion.accepted_count || 0,
          myResponse: occasion.my_response === 'accepted' ? 'yes' :
                      occasion.my_response === 'declined' ? 'no' : null,
        }));
        setPastOccasions(enrichedOccasions);
        log.occasions(`Loaded ${enrichedOccasions.length} past occasions`);
      }
    } catch (error) {
      debugError('COMPONENTS', 'Error loading past occasions:', error);
    } finally {
      setPastOccasionsLoading(false);
    }
  };

  // Toggle past occasions visibility
  const handleTogglePastOccasions = () => {
    lightHaptic();
    const newValue = !showPastOccasions;
    setShowPastOccasions(newValue);
    if (newValue && pastOccasions.length === 0) {
      loadPastOccasions();
    }
  };

  // Toggle a specific past occasion to show participants
  const handleTogglePastOccasion = async (occasionId) => {
    lightHaptic();
    
    if (expandedPastOccasionId === occasionId) {
      // Collapse
      setExpandedPastOccasionId(null);
      return;
    }
    
    // Expand and load participants if not already loaded
    setExpandedPastOccasionId(occasionId);
    
    if (!pastOccasionParticipants[occasionId]) {
      setPastParticipantsLoading(true);
      try {
        const result = await getOccasionParticipants(occasionId);
        if (result.success) {
          setPastOccasionParticipants(prev => ({
            ...prev,
            [occasionId]: result.participants || []
          }));
        }
      } catch (error) {
        console.error('Error loading past occasion participants:', error);
      } finally {
        setPastParticipantsLoading(false);
      }
    }
  };

  // Load responses for a group (uses context cache)
  const loadGroupResponses = async (groupId) => {
    // Try to get from context cache first
    const cached = getCachedDailyResponses(groupId);
    if (cached) {
      log.component('Using cached responses for group:', groupId);
      return cached;
    }
    
    // Load from context (will cache automatically)
    return await contextLoadDailyResponses(groupId);
  };

  // Load data for a group (members, responses, top meals)
  const loadGroupData = async (groupId) => {
    closeOpenSwipeable();

    // Load shopping status for this group
    setActiveShopper(null);
    getActiveShopperToday(groupId).then(result => {
      if (result.success) setActiveShopper(result.shopper);
    }).catch(() => {});

    // Collapse any expanded occasion card first
    if (expandedOccasionId) {
      setExpandedOccasionId(null);
      setOccasionMembers([]);
      setOccasionResponses({});
      setMyOccasionResponse(null);
      setOccasionTopMeals([]);
    }

    {
      // Switch to new group - use preloaded data for INSTANT display
      // CRITICAL: Clear old group's data FIRST before setting new group
      // This prevents flash of wrong Top 3 when switching directly between groups
      setTopMeals([]);
      setActiveRequestId(null);
      setActiveRecipeType(null);

      setSelectedGroupId(groupId);
      expandedGroupIdRef.current = groupId; // Keep ref in sync
      
      // Try to get preloaded expansion data first (batch loaded on app start)
      const preloadedData = getPreloadedExpansionData(groupId);
      
      if (preloadedData) {
        // INSTANT: Use preloaded data immediately - no loading needed!
        log.groups('Using preloaded data for instant expansion:', groupId);
        setExpandedMembers(preloadedData.members || []);
        setExpandedLoading(false);

        // Merge preloaded responses with any optimistic response the user already set
        const mergedResponses = { ...(preloadedData.responses || {}) };
        if (currentUserId && allGroupResponses[groupId]) {
          mergedResponses[currentUserId] = allGroupResponses[groupId];
        }
        setExpandedResponses(mergedResponses);

        // Set my response
        if (currentUserId && mergedResponses[currentUserId]) {
          setMyResponse(mergedResponses[currentUserId]);
          optimisticUpdateInProgress.current = true;
          setTimeout(() => { optimisticUpdateInProgress.current = false; }, 1000);
        } else {
          setMyResponse(null);
        }
        
        // Set top meals and recipe type
        if (preloadedData.mealRequest?.id) {
          setActiveRequestId(preloadedData.mealRequest.id);
          activeRequestIdRef.current = preloadedData.mealRequest.id;
          setTopMeals(preloadedData.topMeals || []);
          setActiveRecipeType(preloadedData.recipeType || 'voting');
          setTopMealsLoading(false);
          // Remember for future collapse/expand cycles
          knownActiveRequests.current[groupId] = { requestId: preloadedData.mealRequest.id, recipeType: preloadedData.recipeType || 'voting' };
        } else {
          // Check if we know an active request from a previous expansion or voting session
          const known = knownActiveRequests.current[groupId];
          if (known) {
            setActiveRequestId(known.requestId);
            activeRequestIdRef.current = known.requestId;
            setActiveRecipeType(known.recipeType);
            setTopMealsLoading(true);
            // Load top meals for the known request immediately
            contextLoadTopMeals(known.requestId, true).then(topMealsData => {
              if (expandedGroupIdRef.current === groupId) {
                setTopMeals(topMealsData || []);
                setTopMealsLoading(false);
              }
            }).catch(() => setTopMealsLoading(false));
          } else {
            setTopMeals([]);
            setActiveRequestId(null);
            setActiveRecipeType(null);
            setTopMealsLoading(false);
          }
        }
        
        // Still do a background refresh to ensure data is fresh
        // Capture the groupId to check for stale updates
        const refreshGroupId = groupId;
        (async () => {
          try {
            const [members, responses, requestResult] = await Promise.all([
              contextLoadGroupMembers(refreshGroupId),
              contextLoadDailyResponses(refreshGroupId, true), // force=true for fresh data on expand
              contextLoadActiveMealRequest(refreshGroupId, true) // force=true to bypass stale cache
            ]);
            
            // CRITICAL: Check if we're still on the same group before updating
            // Uses ref to get current value (not stale closure)
            if (expandedGroupIdRef.current !== refreshGroupId) {
              log.groups('Ignoring stale background refresh for group:', refreshGroupId, 'current:', expandedGroupIdRef.current);
              return;
            }
            
            // Update with fresh data (silently, no loading state)
            if (members) setExpandedMembers(members);
            if (responses) {
              if (optimisticUpdateInProgress.current && currentUserId) {
                // Preserve the user's optimistic response, merge the rest
                setExpandedResponses(prev => ({ ...responses, [currentUserId]: prev[currentUserId] }));
              } else {
                setExpandedResponses(responses);
                if (currentUserId && responses[currentUserId]) {
                  setMyResponse(responses[currentUserId]);
                  setAllGroupResponses(prev => ({ ...prev, [refreshGroupId]: responses[currentUserId] }));
                }
              }
            }
            
            // Determine the active request ID: from RPC result, or from known requests as fallback
            let bgRequestId = null;
            let bgRecipeType = 'voting';
            
            if (requestResult?.hasActiveRequest && requestResult?.request?.id) {
              bgRequestId = requestResult.request.id;
              bgRecipeType = requestResult.request.recipe_type || 'voting';
            } else {
              // RPC returned empty - use known request from this session as fallback
              const known = knownActiveRequests.current[refreshGroupId];
              if (known) {
                bgRequestId = known.requestId;
                bgRecipeType = known.recipeType;
              }
            }
            
            if (bgRequestId) {
              // Double-check we're still on the same group (using ref)
              if (expandedGroupIdRef.current !== refreshGroupId) {
                return;
              }
              setActiveRequestId(bgRequestId);
              activeRequestIdRef.current = bgRequestId;
              setActiveRecipeType(bgRecipeType);
              // Remember for future collapse/expand cycles
              knownActiveRequests.current[refreshGroupId] = { requestId: bgRequestId, recipeType: bgRecipeType };
              
              const topMealsData = await contextLoadTopMeals(bgRequestId, true);
              // Triple-check before setting top meals (using ref)
              if (expandedGroupIdRef.current !== refreshGroupId) {
                return;
              }
              setTopMeals(topMealsData || []);
              setTopMealsLoading(false);
            } else {
            }
          } catch (error) {
            // Ignore - we already have preloaded data
            log.groups('Background refresh failed (using preloaded):', error);
          }
        })();
        
        return; // Exit early - preloaded data handled everything
      }
      
      // Fallback: No preloaded data - use cache or fetch
      setTopMeals([]);
      
      // Try to get cached data first for instant display
      const cachedMembers = getCachedGroupMembers(groupId);
      const cachedResponses = getCachedDailyResponses(groupId);
      const cachedRequest = getCachedActiveMealRequest(groupId);
      
      // Show cached data immediately if available
      if (cachedMembers) {
        setExpandedMembers(cachedMembers);
        setExpandedLoading(false);
      } else {
        setExpandedLoading(true);
      }
      
      // Preserve existing response: use cached data, or the collapsed-card value
      const knownResponse = (cachedResponses && currentUserId && cachedResponses[currentUserId])
        ? cachedResponses[currentUserId]
        : allGroupResponses[groupId] || null;
      setMyResponse(knownResponse);
      
      if (cachedResponses) {
        const merged = { ...cachedResponses };
        if (currentUserId && allGroupResponses[groupId]) {
          merged[currentUserId] = allGroupResponses[groupId];
        }
        setExpandedResponses(merged);
      } else if (currentUserId && allGroupResponses[groupId]) {
        setExpandedResponses({ [currentUserId]: allGroupResponses[groupId] });
      }
      
      if (knownResponse) {
        optimisticUpdateInProgress.current = true;
        setTimeout(() => { optimisticUpdateInProgress.current = false; }, 1000);
      }
      
      if (cachedRequest?.hasActiveRequest && cachedRequest?.request?.id) {
        setActiveRequestId(cachedRequest.request.id);
        activeRequestIdRef.current = cachedRequest.request.id;
        setTopMealsLoading(true);
      } else {
        // Check known requests from this session as fallback
        const known = knownActiveRequests.current[groupId];
        if (known) {
          setActiveRequestId(known.requestId);
          activeRequestIdRef.current = known.requestId;
          setActiveRecipeType(known.recipeType);
          setTopMealsLoading(true);
        }
      }
      
      // Background fetch fresh data
      // Capture groupId to check for stale updates
      const fetchGroupId = groupId;
      try {
        // Load members from context (uses cache if available)
        const members = await contextLoadGroupMembers(fetchGroupId);
        // Check if still on same group before updating
        if (expandedGroupIdRef.current !== fetchGroupId) return;
        setExpandedMembers(members);
        
        // Load responses from context (force=true for fresh data on expand)
        const responses = await contextLoadDailyResponses(fetchGroupId, true);
        if (expandedGroupIdRef.current !== fetchGroupId) return;

        if (optimisticUpdateInProgress.current && currentUserId) {
          // Preserve user's optimistic response, merge the rest
          setExpandedResponses(prev => ({ ...responses, [currentUserId]: prev[currentUserId] }));
        } else {
          setExpandedResponses(responses);
          if (currentUserId && responses[currentUserId]) {
            setMyResponse(responses[currentUserId]);
            setAllGroupResponses(prev => ({ ...prev, [fetchGroupId]: responses[currentUserId] }));
          } else if (currentUserId && allGroupResponses[fetchGroupId]) {
            // Server doesn't have it yet but we do locally — keep it
            setExpandedResponses(prev => ({ ...responses, [currentUserId]: allGroupResponses[fetchGroupId] }));
          } else {
            setMyResponse(null);
          }
        }
        
        // Load active meal request from context
        const requestResult = await contextLoadActiveMealRequest(fetchGroupId, true); // force=true to bypass stale cache
        if (expandedGroupIdRef.current !== fetchGroupId) return;
        
        // Determine active request: from RPC or from known requests as fallback
        let fetchReqId = null;
        let fetchRecipeType = 'voting';
        
        if (requestResult?.hasActiveRequest && requestResult?.request?.id) {
          fetchReqId = requestResult.request.id;
          fetchRecipeType = requestResult.request.recipe_type || 'voting';
        } else {
          const known = knownActiveRequests.current[fetchGroupId];
          if (known) {
            fetchReqId = known.requestId;
            fetchRecipeType = known.recipeType;
          }
        }
        
        if (fetchReqId) {
          setActiveRequestId(fetchReqId);
          activeRequestIdRef.current = fetchReqId;
          setActiveRecipeType(fetchRecipeType);
          knownActiveRequests.current[fetchGroupId] = { requestId: fetchReqId, recipeType: fetchRecipeType };
          
          // Load top 3 meals - force refresh to get latest votes
          const topMealsData = await contextLoadTopMeals(fetchReqId, true);
          if (expandedGroupIdRef.current !== fetchGroupId) return;
          setTopMeals(topMealsData || []);
        }
        
        // Fetch recipe_type from active dinner_request
        const today = getTodayDate();
        const { data: dinnerRequest } = await supabase
          .from('dinner_requests')
          .select('recipe_type')
          .eq('group_id', fetchGroupId)
          .eq('request_date', today)
          .eq('status', 'pending')
          .single();
        
        if (expandedGroupIdRef.current !== fetchGroupId) return;
        if (dinnerRequest?.recipe_type) {
          setActiveRecipeType(dinnerRequest.recipe_type);
        } else {
          setActiveRecipeType(null);
        }
      } catch (error) {
        log.groups('Error loading group data:', error);
      } finally {
        setExpandedLoading(false);
        setTopMealsLoading(false);
      }
    }
  };

  // Auto-load data when selected group changes
  useEffect(() => {
    if (!selectedGroupId || !currentUserId) return;
    loadGroupData(selectedGroupId);
  }, [selectedGroupId, currentUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle response change (accepts groupId to work for collapsed cards too)
  // Uses optimistic updates for instant feedback
  const handleResponseChange = async (groupId, userId, newValue) => {
    if (userId !== currentUserId) return;
    
    // Store previous values for potential rollback
    const previousAllGroupResponse = allGroupResponses[groupId];
    const previousMyResponse = myResponse;
    const previousExpandedResponse = expandedResponses[userId];
    
    lightHaptic(); // Immediate feedback
    
    // Set flag to prevent realtime from overwriting our optimistic update
    optimisticUpdateInProgress.current = true;
    
    // OPTIMISTIC UPDATE - Update UI instantly before server confirms
    setAllGroupResponses(prev => ({ ...prev, [groupId]: newValue }));
    setMyResponse(newValue);
    setExpandedResponses(prev => ({ ...prev, [userId]: newValue }));
    
    // Optimistic update - context cache
    updateCachedResponse(groupId, userId, newValue);
    
    try {
      // Verify group still exists (check local state - no DB in stub mode)
      const groupExists = groups?.some(g => (g.id || g.group_id) === groupId);
      if (!groupExists) {
        await contextLoadGroups(true);
        optimisticUpdateInProgress.current = false;
        toast.error(t('errors.groupDeleted') || 'This group no longer exists');
        return;
      }
      
      const result = await setMyResponseToday(groupId, newValue);
      const error = result.success ? null : new Error(result.error);

      // Realtime callback clears optimisticUpdateInProgress; safety fallback in case realtime is slow
      setTimeout(() => { optimisticUpdateInProgress.current = false; }, 10000);

      if (error) {
        debugError('COMPONENTS', 'Error saving response:', error);
        
        // ROLLBACK - Revert to previous state on error
        setAllGroupResponses(prev => ({
          ...prev,
          [groupId]: previousAllGroupResponse
        }));
        
        if (expandedGroupId === groupId) {
          setMyResponse(previousMyResponse);
          setExpandedResponses(prev => ({
            ...prev,
            [userId]: previousExpandedResponse
          }));
        }
        
        // Revert context cache
        updateCachedResponse(groupId, userId, previousAllGroupResponse || null);
        
        toast.error(t('errors.generic') || 'Could not save response');
      } else {
        // Success feedback
        successHaptic();

        // First-yes notification is handled by Supabase database trigger (notify_first_yes)
      }
    } catch (error) {
      debugError('COMPONENTS', 'Error in response change:', error);
      optimisticUpdateInProgress.current = false;
    }
  };

  // Start voting
  const handleStartVoting = async (group) => {
    mediumHaptic(); // Feedback for starting voting
    const groupId = group.group_id || group.id;
    setActionLoading(true);
    
    try {
      const { getOrCreateDailyMealRequest } = require('../lib/mealRequestService');
      
      const result = await getOrCreateDailyMealRequest(groupId, 10);
      
      if (!result.success) {
        toast.error(result.error || t('errors.generic'));
        return;
      }
      
      const requestId = result.request?.id;
      const mealOptions = result.mealOptions || [];
      
      // CRITICAL: Set activeRequestId BEFORE navigating to VotingScreen.
      // Without this, when the user returns from voting, activeRequestId is null,
      // which means no Top 3 button, no polling, and no real-time updates.
      setActiveRequestId(requestId);
      activeRequestIdRef.current = requestId;
      setActiveRecipeType('voting');
      // Remember this request for the group - survives collapse/expand
      knownActiveRequests.current[groupId] = { requestId, recipeType: 'voting' };
      
      navigation.navigate('VotingScreen', {
        requestId,
        groupName: group.name || group.group_name,
        groupId,
        preloadedMealOptions: mealOptions,
        returnToGroupModal: true
      });
      
    } catch (error) {
      debugError('COMPONENTS', 'Error starting voting:', error);
      toast.error(t('errors.generic'));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle occasion card expansion (INDEPENDENT system - no group dependency)
  const handleOccasionToggle = async (occasion) => {
    lightHaptic();
    log.occasions('[OCCASION] Toggle triggered for:', occasion.id, occasion.occasion_type);
    const occasionId = occasion.id;
    
    // Collapse any expanded group card first
    if (expandedGroupId) {
      setExpandedGroupId(null);
      setExpandedMembers([]);
      setExpandedResponses({});
      setMyResponse(null);
      setTopMeals([]);
    }
    
    if (expandedOccasionId === occasionId) {
      // Collapse
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpandedOccasionId(null);
      setOccasionMembers([]);
      setOccasionResponses({});
      setMyOccasionResponse(null);
      setOccasionTopMeals([]);
    } else {
      // Expand
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpandedOccasionId(occasionId);
      setOccasionLoading(true);
      setMyOccasionResponse(occasion.myResponse || null); // Use pre-loaded response
      setOccasionTopMeals([]);
      setOccasionTopMealsLoading(true);
      
      try {
        // Load participants for this INDEPENDENT occasion
        const participantsResult = await getOccasionParticipants(occasionId);
        
        if (participantsResult.success) {
          // Map participants to member format for UI
          const members = participantsResult.participants.map(p => ({
            user_id: p.user_id,
            profiles: { full_name: p.full_name || 'Unknown' }
          }));
          setOccasionMembers(members);
          
          // Build response map from participants (only accepted/declined, not pending)
          const responseMap = {};
          participantsResult.participants.forEach(p => {
            if (p.response === 'accepted' || p.response === 'declined') {
              responseMap[p.user_id] = p.response === 'accepted' ? 'yes' : 'no';
            }
          });
          setOccasionResponses(responseMap);
          
          // Set my response if not already set
          if (currentUserId && responseMap[currentUserId]) {
            setMyOccasionResponse(responseMap[currentUserId]);
          }
        }
        
        // Load top meals for this occasion using V3 independent system
        const topMealsResult = await getOccasionTopMeals(occasionId);
        
        if (topMealsResult.success && topMealsResult.topMeals?.length > 0) {
          setOccasionTopMeals(topMealsResult.topMeals);
        }
      } catch (error) {
        log.occasions('Error loading occasion data:', error);
      } finally {
        setOccasionLoading(false);
        setOccasionTopMealsLoading(false);
      }
    }
  };
  
  // Handle recipe press (open recipe modal) - memoized for performance
  // Handle shopping toggle
  const handleStartShopping = async () => {
    if (!selectedGroupId || shoppingLoading) return;
    setShoppingLoading(true);
    mediumHaptic();
    try {
      const result = await startShopping(selectedGroupId);
      if (result.success) {
        setActiveShopper(result.shopper);
        successHaptic();
      } else {
        toast.error(result.error || 'Kon niet starten');
      }
    } catch {
      toast.error('Er ging iets mis');
    } finally {
      setShoppingLoading(false);
    }
  };

  const handleStopShopping = async () => {
    if (!selectedGroupId || shoppingLoading) return;
    setShoppingLoading(true);
    lightHaptic();
    try {
      const result = await stopShopping(selectedGroupId);
      if (result.success) {
        setActiveShopper(null);
      } else {
        toast.error(result.error || 'Kon niet stoppen');
      }
    } catch {
      toast.error('Er ging iets mis');
    } finally {
      setShoppingLoading(false);
    }
  };

  const handleRecipePress = useCallback((meal) => {
    lightHaptic();
    log.ui('Recipe pressed:', meal?.meal_data?.name);
    const extras = getRecipeExtras(meal?.meal_data?.name);
    setServingCount(extras.default_servings);
    setSelectedRecipe(meal);
    setShowRecipeModal(true);
  }, []);

  // Open Top 3 modal - always fetches fresh data when opened (all votes in group)
  const handleOpenTop3Group = useCallback(() => {
    if (!activeRequestId) return;
    lightHaptic();
    setTop3ModalLoadFn(() => contextLoadTopMeals(activeRequestId, true));
    setShowTop3Modal(true);
  }, [activeRequestId, contextLoadTopMeals]);


  const handleOpenTop3Occasion = useCallback(() => {
    if (!expandedOccasionId) return;
    lightHaptic();
    setTop3ModalLoadFn(() => getOccasionTopMeals(expandedOccasionId).then(r => r.topMeals || []));
    setShowTop3Modal(true);
  }, [expandedOccasionId]);

  // Handle occasion response change (saves to Supabase special_occasion_responses table)
  // Uses optimistic updates for instant feedback
  const handleOccasionResponseChange = async (occasionId, newValue) => {
    if (!currentUserId || !occasionId) return;
    
    // Store previous values for potential rollback
    const previousMyOccasionResponse = myOccasionResponse;
    const previousOccasionResponse = occasionResponses[currentUserId];
    const previousOccasionInList = specialOccasions.find(o => o.id === occasionId)?.myResponse;
    
    lightHaptic(); // Immediate feedback
    
    // OPTIMISTIC UPDATE - Update UI instantly before server confirms
    setMyOccasionResponse(newValue);
    setOccasionResponses(prev => ({ ...prev, [currentUserId]: newValue }));
    setSpecialOccasions(prev => prev.map(o => 
      o.id === occasionId ? { ...o, myResponse: newValue } : o
    ));
    
    try {
      const responseValue = newValue === null ? null : (newValue === 'yes' ? 'accepted' : 'declined');
      
      const result = await respondToOccasion(occasionId, responseValue);

      if (!result.success) {
        debugError('COMPONENTS', 'Failed to save occasion response:', result.error);
        
        // ROLLBACK - Revert to previous state on error
        setMyOccasionResponse(previousMyOccasionResponse);
        setOccasionResponses(prev => ({
          ...prev,
          [currentUserId]: previousOccasionResponse
        }));
        setSpecialOccasions(prev => prev.map(o => 
          o.id === occasionId ? { ...o, myResponse: previousOccasionInList } : o
        ));
        
        toast.error(t('errors.generic') || 'Could not save response');
      } else {
        // Success feedback
        successHaptic();
      }
    } catch (error) {
      debugError('COMPONENTS', 'Error saving occasion response:', error);
      
      // ROLLBACK on exception
      setMyOccasionResponse(previousMyOccasionResponse);
      setOccasionResponses(prev => ({
        ...prev,
        [currentUserId]: previousOccasionResponse
      }));
      setSpecialOccasions(prev => prev.map(o => 
        o.id === occasionId ? { ...o, myResponse: previousOccasionInList } : o
      ));
      
      toast.error(t('errors.generic') || 'Could not save response');
    }
  };

  // Handle leaving an occasion
  const handleLeaveOccasion = async (occasionId, isPast = false) => {
    if (!currentUserId || !occasionId) return;
    
    Alert.alert(
      t('common.leave'),
      t('common.confirmLeaveOccasion') || 'Are you sure you want to leave this occasion?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.leave'),
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await leaveOccasion(occasionId);
              
              if (result.success) {
                successHaptic();
                // Remove from appropriate list
                if (isPast) {
                  setPastOccasions(prev => prev.filter(o => o.id !== occasionId));
                } else {
                  setSpecialOccasions(prev => prev.filter(o => o.id !== occasionId));
                }
              } else {
                Alert.alert(t('common.error'), result.error || 'Could not leave occasion');
              }
            } catch (error) {
              console.error('Error leaving occasion:', error);
              Alert.alert(t('common.error'), 'Could not leave occasion');
            }
          }
        }
      ]
    );
  };

  // Handle deleting an occasion (creator only)
  const handleDeleteOccasion = async (occasionId, isPast = false) => {
    if (!currentUserId || !occasionId) return;
    
    Alert.alert(
      t('common.delete'),
      t('occasions.confirmDeleteOccasion'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteSpecialOccasion(occasionId);
              
              if (result.success) {
                successHaptic();
                if (isPast) {
                  setPastOccasions(prev => prev.filter(o => o.id !== occasionId));
                } else {
                  setSpecialOccasions(prev => prev.filter(o => o.id !== occasionId));
                }
              } else {
                Alert.alert(t('common.error'), result.error || t('occasions.couldNotDelete'));
              }
            } catch (error) {
              console.error('Error deleting occasion:', error);
              Alert.alert(t('common.error'), t('occasions.couldNotDelete'));
            }
          }
        }
      ]
    );
  };

  // Render right swipe action - Delete for creator, Leave for participants
  const renderOccasionSwipeAction = (occasion, isPast = false) => {
    const isCreator = occasion.isCreator || occasion.creator_id === currentUserId;
    
    if (isCreator) {
      return (
        <View style={styles.swipeLeaveContainer}>
          <TouchableOpacity
            style={[styles.swipeLeaveButton, { backgroundColor: '#D32F2F' }]}
            onPress={() => handleDeleteOccasion(occasion.id, isPast)}
          >
            <Text style={styles.swipeLeaveText} numberOfLines={1} adjustsFontSizeToFit>{t('common.delete')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.swipeLeaveContainer}>
        <TouchableOpacity
          style={styles.swipeLeaveButton}
          onPress={() => handleLeaveOccasion(occasion.id, isPast)}
        >
          <Text style={styles.swipeLeaveText}>{t('common.leave')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Open create occasion modal - reset form
  const handleOpenCreateOccasion = () => {
    lightHaptic();
    setNewOccasionType('celebration');
    setNewOccasionMessage('');
    setNewOccasionDate('');
    setNewOccasionTime('18:00');
    setOccasionSelectedGroups([]);
    setOccasionStep(1);
    setShowCreateOccasionModal(true);
  };

  // Create special occasion
  const handleCreateOccasion = async () => {
    if (!newOccasionDate?.trim()) {
      toast.error(t('occasions.selectDate'));
      return;
    }
    
    setCreateOccasionLoading(true);
    mediumHaptic();
    
    try {
      // Parse time: "18:00" or "18:30" -> "18:00:00"
      let timeStr = (newOccasionTime || '18:00').trim();
      if (timeStr && !timeStr.includes(':')) timeStr = `${timeStr}:00`;
      if (timeStr) {
        const parts = timeStr.split(':');
        if (parts.length === 2) timeStr = `${parts[0]}:${parts[1]}:00`;
      }
      
      const groupIds = occasionSelectedGroups.map(g => g.id || g.group_id).filter(Boolean);
      
      const result = await createSpecialOccasion({
        occasionType: newOccasionType,
        occasionMessage: newOccasionMessage.trim() || null,
        date: newOccasionDate.trim(),
        time: timeStr || null,
      }, [], groupIds);
      
      if (result.success) {
        successHaptic();
        toast.success(t('occasions.createdSuccess'));
        setShowCreateOccasionModal(false);
        await loadSpecialOccasionsIndependent();

        if (result.occasion?.id && result.occasion?.creator_id) {
          const typeLabel = occasionLabels[newOccasionType]?.label || 'Speciaal moment';
          const notifTitle = typeLabel;
          const notifBody = newOccasionMessage?.trim()
            ? `${userName || 'Iemand'} heeft je uitgenodigd: ${newOccasionMessage.trim()}`
            : `${userName || 'Iemand'} heeft je uitgenodigd voor een ${typeLabel.toLowerCase()}`;
          notifyOccasionParticipants(result.occasion.id, result.occasion.creator_id, notifTitle, notifBody)
            .catch(err => console.error('Notification send error:', err));
        }
      } else {
        toast.error(result.error || t('occasions.couldNotCreate'));
      }
    } catch (error) {
      debugError('COMPONENTS', 'Error creating occasion:', error);
      toast.error(t('errors.generic'));
    } finally {
      setCreateOccasionLoading(false);
    }
  };

  // Start voting for occasion (V3 - completely independent, no group connection)
  const handleOccasionVoting = async (occasion) => {
    setOccasionActionLoading(true);
    
    try {
      // Get or create meal options for this occasion (uses occasion_meal_options table)
      let mealOptionsResult = await getOccasionMealOptions(occasion.id);
      
      let mealOptions = [];
      
      if (mealOptionsResult.success && mealOptionsResult.hasMealOptions) {
        mealOptions = mealOptionsResult.mealOptions || [];
      } else {
        // Create new meal options for this occasion
        const createResult = await createOccasionMealOptions(occasion.id, 10);
        
        if (!createResult.success) {
          toast.error(createResult.error || t('errors.couldNotStartVoting'));
          return;
        }
        
        mealOptions = createResult.mealOptions || [];
      }
      
      // Navigate to a special occasion voting screen
      navigation.navigate('VotingScreen', {
        occasionId: occasion.id, // Use occasionId instead of requestId
        occasionName: `${occasionLabels[occasion.occasion_type]?.label || 'Speciaal moment'}`,
        isOccasion: true, // Flag to indicate this is occasion voting
        preloadedMealOptions: mealOptions
      });
      
    } catch (error) {
      debugError('COMPONENTS', 'Error starting occasion voting:', error);
      toast.error(t('errors.couldNotStartVoting'));
    } finally {
      setOccasionActionLoading(false);
    }
  };

  // Create group
  const handlePickGroupPhoto = async () => {
    lightHaptic();
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Toestemming nodig', 'Geef toegang tot je fotobibliotheek.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setGroupPhotoUri(result.assets[0].uri);
      }
    } catch {
      toast.error('Kon foto niet laden');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;

    setModalActionLoading(true);
    try {
      const result = await createGroupInSupabase(groupName.trim());
      if (result.success) {
        // Upload photo if one was picked
        if (groupPhotoUri && result.group?.id) {
          const uploadResult = await uploadGroupPhoto(groupPhotoUri);
          if (uploadResult.success && uploadResult.url) {
            await updateGroupPhoto(result.group.id, uploadResult.url);
          }
        }
        successHaptic();
        setShowCreateModal(false);
        const savedName = groupName.trim();
        setGroupName('');
        setGroupPhotoUri(null);
        toast.success(t('groups.groupCreated'));

        // Load groups immediately so the new group appears instantly
        contextLoadGroups(true).then(() => loadSpecialOccasionsIndependent());

        // Show share prompt popup after modal animation finishes
        const code = result.group?.join_code;
        if (code) {
          InteractionManager.runAfterInteractions(() => {
            setTimeout(() => {
              setNewGroupCode(code);
              setShowSharePrompt(true);
            }, 400);
          });
        }
      } else {
        toast.error(result.error || t('errors.generic'));
      }
    } catch (error) {
      toast.error(t('errors.generic'));
    } finally {
      setModalActionLoading(false);
    }
  };

  // Change group photo (from actions menu)
  const handleChangeGroupPhoto = async (groupId) => {
    lightHaptic();
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Toestemming nodig', 'Geef toegang tot je fotobibliotheek.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        const uploadResult = await uploadGroupPhoto(result.assets[0].uri);
        if (uploadResult.success && uploadResult.url) {
          await updateGroupPhoto(groupId, uploadResult.url);
          successHaptic();
          toast.success('Groepsfoto bijgewerkt');
          await new Promise(r => setTimeout(r, 500));
          await contextLoadGroups(true);
        } else {
          toast.error(uploadResult.error || 'Upload mislukt');
        }
      }
    } catch {
      toast.error('Kon foto niet laden');
    }
  };

  // Join group
  const handleJoinGroup = async () => {
    if (!joinCode.trim()) return;
    
    setModalActionLoading(true);
    try {
      const result = await joinGroupByCode(joinCode.trim().toUpperCase());
      if (result.success) {
        successHaptic(); // Success feedback
        setShowJoinModal(false);
        setJoinCode('');
        toast.success(t('groups.groupJoined'));
        const loadedGroups = await contextLoadGroups(true);
        await loadSpecialOccasionsIndependent();
      } else {
        toast.error(result.error || t('errors.generic'));
      }
    } catch (error) {
      toast.error(t('errors.generic'));
    } finally {
      setModalActionLoading(false);
    }
  };

  // Leave group
  const handleLeaveGroup = async (group) => {
    lightHaptic();
    const groupId = group.group_id || group.id;
    const groupName = group.name || group.group_name;
    
    Alert.alert(
      t('groups.leaveGroup'),
      t('groups.confirmLeaveGroup', { name: groupName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.leave'),
          style: 'destructive',
          onPress: async () => {
            try {
              log.groups('Attempting to leave group:', groupId);
              const result = await leaveGroup(groupId);
              log.groups('Leave group result:', result);

              if (result.success) {
                successHaptic(); // Success feedback
                // Collapse the card and clear expanded state
                setExpandedGroupId(null);
                expandedGroupIdRef.current = null;
                setExpandedMembers([]);
                setExpandedResponses({});
                setMyResponse(null);
                const loadedGroups = await contextLoadGroups(true);
                await loadSpecialOccasionsIndependent();
                toast.success(t('groups.leftGroup'));
              } else {
                toast.error(result.error || t('errors.generic'));
              }
            } catch (error) {
              debugError('COMPONENTS', 'Leave group error:', error);
              toast.error(error.message || t('errors.generic'));
            }
          }
        }
      ]
    );
  };

  // Delete group
  const handleDeleteGroup = async (group) => {
    lightHaptic();
    const groupId = group.group_id || group.id;
    const groupName = group.name || group.group_name;
    
    Alert.alert(
      t('groups.deleteGroup'),
      t('groups.confirmDeleteGroup', { name: groupName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              log.groups('Attempting to delete group:', groupId);
              const result = await deleteGroup(groupId);
              log.groups('Delete group result:', result);
              
              if (result.success) {
                successHaptic(); // Success feedback
                // Collapse the card and refresh groups
                setExpandedGroupId(null);
                const loadedGroups = await contextLoadGroups(true);
                await loadSpecialOccasionsIndependent();
                toast.success(t('groups.deletedGroup'));
              } else {
                toast.error(result.error || t('errors.generic'));
              }
            } catch (error) {
              debugError('COMPONENTS', 'Delete group error:', error);
              toast.error(error.message || t('errors.generic'));
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with group switcher */}
      <View style={styles.header}>
        {selectedGroup ? (
          <TouchableOpacity
            style={styles.headerContent}
            onPress={() => { if (sortedGroups.length > 1) setShowGroupSwitcher(true); }}
            activeOpacity={sortedGroups.length > 1 ? 0.7 : 1}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {selectedGroup.photo_url ? (
                <ExpoImage
                  source={{ uri: selectedGroup.photo_url }}
                  style={cardStyles.groupPhoto}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ) : null}
              <View>
                <Text style={styles.headerTitle}>
                  {selectedGroup.name || selectedGroup.group_name}
                  {sortedGroups.length > 1 ? ' ▾' : ''}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {(selectedGroup.member_count ?? selectedGroup.memberCount ?? expandedMembers?.length ?? 0)} {t('common.members').toLowerCase()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{t('common.groups')}</Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {selectedGroup && (
            <>
              <TouchableOpacity
                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', position: 'relative' }}
                onPress={() => {
                  const groupId = selectedGroupId;
                  chatOpenGroupRef.current = groupId;
                  setUnreadGroups(prev => { const n = { ...prev }; delete n[groupId]; return n; });
                  const now = new Date().toISOString();
                  chatLastReadRef.current[groupId] = now;
                  const AsyncStorageMod = require('@react-native-async-storage/async-storage').default;
                  AsyncStorageMod.setItem('chatLastRead', JSON.stringify(chatLastReadRef.current)).catch(() => {});
                  navigation.navigate('GroupChat', {
                    groupId,
                    groupName: selectedGroup.name || selectedGroup.group_name,
                    members: expandedMembers,
                  });
                }}
              >
                <Feather name="message-circle" size={24} color="#6B5B4A" />
                {!!unreadGroups[selectedGroupId] && <View style={cardStyles.unreadDot} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                onPress={() => setShowActionsMenu(true)}
              >
                <Feather name="settings" size={22} color="#8B8580" />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileButtonText}>
              {userName ? userName.charAt(0).toUpperCase() : '?'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Group Switcher Dropdown */}
      <GroupSwitcherDropdown
        groups={sortedGroups}
        activeGroupId={selectedGroupId}
        onSelectGroup={(id) => {
          if (id !== selectedGroupId) {
            // Clear old data first
            setTopMeals([]);
            setActiveRequestId(null);
            setActiveRecipeType(null);
            setExpandedMembers([]);
            setExpandedResponses({});
            setMyResponse(null);
            // Set new selection (useEffect will call loadGroupData)
            setSelectedGroupId(id);
            expandedGroupIdRef.current = id;
          }
        }}
        onReorderGroups={(order) => setGroupOrder(order)}
        visible={showGroupSwitcher}
        onClose={() => setShowGroupSwitcher(false)}
        onCreateGroup={() => setShowCreateModal(true)}
        onJoinGroup={() => setShowJoinModal(true)}
      />

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={closeOpenSwipeable}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#8B7355"
          />
        }
      >

        {/* Loading / Empty / Full-page group content */}
        {(loading || contextGroupsLoading) && groups.length === 0 ? (
          <>
            <GroupCardSkeleton />
            <GroupCardSkeleton />
          </>
        ) : groups.length === 0 && !loading && !contextGroupsLoading ? (
          <EmptyGroups onAction={() => { lightHaptic(); setShowCreateModal(true); }} />
        ) : selectedGroup && (
          <View>
            {/* === SECTION 1: PARTICIPATION (primary action) === */}
            <View style={gpStyles.card}>
              <Text style={gpStyles.cardTitle}>{'Eet je mee vanavond?'}</Text>
              <View style={gpStyles.segmentedControl}>
                <TouchableOpacity
                  style={[
                    gpStyles.segmentBtn,
                    myResponse === 'yes' && gpStyles.segmentBtnYesActive
                  ]}
                  onPress={() => handleResponseChange(selectedGroupId, currentUserId, myResponse === 'yes' ? null : 'yes')}
                  activeOpacity={0.7}
                >
                  <Text style={[gpStyles.segmentBtnText, myResponse === 'yes' && gpStyles.segmentBtnTextActive]}>
                    {'Ik eet mee'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    gpStyles.segmentBtn,
                    myResponse === 'no' && gpStyles.segmentBtnNoActive
                  ]}
                  onPress={() => handleResponseChange(selectedGroupId, currentUserId, myResponse === 'no' ? null : 'no')}
                  activeOpacity={0.7}
                >
                  <Text style={[gpStyles.segmentBtnText, myResponse === 'no' && gpStyles.segmentBtnTextActive]}>
                    {'Ik niet'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* === SECTION 2: LIVE PARTICIPATION FEEDBACK === */}
            <View style={gpStyles.card}>
              <View style={gpStyles.attendeesRow}>
                <View style={gpStyles.attendeesCol}>
                  <Text style={gpStyles.attendeesLabelYes}>{'EET MEE'}</Text>
                  {expandedLoading ? (
                    <ActivityIndicator size="small" color="#FF6B00" style={{ marginTop: 6 }} />
                  ) : expandedMembers?.filter(m => expandedResponses?.[m.user_id] === 'yes').length > 0 ? (
                    expandedMembers
                      .filter(m => expandedResponses?.[m.user_id] === 'yes')
                      .map(m => (
                        <Text key={m.user_id} style={gpStyles.attendeeName}>
                          {m.full_name || m.user_name || t('common.unknown')}
                          {m.user_id === currentUserId && ` (${t('common.you')})`}
                        </Text>
                      ))
                  ) : (
                    <Text style={gpStyles.attendeesEmpty}>-</Text>
                  )}
                </View>
                <View style={gpStyles.attendeesDivider} />
                <View style={gpStyles.attendeesCol}>
                  <Text style={gpStyles.attendeesLabelNo}>{'EET NIET MEE'}</Text>
                  {expandedLoading ? (
                    <ActivityIndicator size="small" color="#E57373" style={{ marginTop: 6 }} />
                  ) : expandedMembers?.filter(m => expandedResponses?.[m.user_id] === 'no').length > 0 ? (
                    expandedMembers
                      .filter(m => expandedResponses?.[m.user_id] === 'no')
                      .map(m => (
                        <Text key={m.user_id} style={gpStyles.attendeeNameNo}>
                          {m.full_name || m.user_name || t('common.unknown')}
                          {m.user_id === currentUserId && ` (${t('common.you')})`}
                        </Text>
                      ))
                  ) : (
                    <Text style={gpStyles.attendeesEmpty}>-</Text>
                  )}
                </View>
              </View>
            </View>

            {/* === SECTION 3: FOOD VOTING (interactive cards) === */}
            {activeRecipeType !== 'no_voting' && myResponse === 'yes' && (
              <View style={gpStyles.sectionSpaced}>
                <View style={gpStyles.sectionHeader}>
                  <Text style={gpStyles.sectionTitle}>{'Wat eten we vanavond?'}</Text>
                  {actionLoading ? (
                    <ActivityIndicator color="#8B7355" size="small" />
                  ) : topMeals && topMeals.length > 0 ? (
                    <TouchableOpacity
                      style={gpStyles.voteBtnActive}
                      onPress={() => handleStartVoting(selectedGroup)}
                    >
                      <Feather name="check-circle" size={14} color="#3D9A50" />
                      <Text style={gpStyles.voteBtnActiveText}>{'Gestemd'}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={gpStyles.voteBtn}
                      onPress={() => handleStartVoting(selectedGroup)}
                    >
                      <Text style={gpStyles.voteBtnText}>{'Stem nu'}</Text>
                      <Feather name="arrow-right" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </View>

                {topMeals && topMeals.length > 0 ? (
                  <View style={gpStyles.foodCards}>
                    {topMeals.slice(0, 3).map((meal, idx) => {
                      const name = meal.meal_data?.name || t('meals.recipe');
                      const votes = meal.yes_votes ?? meal.vote_total ?? 0;
                      const thumbnailUrl = meal.meal_data?.thumbnail_url;
                      const cookingTime = meal.meal_data?.total_time_minutes;
                      return (
                        <TouchableOpacity
                          key={meal.meal_option_id || idx}
                          style={gpStyles.foodCard}
                          onPress={() => handleRecipePress(meal)}
                          activeOpacity={0.6}
                        >
                          {thumbnailUrl ? (
                            <Image
                              source={{ uri: thumbnailUrl }}
                              style={gpStyles.foodCardImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={[gpStyles.foodCardImage, gpStyles.foodCardImagePlaceholder]}>
                              <Text style={{ fontSize: 24 }}>🍽</Text>
                            </View>
                          )}
                          <View style={gpStyles.foodCardBody}>
                            <Text style={gpStyles.foodCardName} numberOfLines={1}>{name}</Text>
                            <View style={gpStyles.foodCardMeta}>
                              {cookingTime ? (
                                <View style={gpStyles.foodCardMetaItem}>
                                  <Feather name="clock" size={12} color="#999" />
                                  <Text style={gpStyles.foodCardMetaText}>{cookingTime} min</Text>
                                </View>
                              ) : null}
                              <View style={gpStyles.foodCardMetaItem}>
                                <Feather name="thumbs-up" size={12} color="#8B7355" />
                                <Text style={[gpStyles.foodCardMetaText, { color: '#8B7355' }]}>{votes}</Text>
                              </View>
                            </View>
                          </View>
                          <Feather name="chevron-right" size={18} color="#CCC" />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : topMealsLoading ? (
                  <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#8B7355" />
                  </View>
                ) : null}
              </View>
            )}

            {/* Show top meals even when not voting (read-only) */}
            {activeRecipeType !== 'no_voting' && myResponse !== 'yes' && topMeals?.length > 0 && (
              <View style={gpStyles.sectionSpaced}>
                <Text style={gpStyles.sectionTitle}>{t('meals.topRecipes') || 'Top recepten'}</Text>
                <View style={gpStyles.foodCards}>
                  {topMeals.slice(0, 3).map((meal, idx) => {
                    const name = meal.meal_data?.name || t('meals.recipe');
                    const votes = meal.yes_votes ?? meal.vote_total ?? 0;
                    const thumbnailUrl = meal.meal_data?.thumbnail_url;
                    const cookingTime = meal.meal_data?.total_time_minutes;
                    return (
                      <TouchableOpacity
                        key={meal.meal_option_id || idx}
                        style={gpStyles.foodCard}
                        onPress={() => handleRecipePress(meal)}
                        activeOpacity={0.6}
                      >
                        {thumbnailUrl ? (
                          <Image source={{ uri: thumbnailUrl }} style={gpStyles.foodCardImage} resizeMode="cover" />
                        ) : (
                          <View style={[gpStyles.foodCardImage, gpStyles.foodCardImagePlaceholder]}>
                            <Text style={{ fontSize: 24 }}>🍽</Text>
                          </View>
                        )}
                        <View style={gpStyles.foodCardBody}>
                          <Text style={gpStyles.foodCardName} numberOfLines={1}>{name}</Text>
                          <View style={gpStyles.foodCardMeta}>
                            {cookingTime ? (
                              <View style={gpStyles.foodCardMetaItem}>
                                <Feather name="clock" size={12} color="#999" />
                                <Text style={gpStyles.foodCardMetaText}>{cookingTime} min</Text>
                              </View>
                            ) : null}
                            <View style={gpStyles.foodCardMetaItem}>
                              <Feather name="thumbs-up" size={12} color="#8B7355" />
                              <Text style={[gpStyles.foodCardMetaText, { color: '#8B7355' }]}>{votes}</Text>
                            </View>
                          </View>
                        </View>
                        <Feather name="chevron-right" size={18} color="#CCC" />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* === SHOPPING STATUS === */}
            {myResponse === 'yes' && (
              <View style={gpStyles.sectionSpaced}>
                {activeShopper ? (
                  <View style={gpStyles.shoppingCard}>
                    <View style={gpStyles.shoppingCardLeft}>
                      <View style={gpStyles.shoppingIconWrap}>
                        <Feather name="shopping-bag" size={20} color="#8B7355" />
                      </View>
                      <View style={gpStyles.shoppingCardInfo}>
                        <Text style={gpStyles.shoppingCardName}>
                          {activeShopper.user_id === currentUserId
                            ? 'Jij bent boodschappen aan het doen'
                            : `${activeShopper.user_name} is boodschappen aan het doen`}
                        </Text>
                      </View>
                    </View>
                    {activeShopper.user_id === currentUserId && (
                      <TouchableOpacity
                        style={gpStyles.shoppingStopBtn}
                        onPress={handleStopShopping}
                        disabled={shoppingLoading}
                      >
                        {shoppingLoading ? (
                          <ActivityIndicator size="small" color="#999" />
                        ) : (
                          <Text style={gpStyles.shoppingStopText}>{'Stop'}</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={gpStyles.shoppingBtn}
                    onPress={handleStartShopping}
                    disabled={shoppingLoading}
                    activeOpacity={0.7}
                  >
                    {shoppingLoading ? (
                      <ActivityIndicator size="small" color="#8B7355" />
                    ) : (
                      <>
                        <Feather name="shopping-bag" size={18} color="#8B7355" />
                        <Text style={gpStyles.shoppingBtnText}>{'Ik ga nu inkopen'}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* === SECTION 4: SECONDARY ACTIONS === */}
            <View style={gpStyles.sectionSpaced}>
              <View style={gpStyles.secondaryRow}>
                <TouchableOpacity style={gpStyles.secondaryBtn} onPress={() => {
                  const code = selectedGroup.join_code;
                  require('expo-clipboard').setStringAsync(code);
                  toast.success(t('groups.codeCopied') || 'Code gekopieerd!');
                  Share.share({
                    message: `═══════════════════\n  HAPPIE GROEP JOINEN\n═══════════════════\n\nJe bent uitgenodigd! Open deze link:\nhttps://studentenhappie.nl/join/${code}\n\nOf download de app en vul de code in:\n\n🔑 Code: ${code}\n\n📲 https://apps.apple.com/app/happie/id6757129676\n\n═══════════════════`,
                  }).catch(() => {});
                }}>
                  <Feather name="user-plus" size={16} color="#8B7355" />
                  <Text style={gpStyles.secondaryBtnText}>{'Groepsleden uitnodigen'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={gpStyles.secondaryBtn} onPress={() => setShowGroupRecipesModal(true)}>
                  <Feather name="book-open" size={16} color="#8B7355" />
                  <Text style={gpStyles.secondaryBtnText}>{'Recepten'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        
        {FEATURE_SPECIAL_OCCASIONS && (
        <View style={styles.occasionsSection}>
          <View style={styles.occasionsSectionHeader}>
            <View style={[styles.sectionDivider, { flex: 1 }]}>
              <View style={styles.dividerLine} />
              <Text style={styles.sectionLabel}>{t('common.specialEvents')}</Text>
              <View style={styles.dividerLine} />
            </View>
            {specialOccasions.length > 0 && (
              <TouchableOpacity
                style={styles.occasionAddButton}
                onPress={handleOpenCreateOccasion}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.occasionAddButtonText}>+</Text>
              </TouchableOpacity>
            )}
          </View>

          {specialOccasions.length > 0 ? specialOccasions.map((occasion) => {
              const isExpanded = expandedOccasionId === occasion.id;
              const myResponse = occasion.myResponse || occasionResponses[currentUserId];
              const typeInfo = occasionLabels[occasion.occasion_type] || occasionLabels.other;
              const displayTitle = occasion.occasion_message
                ? `${typeInfo.label}: ${occasion.occasion_message}`
                : typeInfo.label;
              
              return (
                <Swipeable
                  key={occasion.id}
                  ref={(ref) => { swipeableRefs.current[`occasion-${occasion.id}`] = ref; }}
                  renderRightActions={() => renderOccasionSwipeAction(occasion, false)}
                  overshootRight={false}
                  friction={2}
                  rightThreshold={60}
                  onSwipeableOpen={() => {
                    // Close any other open swipeable
                    if (openSwipeableId.current && openSwipeableId.current !== `occasion-${occasion.id}`) {
                      closeOpenSwipeable();
                    }
                    openSwipeableId.current = `occasion-${occasion.id}`;
                  }}
                  onSwipeableClose={() => {
                    if (openSwipeableId.current === `occasion-${occasion.id}`) {
                      openSwipeableId.current = null;
                    }
                  }}
                >
                  <TouchableOpacity 
                    style={[styles.occasionCard, { borderLeftWidth: 4, borderLeftColor: typeInfo.color }]}
                    onPress={() => {
                      closeOpenSwipeable();
                      handleOccasionToggle(occasion);
                    }}
                    activeOpacity={1}
                    delayPressIn={100}
                  >
                  {/* Main row: Type + message, date, Yes/No buttons */}
                  <View style={styles.occasionMainRow}>
                    <View style={styles.occasionInfo}>
                      <Text style={styles.occasionType} numberOfLines={2}>
                        {displayTitle}
                      </Text>
                      <Text style={styles.occasionTime}>
                        {formatDateShortNL(occasion.date)}{formatTimeDisplay(occasion.time) ? ` · ${formatTimeDisplay(occasion.time)}` : ''}
                        {occasion.creatorName && occasion.creatorName !== 'Someone' ? ` · ${occasion.creatorName}` : ''}
                      </Text>
                    </View>
                    
                    {/* Compact Yes/No Buttons on right - delayPressIn helps Swipeable capture gesture first */}
                    <View style={styles.responseButtonsCompact}>
                      <TouchableOpacity 
                        style={[
                          styles.responseButtonSmall, 
                          styles.responseButtonYes,
                          myResponse === 'yes' && styles.responseButtonYesActive
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleOccasionResponseChange(occasion.id, myResponse === 'yes' ? null : 'yes');
                        }}
                        delayPressIn={100}
                      >
                        <Text style={[
                          styles.responseButtonTextSmall,
                          myResponse === 'yes' && styles.responseButtonTextActive
                        ]}>{ t('dinner.yes') }</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.responseButtonSmall,
                          styles.responseButtonNo,
                          myResponse === 'no' && styles.responseButtonNoActive
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleOccasionResponseChange(occasion.id, myResponse === 'no' ? null : 'no');
                        }}
                        delayPressIn={100}
                      >
                        <Text style={[
                          styles.responseButtonTextSmall,
                          myResponse === 'no' && styles.responseButtonTextActive
                        ]}>{ t('dinner.no') }</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Expanded: attendees, Start Voting, Top 3 button */}
                  {isExpanded && (
                    <>
                      <View style={styles.attendeesList}>
                        <View style={styles.attendeesRow}>
                          {/* Attending */}
                          <View style={styles.attendeesColumn}>
                            <Text style={styles.attendeesLabelGreen}>{t('common.attending')}</Text>
                            {occasionLoading ? (
                              <ActivityIndicator size="small" color="#FF6B00" style={{ marginTop: 4 }} />
                            ) : occasionMembers.filter(m => occasionResponses[m.user_id] === 'yes').length > 0 ? (
                              occasionMembers
                                .filter(m => occasionResponses[m.user_id] === 'yes')
                                .map(m => (
                                  <Text key={m.user_id} style={styles.attendeeName}>
                                    {m.profiles?.full_name || t('common.unknown')}
                                  </Text>
                                ))
                            ) : (
                              <Text style={styles.noAttendees}>-</Text>
                            )}
                          </View>
                          
                          {/* Not Attending */}
                          <View style={styles.attendeesColumn}>
                            <Text style={styles.attendeesLabelRed}>{t('common.notAttending')}</Text>
                            {occasionLoading ? (
                              <ActivityIndicator size="small" color="#f44336" style={{ marginTop: 4 }} />
                            ) : occasionMembers.filter(m => occasionResponses[m.user_id] === 'no').length > 0 ? (
                              occasionMembers
                                .filter(m => occasionResponses[m.user_id] === 'no')
                                .map(m => (
                                  <Text key={m.user_id} style={styles.attendeeNameNo}>
                                    {m.profiles?.full_name || t('common.unknown')}
                                  </Text>
                                ))
                            ) : (
                              <Text style={styles.noAttendees}>-</Text>
                            )}
                          </View>
                        </View>
                      </View>
                      {occasion.creatorName && (
                        <Text style={styles.occasionCreator}>
                          {t('common.createdBy')} {occasion.creatorName}
                        </Text>
                      )}
                    </>
                  )}
                </TouchableOpacity>
                </Swipeable>
              );
            }) : (
              <EmptyOccasions
                compact
                onAction={handleOpenCreateOccasion}
              />
            )}
        </View>
        )}

        {/* Old Events Expandable Section - Only show if there are past occasions */}
        {FEATURE_SPECIAL_OCCASIONS && pastOccasions.length > 0 && (
          <>
            <TouchableOpacity 
              style={styles.sectionDividerTouchable}
              onPress={handleTogglePastOccasions}
            >
              <View style={styles.dividerLine} />
              <Text style={styles.sectionLabel}>{t('common.oldEvents')} {showPastOccasions ? '▲' : '▼'}</Text>
              <View style={styles.dividerLine} />
            </TouchableOpacity>
            
            {showPastOccasions && (
              <View style={styles.pastOccasionsContainer}>
                {pastOccasions.map((occasion) => {
                  const isExpanded = expandedPastOccasionId === occasion.id;
                  const participants = pastOccasionParticipants[occasion.id] || [];
                  const typeInfo = occasionLabels[occasion.occasion_type] || occasionLabels.other;
                  const pastDisplayTitle = occasion.occasion_message
                    ? `${typeInfo.label}: ${occasion.occasion_message}`
                    : typeInfo.label;

                  // Convert to memberResponses format for expanded view
                  const pastMemberResponses = {};
                  participants.forEach(p => {
                    pastMemberResponses[p.user_id] = p.response === 'accepted' ? 'yes' : 
                                                 p.response === 'declined' ? 'no' : 
                                                 p.response_status || null;
                  });

                  // Use myResponse from occasion data (already loaded)
                  const myResponse = occasion.myResponse;

                  return (
                    <Swipeable
                      key={occasion.id}
                      ref={(ref) => { swipeableRefs.current[`past-${occasion.id}`] = ref; }}
                      renderRightActions={() => renderOccasionSwipeAction(occasion, true)}
                      overshootRight={false}
                      friction={2}
                      rightThreshold={60}
                      onSwipeableOpen={() => {
                        if (openSwipeableId.current && openSwipeableId.current !== `past-${occasion.id}`) {
                          closeOpenSwipeable();
                        }
                        openSwipeableId.current = `past-${occasion.id}`;
                      }}
                      onSwipeableClose={() => {
                        if (openSwipeableId.current === `past-${occasion.id}`) {
                          openSwipeableId.current = null;
                        }
                      }}
                    >
                      <TouchableOpacity 
                        style={[styles.occasionCard, { borderLeftWidth: 4, borderLeftColor: typeInfo.color }]}
                        onPress={() => {
                          closeOpenSwipeable();
                          handleTogglePastOccasion(occasion.id);
                        }}
                        activeOpacity={1}
                        delayPressIn={100}
                      >
                        {/* Main row: Type + message, date, response status */}
                        <View style={styles.occasionMainRow}>
                          <View style={styles.occasionInfo}>
                            <Text style={styles.occasionType} numberOfLines={2}>
                              {pastDisplayTitle}
                            </Text>
                            <Text style={styles.occasionTime}>
                              {formatDateShortNL(occasion.date)}{formatTimeDisplay(occasion.time) ? ` · ${formatTimeDisplay(occasion.time)}` : ''}
                              {occasion.creatorName && occasion.creatorName !== 'Someone' ? ` · ${occasion.creatorName}` : ''}
                            </Text>
                          </View>
                          
                          {/* Show response status (no buttons for past events) */}
                          <View style={styles.responseButtonsCompact}>
                            {myResponse === 'yes' && (
                              <View style={[styles.responseButtonSmall, styles.responseButtonYes, styles.responseButtonYesActive]}>
                                <Text style={[styles.responseButtonTextSmall, styles.responseButtonTextActive]}>{t('common.yes')}</Text>
                              </View>
                            )}
                            {myResponse === 'no' && (
                              <View style={[styles.responseButtonSmall, styles.responseButtonNo, styles.responseButtonNoActive]}>
                                <Text style={[styles.responseButtonTextSmall, styles.responseButtonTextActive]}>{t('common.no')}</Text>
                              </View>
                            )}
                            {!myResponse && (
                              <Text style={styles.pastEventLabel}>{t('common.past') || 'Past'}</Text>
                            )}
                          </View>
                        </View>
                        
                        {/* Expanded: Show attendees list - Labels always visible */}
                        {isExpanded && (
                          <View style={styles.attendeesList}>
                            <View style={styles.attendeesRow}>
                              {/* Attending */}
                              <View style={styles.attendeesColumn}>
                                <Text style={styles.attendeesLabelGreen}>{t('common.attending')}</Text>
                                {pastParticipantsLoading && !participants.length ? (
                                  <ActivityIndicator size="small" color="#FF6B00" style={{ marginTop: 4 }} />
                                ) : participants.filter(p => pastMemberResponses[p.user_id] === 'yes').length > 0 ? (
                                  participants
                                    .filter(p => pastMemberResponses[p.user_id] === 'yes')
                                    .map(p => (
                                      <Text key={p.user_id} style={styles.attendeeName}>
                                        {p.user_name || t('common.unknown')}
                                      </Text>
                                    ))
                                ) : (
                                  <Text style={styles.noAttendees}>-</Text>
                                )}
                              </View>
                              
                              {/* Not Attending */}
                              <View style={styles.attendeesColumn}>
                                <Text style={styles.attendeesLabelRed}>{t('common.notAttending')}</Text>
                                {pastParticipantsLoading && !participants.length ? (
                                  <ActivityIndicator size="small" color="#f44336" style={{ marginTop: 4 }} />
                                ) : participants.filter(p => pastMemberResponses[p.user_id] === 'no').length > 0 ? (
                                  participants
                                    .filter(p => pastMemberResponses[p.user_id] === 'no')
                                    .map(p => (
                                      <Text key={p.user_id} style={styles.attendeeNameNo}>
                                        {p.user_name || t('common.unknown')}
                                      </Text>
                                    ))
                                ) : (
                                  <Text style={styles.noAttendees}>-</Text>
                                )}
                              </View>
                            </View>
                          </View>
                        )}
                      </TouchableOpacity>
                    </Swipeable>
                  );
                })}
              </View>
            )}
          </>
        )}
        
        {/* Bottom Padding handled by scrollContent paddingBottom */}
      </ScrollView>

      {/* Bottom Actions - only show when no groups */}
      {groups.length === 0 && !loading && !contextGroupsLoading && (
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => { lightHaptic(); setShowCreateModal(true); }}
          >
            <Text style={styles.actionButtonText}>+ Nieuwe Groep</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => { lightHaptic(); setShowJoinModal(true); }}
          >
            <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
              Join groep met code
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Group Actions Menu Modal */}
      {selectedGroup && (
        <Modal
          visible={showActionsMenu}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowActionsMenu(false)}
        >
          <TouchableOpacity
            style={cardStyles.menuOverlay}
            activeOpacity={1}
            onPress={() => setShowActionsMenu(false)}
          >
            <View style={cardStyles.menuContainer}>
              <TouchableOpacity
                style={cardStyles.menuItem}
                onPress={() => {
                  require('expo-clipboard').setStringAsync(selectedGroup.join_code);
                  successHaptic();
                  setShowActionsMenu(false);
                }}
              >
                <Text style={cardStyles.menuItemText}>{t('common.copyCode')}</Text>
                <Text style={cardStyles.menuItemCode}>{selectedGroup.join_code}</Text>
              </TouchableOpacity>

              <View style={cardStyles.menuDivider} />

              <TouchableOpacity
                style={cardStyles.menuItem}
                onPress={() => { setShowActionsMenu(false); setShowMembersModal(true); }}
              >
                <Text style={cardStyles.menuItemText}>{t('common.members')}</Text>
              </TouchableOpacity>

              <View style={cardStyles.menuDivider} />

              <TouchableOpacity
                style={cardStyles.menuItem}
                onPress={() => { setShowActionsMenu(false); setShowGroupRecipesModal(true); }}
              >
                <Text style={cardStyles.menuItemText}>{t('groups.recipes') || 'Recepten'}</Text>
              </TouchableOpacity>

              <View style={cardStyles.menuDivider} />

              <TouchableOpacity
                style={cardStyles.menuItem}
                onPress={() => {
                  setShowActionsMenu(false);
                  handleChangeGroupPhoto(selectedGroupId);
                }}
              >
                <Text style={cardStyles.menuItemText}>{selectedGroup.photo_url ? 'Foto wijzigen' : 'Groepsfoto toevoegen'}</Text>
              </TouchableOpacity>

              <View style={cardStyles.menuDivider} />

              <TouchableOpacity
                style={cardStyles.menuItem}
                onPress={() => { setShowActionsMenu(false); handleLeaveGroup(selectedGroup); }}
              >
                <Text style={cardStyles.menuItemTextMuted}>{t('common.leave')}</Text>
              </TouchableOpacity>

              {selectedGroup.created_by === currentUserId && (
                <>
                  <View style={cardStyles.menuDivider} />
                  <TouchableOpacity
                    style={cardStyles.menuItem}
                    onPress={() => { setShowActionsMenu(false); handleDeleteGroup(selectedGroup); }}
                  >
                    <Text style={cardStyles.menuItemTextDanger}>{t('common.delete')}</Text>
                  </TouchableOpacity>
                </>
              )}

              <View style={cardStyles.menuDivider} />

              <TouchableOpacity
                style={cardStyles.menuItemCancel}
                onPress={() => setShowActionsMenu(false)}
              >
                <Text style={cardStyles.menuItemTextCancel}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Members Modal */}
      {selectedGroup && (
        <Modal
          visible={showMembersModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowMembersModal(false)}
        >
          <TouchableOpacity
            style={cardStyles.menuOverlay}
            activeOpacity={1}
            onPress={() => setShowMembersModal(false)}
          >
            <View style={cardStyles.membersContainer} onStartShouldSetResponder={() => true}>
              <View style={cardStyles.membersHeader}>
                <Text style={cardStyles.membersTitle}>{t('common.members')}</Text>
                <TouchableOpacity onPress={() => setShowMembersModal(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Text style={cardStyles.membersClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={cardStyles.membersList} showsVerticalScrollIndicator={false}>
                {expandedMembers && expandedMembers.length > 0 ? expandedMembers.map(m => (
                  <View key={m.user_id} style={cardStyles.memberRow}>
                    <View style={cardStyles.memberAvatar}>
                      <Text style={cardStyles.memberAvatarText}>
                        {(m.full_name || m.user_name || '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={cardStyles.memberName}>
                      {m.full_name || m.user_name || t('common.unknown')}
                      {m.user_id === currentUserId && ` (${t('common.you')})`}
                    </Text>
                  </View>
                )) : (
                  <Text style={cardStyles.membersEmpty}>{t('emptyStates.noMembers')}</Text>
                )}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Group Recipes Modal */}
      {selectedGroup && (
        <GroupRecipesScreen
          visible={showGroupRecipesModal}
          onClose={() => setShowGroupRecipesModal(false)}
          groupId={selectedGroup.id}
          groupName={selectedGroup.name}
        />
      )}

      {/* Recipe Details Modal */}
      <Modal visible={showRecipeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowRecipeModal(false);
              setSelectedRecipe(null);
            }}
          />
          <View style={styles.recipeModalContent}>
            {selectedRecipe && selectedRecipe.meal_data && (
              <>
                <View style={styles.recipeModalHeader}>
                  {selectedRecipe.meal_data.thumbnail_url && (
                    <ExpoImage 
                      source={{ uri: selectedRecipe.meal_data.thumbnail_url }}
                      style={styles.recipeModalImage}
                      contentFit="cover"
                      transition={300}
                      cachePolicy="memory-disk"
                    />
                  )}
                  <TouchableOpacity 
                    style={styles.recipeModalClose}
                    onPress={() => {
                      setShowRecipeModal(false);
                      setSelectedRecipe(null);
                    }}
                  >
                    <Text style={styles.recipeModalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.recipeModalBody} showsVerticalScrollIndicator={false}>
                  <Text style={styles.recipeModalTitle}>
                    {selectedRecipe.meal_data.name || t('recipes.defaultName')}
                  </Text>
                  <View style={styles.recipeModalMeta}>
                    <View style={styles.recipeModalMetaItemThird}>
                      <Text style={styles.recipeModalMetaLabel}>{t('common.votes')}</Text>
                      <Text style={styles.recipeModalMetaValue}>{selectedRecipe.yes_votes || 0}</Text>
                    </View>
                    {selectedRecipe.meal_data.total_time_minutes > 0 && (
                      <View style={styles.recipeModalMetaItemThird}>
                        <Text style={styles.recipeModalMetaLabel}>{t('recipes.cookingTime')}</Text>
                        <Text style={styles.recipeModalMetaValue}>{selectedRecipe.meal_data.total_time_minutes} min</Text>
                      </View>
                    )}
                    {(() => { const ex = getRecipeExtras(selectedRecipe.meal_data.name); return ex.estimated_cost ? (
                      <View style={styles.recipeModalMetaItemThird}>
                        <Text style={styles.recipeModalMetaLabel}>{t('recipes.cost')}</Text>
                        <Text style={styles.recipeModalMetaValue}>{'\u20AC'}{ex.estimated_cost.toFixed(0)}</Text>
                      </View>
                    ) : null; })()}
                  </View>
                  {selectedRecipe.meal_data.description ? (
                    <Text style={styles.recipeModalDescription}>{selectedRecipe.meal_data.description}</Text>
                  ) : null}
                  {selectedRecipe.meal_data.ingredients?.length > 0 && (
                    <View style={styles.recipeModalSection}>
                      <Text style={styles.recipeModalSectionTitle}>{t('recipes.ingredients')}</Text>
                      <ServingSelector count={servingCount} onChange={setServingCount} />
                      {scaleIngredients(selectedRecipe.meal_data.ingredients, getRecipeExtras(selectedRecipe.meal_data.name).default_servings, servingCount).map((item, idx) => (
                        <Text key={idx} style={styles.recipeModalIngredient}>• {item}</Text>
                      ))}
                    </View>
                  )}
                  {selectedRecipe.meal_data.steps?.length > 0 && (
                    <View style={styles.recipeModalSection}>
                      <Text style={styles.recipeModalSectionTitle}>{t('recipes.instructions')}</Text>
                      {selectedRecipe.meal_data.steps.map((step, idx) => (
                        <View key={idx} style={styles.recipeModalStep}>
                          <View style={styles.recipeModalStepNumber}>
                            <Text style={styles.recipeModalStepNumberText}>{idx + 1}</Text>
                          </View>
                          <Text style={styles.recipeModalStepText}>{step}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <View style={{ height: 30 }} />
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Top 3 Modal - fetches fresh data every time it opens */}
      <Top3Modal
        visible={showTop3Modal}
        onClose={() => { setShowTop3Modal(false); setTop3ModalLoadFn(null); }}
        loadMeals={top3ModalLoadFn}
        onRecipePress={handleRecipePress}
      />

      {/* Create Group Modal */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            onPress={() => { Keyboard.dismiss(); setShowCreateModal(false); setGroupPhotoUri(null); }} 
            activeOpacity={1} 
          />
          <Pressable style={styles.simpleModal} onPress={Keyboard.dismiss}>
            <Text style={styles.simpleModalTitle}>{t('common.newGroup')}</Text>
            <Text style={styles.simpleModalSubtitle}>{t('groups.giveGroupName')}</Text>
            <TouchableOpacity style={styles.groupPhotoPickerRow} onPress={handlePickGroupPhoto}>
              {groupPhotoUri ? (
                <Image source={{ uri: groupPhotoUri }} style={styles.groupPhotoPreview} />
              ) : (
                <View style={styles.groupPhotoPlaceholder}>
                  <Feather name="camera" size={22} color="#A09485" />
                </View>
              )}
              <Text style={styles.groupPhotoLabel}>{groupPhotoUri ? 'Foto wijzigen' : 'Groepsfoto toevoegen'}</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder={t('groups.namePlaceholder')}
              placeholderTextColor="#999"
              value={groupName}
              onChangeText={setGroupName}
              autoFocus
            />
            <View style={styles.simpleModalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => { setShowCreateModal(false); setGroupPhotoUri(null); }}
              >
                <Text style={styles.cancelButtonText}>Annuleren</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, !groupName.trim() && styles.confirmButtonDisabled]} 
                onPress={handleCreateGroup}
                disabled={modalActionLoading || !groupName.trim()}
              >
                {modalActionLoading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Maken</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </View>
      </Modal>

      {/* Join Group Modal */}
      <Modal visible={showJoinModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            onPress={() => { Keyboard.dismiss(); setShowJoinModal(false); }} 
            activeOpacity={1} 
          />
          <Pressable style={styles.simpleModal} onPress={Keyboard.dismiss}>
            <Text style={styles.simpleModalTitle}>Join een Groep</Text>
            <Text style={styles.simpleModalSubtitle}>Vul de groepscode in</Text>
            <TextInput
              style={styles.input}
              placeholder="bijv. ABC123"
              placeholderTextColor="#999"
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="characters"
              autoFocus
            />
            <View style={styles.simpleModalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowJoinModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, !joinCode.trim() && styles.confirmButtonDisabled]} 
                onPress={handleJoinGroup}
                disabled={modalActionLoading || !joinCode.trim()}
              >
                {modalActionLoading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>{t('groups.join')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </View>
      </Modal>

      {/* Share Prompt Modal - shown after creating a group */}
      <Modal visible={showSharePrompt} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowSharePrompt(false)}
            activeOpacity={1}
          />
          <View style={styles.simpleModal}>
            <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>🍽️</Text>
            <Text style={styles.simpleModalTitle}>Alleen eten is niks aan!</Text>
            <Text style={[styles.simpleModalSubtitle, { marginBottom: 8, color: '#6B6560', lineHeight: 20 }]}>
              Deel deze groep met je vrienden zodat jullie samen kunnen plannen wat je gaat eten.
            </Text>
            <View style={{
              backgroundColor: '#F5F2EE',
              borderRadius: 12,
              padding: 14,
              marginBottom: 20,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#E8E2DA',
            }}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#999', marginBottom: 4 }}>Groepscode</Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: '#2D2D2D', letterSpacing: 2 }}>{newGroupCode}</Text>
            </View>
            <View style={styles.simpleModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowSharePrompt(false)}
              >
                <Text style={styles.cancelButtonText}>Later</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { flexDirection: 'row', justifyContent: 'center' }]}
                onPress={() => {
                  Clipboard.setStringAsync(newGroupCode);
                  setShowSharePrompt(false);
                  // Delay share sheet so modal closes first
                  setTimeout(async () => {
                    try {
                      await Share.share({
                        message: `═══════════════════\n  HAPPIE GROEP JOINEN\n═══════════════════\n\nJe bent uitgenodigd! Open deze link:\nhttps://studentenhappie.nl/join/${newGroupCode}\n\nOf download de app en vul de code in:\n\n🔑 Code: ${newGroupCode}\n\n📲 https://apps.apple.com/app/happie/id6757129676\n\n═══════════════════`,
                      });
                    } catch (_) {}
                  }, 400);
                }}
              >
                <Feather name="share" size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.confirmButtonText}>Deel groep</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Special Occasion Modal - Multi-step wizard */}
      <Modal visible={showCreateOccasionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => { Keyboard.dismiss(); setShowCreateOccasionModal(false); }}
          />
          <Pressable style={[styles.simpleModal, { maxWidth: 400, width: screenWidth - 32 }]} onPress={Keyboard.dismiss}>
            {/* Progress dots */}
            <View style={occasionWizardStyles.progressRow}>
              {[1, 2, 3].map(step => (
                <View key={step} style={[
                  occasionWizardStyles.progressDot,
                  occasionStep >= step && occasionWizardStyles.progressDotActive,
                ]} />
              ))}
            </View>

            {/* ===== STEP 1: Type & Details ===== */}
            {occasionStep === 1 && (
              <View>
                <Text style={styles.simpleModalTitle}>{t('occasions.planSomething')}</Text>
                <Text style={styles.simpleModalSubtitle}>{t('occasions.whatOccasion')}</Text>
                
                <View style={styles.occasionTypeSelector}>
                  {Object.entries(occasionLabels).map(([key, value]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.occasionTypeOption,
                        newOccasionType === key && { backgroundColor: value.color }
                      ]}
                      onPress={() => { setNewOccasionType(key); lightHaptic(); }}
                    >
                      <Text style={[
                        styles.occasionTypeText,
                        newOccasionType === key && { color: '#FFF' }
                      ]}>
                        {value.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <Text style={occasionWizardStyles.fieldLabel}>{t('occasions.messageOptional')}</Text>
                <TextInput
                  style={styles.input}
                  value={newOccasionMessage}
                  onChangeText={setNewOccasionMessage}
                  placeholder={t('occasions.messagePlaceholder')}
                  placeholderTextColor="#A0A0A0"
                  multiline
                />
                
                <Text style={occasionWizardStyles.fieldLabel}>{t('occasions.timeOptional')}</Text>
                <TextInput
                  style={styles.input}
                  value={newOccasionTime}
                  onChangeText={setNewOccasionTime}
                  placeholder="18:00"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="numbers-and-punctuation"
                />
                
                <View style={styles.simpleModalButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setShowCreateOccasionModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.confirmButton}
                    onPress={() => { setOccasionStep(2); lightHaptic(); }}
                  >
                    <Text style={styles.confirmButtonText}>{t('common.next')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ===== STEP 2: Calendar Date Picker ===== */}
            {occasionStep === 2 && (
              <View>
                <Text style={styles.simpleModalTitle}>{t('occasions.chooseDate')}</Text>
                <Text style={styles.simpleModalSubtitle}>{t('occasions.whenIsIt')}</Text>
                
                <Calendar
                  onDayPress={(day) => {
                    setNewOccasionDate(day.dateString);
                    lightHaptic();
                  }}
                  markedDates={newOccasionDate ? {
                    [newOccasionDate]: { selected: true, selectedColor: occasionLabels[newOccasionType]?.color || '#8B7355' }
                  } : {}}
                  minDate={new Date().toISOString().split('T')[0]}
                  theme={{
                    backgroundColor: 'transparent',
                    calendarBackground: 'transparent',
                    textSectionTitleColor: '#8B8B8B',
                    selectedDayBackgroundColor: occasionLabels[newOccasionType]?.color || '#8B7355',
                    selectedDayTextColor: '#FFFFFF',
                    todayTextColor: '#8B7355',
                    dayTextColor: '#2D2D2D',
                    textDisabledColor: '#D0D0D0',
                    dotColor: '#8B7355',
                    monthTextColor: '#2D2D2D',
                    arrowColor: '#8B7355',
                    textDayFontFamily: 'Inter_400Regular',
                    textMonthFontFamily: 'PlayfairDisplay_700Bold',
                    textDayHeaderFontFamily: 'Inter_500Medium',
                    textDayFontSize: 15,
                    textMonthFontSize: 18,
                    textDayHeaderFontSize: 13,
                  }}
                  style={{ borderRadius: 16, overflow: 'hidden' }}
                />

                {newOccasionDate ? (
                  <Text style={occasionWizardStyles.selectedDateLabel}>
                    {(() => {
                      const d = new Date(newOccasionDate + 'T12:00:00');
                      const days = ['Zondag','Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag'];
                      const months = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
                      return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
                    })()}
                  </Text>
                ) : null}
                
                <View style={[styles.simpleModalButtons, { marginTop: 12 }]}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => { setOccasionStep(1); lightHaptic(); }}
                  >
                    <Text style={styles.cancelButtonText}>{t('common.back')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.confirmButton, !newOccasionDate && styles.confirmButtonDisabled]}
                    onPress={() => { if (newOccasionDate) { setOccasionStep(3); lightHaptic(); } }}
                    disabled={!newOccasionDate}
                  >
                    <Text style={styles.confirmButtonText}>{t('common.next')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ===== STEP 3: Select Groups ===== */}
            {occasionStep === 3 && (
              <View>
                <Text style={styles.simpleModalTitle}>{t('occasions.shareWithGroups')}</Text>
                <Text style={styles.simpleModalSubtitle}>{t('occasions.chooseGroups')}</Text>
                
                <ScrollView 
                  style={occasionWizardStyles.groupList} 
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  {groups.length === 0 ? (
                    <Text style={occasionWizardStyles.noGroupsText}>
                      {t('occasions.noGroupsCanCreate')}
                    </Text>
                  ) : (
                    groups.map(group => {
                      const gid = group.id || group.group_id;
                      const isSelected = occasionSelectedGroups.some(g => (g.id || g.group_id) === gid);
                      const memberCount =
                        group.member_count ??
                        group.memberCount ??
                        group.members_count ??
                        group.membersCount ??
                        group.member_total ??
                        group.memberTotal ??
                        group.members?.length ??
                        0;
                      return (
                        <TouchableOpacity
                          key={gid}
                          style={[
                            occasionWizardStyles.groupItem,
                            isSelected && occasionWizardStyles.groupItemSelected,
                          ]}
                          onPress={() => {
                            lightHaptic();
                            setOccasionSelectedGroups(prev => {
                              if (isSelected) return prev.filter(g => (g.id || g.group_id) !== gid);
                              return [...prev, group];
                            });
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={occasionWizardStyles.groupItemLeft}>
                            <View style={[
                              occasionWizardStyles.groupCheckbox,
                              isSelected && { backgroundColor: occasionLabels[newOccasionType]?.color || '#8B7355', borderColor: occasionLabels[newOccasionType]?.color || '#8B7355' },
                            ]}>
                              {isSelected && <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>✓</Text>}
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={occasionWizardStyles.groupName} numberOfLines={1}>
                                {group.name || group.group_name}
                              </Text>
                              {memberCount > 0 && (
                                <Text style={occasionWizardStyles.groupMemberCount}>
                                  {memberCount} {memberCount === 1 ? t('common.member') : t('common.members')}
                                </Text>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>

                {occasionSelectedGroups.length > 0 && (
                  <Text style={occasionWizardStyles.selectedCountLabel}>
                    {occasionSelectedGroups.length === 1 ? t('occasions.selectedOne', { count: 1 }) : t('occasions.selectedMany', { count: occasionSelectedGroups.length })}
                  </Text>
                )}
                
                <View style={[styles.simpleModalButtons, { marginTop: 12 }]}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => { setOccasionStep(2); lightHaptic(); }}
                  >
                    <Text style={styles.cancelButtonText}>{t('common.back')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.confirmButton, createOccasionLoading && styles.confirmButtonDisabled]}
                    onPress={handleCreateOccasion}
                    disabled={createOccasionLoading}
                  >
                    {createOccasionLoading ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.confirmButtonText}>{t('occasions.create')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Redesigned full-page group styles
const gpStyles = StyleSheet.create({
  // --- Cards / Sections ---
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEEBE6',
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#2D2D2D',
    marginBottom: 14,
  },
  sectionSpaced: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#2D2D2D',
  },

  // --- Segmented Control (participation) ---
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F3F0EB',
    borderRadius: 10,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnYesActive: {
    backgroundColor: '#3D9A50',
  },
  segmentBtnNoActive: {
    backgroundColor: '#D45050',
  },
  segmentBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#9E9790',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
  },

  // --- Attendees ---
  attendeesRow: {
    flexDirection: 'row',
  },
  attendeesCol: {
    flex: 1,
  },
  attendeesDivider: {
    width: 1,
    backgroundColor: '#EEEBE6',
    marginHorizontal: 16,
  },
  attendeesLabelYes: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#3D9A50',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  attendeesLabelNo: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#D45050',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  attendeeName: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#2D2D2D',
    paddingVertical: 3,
    lineHeight: 20,
  },
  attendeeNameNo: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#999',
    paddingVertical: 3,
    lineHeight: 20,
  },
  attendeesEmpty: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#CCC',
  },

  // --- Food voting cards ---
  voteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#8B7355',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  voteBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  voteBtnActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EDF7EF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  voteBtnActiveText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#3D9A50',
  },
  foodCards: {
    gap: 10,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EEEBE6',
    padding: 12,
    gap: 12,
  },
  foodCardImage: {
    width: 52,
    height: 52,
    borderRadius: 8,
  },
  foodCardImagePlaceholder: {
    backgroundColor: '#F3F0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodCardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  foodCardName: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  foodCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  foodCardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  foodCardMetaText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#999',
  },

  // --- Secondary action buttons ---
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0DBD4',
    backgroundColor: '#FAFAF8',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#8B7355',
  },

  // --- Shopping ---
  shoppingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#8B7355',
    borderStyle: 'dashed',
    backgroundColor: '#FAFAF8',
  },
  shoppingBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#8B7355',
  },
  shoppingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF8F0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F0E0CC',
    padding: 14,
  },
  shoppingCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  shoppingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0E0CC',
  },
  shoppingCardInfo: {
    flex: 1,
  },
  shoppingCardName: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#2D2D2D',
    lineHeight: 20,
  },
  shoppingStopBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#F3F0EB',
    marginLeft: 10,
  },
  shoppingStopText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#999',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4F1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8B7355',
    fontFamily: 'Inter_400Regular',
  },
  skeletonContainer: {
    flex: 1,
    paddingTop: 60,
  },
  skeletonHeader: {
    height: 50,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEBE6',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#2D2D2D',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#8B7355',
    letterSpacing: 0.3,
  },
  profileButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#8B7355',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    overflow: 'hidden',
  },
  profileButtonImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  profileButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FEFEFE',
  },
  headerAccent: {
    position: 'absolute',
    bottom: 0,
    left: 24,
    width: 50,
    height: 3,
    backgroundColor: '#8B7355',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 120,
  },
  eatingLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#B0A8A0',
    textAlign: 'right',
    marginBottom: 6,
    paddingRight: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyDrawing: {
    width: 140,
    height: 140,
    opacity: 0.25,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#2D2D2D',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#6B6B6B',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  // Special Occasions Section
  occasionsSection: {
    marginTop: 36,
  },
  occasionsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  occasionsSectionHeaderDivider: {
    flex: 1,
  },
  occasionAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B7355',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  occasionAddButtonText: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFF',
    lineHeight: 22,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionDividerTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
    paddingVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E2DA',
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#8B7355',
    marginHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Occasion Card (simple display)
  occasionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  occasionMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  occasionInfo: {
    flex: 1,
  },
  occasionType: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#2D2D2D',
  },
  occasionTime: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#A09485',
    marginTop: 3,
  },
  occasionExpandedTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#2D2D2D',
    marginTop: 14,
    marginBottom: 4,
  },
  occasionCreator: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#A09485',
    marginTop: 14,
  },
  // Compact Response Buttons (right side) -- segmented control
  responseButtonsCompact: {
    flexDirection: 'row',
    marginLeft: 12,
    backgroundColor: '#F0EDE8',
    borderRadius: 14,
    padding: 3,
  },
  responseButtonSmall: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 11,
    borderWidth: 0,
  },
  responseButtonYes: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  responseButtonYesActive: {
    backgroundColor: '#FF6B00',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  responseButtonNo: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  responseButtonNoActive: {
    backgroundColor: '#E57373',
    shadowColor: '#E57373',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  responseButtonTextSmall: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#8B8580',
  },
  responseButtonTextActive: {
    color: '#FFFFFF',
  },
  // Attendees List (expanded)
  attendeesList: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0EDE8',
  },
  attendeesRow: {
    flexDirection: 'row',
    gap: 16,
  },
  attendeesColumn: {
    flex: 1,
  },
  attendeesLabelGreen: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#FF6B00',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  attendeesLabelRed: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#E57373',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  attendeeName: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#2D2D2D',
    marginTop: 3,
  },
  attendeeNameNo: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#B0A8A0',
    marginTop: 3,
  },
  noAttendees: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#C0C0C0',
    fontStyle: 'italic',
  },
  occasionActionBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  occasionActionBtnVote: {
    backgroundColor: '#FF6B00',
  },
  occasionActionBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#FEFEFE',
  },
  occasionTop3Btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F2EE',
    borderRadius: 14,
  },
  occasionTop3BtnText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#8B7355',
  },
  occasionTop3BtnChevron: {
    fontSize: 18,
    color: '#8B7355',
  },
  pastEventLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#A0A0A0',
    fontStyle: 'italic',
  },
  // Create Occasion Button
  createOccasionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F6F3',
    borderWidth: 1.5,
    borderColor: '#E8E2DA',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 16,
  },
  createOccasionIcon: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#8B7355',
    marginRight: 8,
  },
  createOccasionText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#8B7355',
  },
  // Old Events Section (uses sectionDividerTouchable and sectionLabel styles)
  pastOccasionsContainer: {
    marginBottom: 8,
  },
  noPastOccasions: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#A0A0A0',
    textAlign: 'center',
    paddingVertical: 20,
  },
  pastOccasionCard: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  pastOccasionTypeIndicator: {
    width: 4,
    backgroundColor: '#8B7355',
  },
  pastOccasionContent: {
    flex: 1,
    padding: 12,
  },
  pastOccasionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#2D2D2D',
    marginBottom: 2,
  },
  pastOccasionDate: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#8B8B8B',
    marginBottom: 4,
  },
  pastOccasionMessage: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#6B6B6B',
    fontStyle: 'italic',
  },
  pastOccasionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pastOccasionHeaderLeft: {
    flex: 1,
  },
  pastOccasionChevron: {
    fontSize: 10,
    color: '#A0A0A0',
    marginLeft: 8,
    marginTop: 2,
  },
  pastOccasionExpanded: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  pastOccasionSummary: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  pastOccasionSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pastOccasionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pastOccasionSummaryText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#666666',
  },
  pastOccasionList: {
    marginBottom: 12,
  },
  pastOccasionListTitle: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#8B7355',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pastOccasionParticipant: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  pastOccasionAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pastOccasionAvatarYes: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  pastOccasionAvatarNo: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  pastOccasionAvatarText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#666666',
  },
  pastOccasionParticipantName: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#333333',
  },
  pastOccasionNoParticipants: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#A0A0A0',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  pastOccasionNames: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#333333',
    lineHeight: 18,
  },
  pastOccasionNobody: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#A0A0A0',
  },
  pastOccasionStats: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#A0A0A0',
  },
  // Occasion Type Selector
  occasionTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  occasionTypeOption: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F0EDE8',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  occasionTypeText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#6B6B6B',
  },
  // Search Results
  searchResults: {
    backgroundColor: '#F8F6F3',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E2DA',
  },
  searchResultName: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#2D2D2D',
  },
  addIcon: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#8B7355',
  },
  // Contacts Section
  contactsSection: {
    marginTop: 8,
    marginBottom: 12,
  },
  contactsHeader: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#8B8B8B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8F6F3',
    borderRadius: 10,
    marginBottom: 6,
  },
  contactItemSelected: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  contactName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#2D2D2D',
  },
  contactGroups: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#8B8B8B',
    marginRight: 8,
  },
  checkmark: {
    fontSize: 16,
    color: '#FF6B00',
    fontFamily: 'Inter_700Bold',
  },
  // Selected Participants
  selectedParticipants: {
    marginTop: 12,
    marginBottom: 8,
  },
  selectedHeader: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#8B8B8B',
    marginBottom: 8,
  },
  selectedChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  participantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B7355',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#FEFEFE',
    marginRight: 6,
  },
  chipRemove: {
    fontSize: 16,
    color: '#FEFEFE',
    opacity: 0.8,
  },
  // Bottom Actions -- designed action bar
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 34,
    backgroundColor: '#F6F4F1',
    borderTopWidth: 1,
    borderTopColor: '#EEEBE6',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#8B7355',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D5CFC7',
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FEFEFE',
  },
  actionButtonTextSecondary: {
    color: '#8B7355',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  simpleModal: {
    backgroundColor: '#FDFCFA',
    borderRadius: 28,
    padding: 28,
    width: screenWidth - 48,
    maxWidth: 380,
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 12,
  },
  simpleModalTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 6,
  },
  simpleModalSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8E2DA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginBottom: 24,
    backgroundColor: '#FAF8F5',
    minHeight: 52,
    textAlignVertical: 'center',
  },
  groupPhotoPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  groupPhotoPreview: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  groupPhotoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F0EDE8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E2DA',
    borderStyle: 'dashed',
  },
  groupPhotoLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#8B7355',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E8E2DA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
    marginBottom: 16,
    backgroundColor: '#FAFAF9',
    minHeight: 52,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#2D2D2D',
    marginBottom: 8,
  },
  simpleModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#F0EDE8',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#8B8580',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#8B7355',
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCC',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FEFEFE',
  },
  // Recipe Modal Styles
  recipeModalContent: {
    width: '92%',
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: '#FDFCFA',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  recipeModalHeader: {
    height: 180,
    backgroundColor: '#F8F6F3',
    position: 'relative',
  },
  recipeModalImage: {
    width: '100%',
    height: '100%',
  },
  recipeModalClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeModalCloseText: {
    fontSize: 18,
    color: '#2D2D2D',
  },
  recipeModalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    flexGrow: 1,
  },
  recipeModalTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#2D2D2D',
    marginBottom: 12,
  },
  recipeModalMeta: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  recipeModalMetaItem: {
    alignItems: 'center',
  },
  recipeModalMetaItemThird: {
    flex: 1,
    alignItems: 'center',
  },
  recipeModalMetaLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#8B8885',
    marginBottom: 2,
  },
  recipeModalMetaValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#8B7355',
  },
  recipeModalSection: {
    marginBottom: 16,
  },
  recipeModalSectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#2D2D2D',
    marginBottom: 8,
  },
  recipeModalDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    lineHeight: 20,
    marginBottom: 14,
  },
  recipeModalIngredient: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#4A4A4A',
    marginBottom: 4,
    lineHeight: 18,
  },
  recipeModalStep: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  recipeModalStepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E8845C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  recipeModalStepNumberText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter_600SemiBold',
    color: '#FEFEFE',
  },
  recipeModalStepText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#4A4A4A',
    lineHeight: 20,
  },
  // Swipe to leave styles
  swipeLeaveContainer: {
    backgroundColor: '#E53935',
    marginBottom: 14, // Match occasionCard marginBottom
    borderRadius: 20,
    marginLeft: -20, // Extend underneath the card
    paddingLeft: 20, // Compensate for the negative margin
  },
  swipeLeaveButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  swipeLeaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});

// ========================
// Occasion Wizard Styles
// ========================
const occasionWizardStyles = StyleSheet.create({
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0DCD7',
  },
  progressDotActive: {
    backgroundColor: '#8B7355',
    width: 24,
    borderRadius: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#6B6B6B',
    marginBottom: 6,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedDateLabel: {
    textAlign: 'center',
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#2D2D2D',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F5F2ED',
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  groupList: {
    maxHeight: 280,
    marginBottom: 4,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#F8F6F3',
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  groupItemSelected: {
    backgroundColor: '#FAF7F2',
    borderColor: '#8B7355',
  },
  groupItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  groupCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#D0CCC6',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#2D2D2D',
  },
  groupMemberCount: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#8B8B8B',
    marginTop: 1,
  },
  noGroupsText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#8B8B8B',
    textAlign: 'center',
    paddingVertical: 24,
    lineHeight: 20,
  },
  selectedCountLabel: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#8B7355',
    marginTop: 4,
    marginBottom: 4,
  },
});
