import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getGroupRecipes } from '../lib/recipesService';
import { lightHaptic } from '../lib/haptics';
import ServingSelector from './ui/ServingSelector';
import { scaleIngredients } from '../lib/ingredientScaler';
import { getRecipeExtras } from '../lib/recipeExtrasService';
import { useTheme } from '../lib/ThemeContext';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1546548970-71785318a17b?w=400&h=300&fit=crop';

const formatTime = (minutes) => {
  if (!minutes) return '30 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
};

export default function GroupRecipesScreen({ visible, onClose, groupId, groupName }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Recipe detail modal
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailAnimation] = useState(new Animated.Value(0));
  const [servingCount, setServingCount] = useState(4);

  useEffect(() => {
    if (visible && groupId) {
      setLoading(true);
      getGroupRecipes(groupId).then((result) => {
        if (result.success) setRecipes(result.recipes || []);
        setLoading(false);
      });
    }
  }, [visible, groupId]);

  const openDetail = (recipe) => {
    lightHaptic();
    const extras = getRecipeExtras(recipe?.name);
    setServingCount(extras.default_servings);
    setSelectedRecipe(recipe);
    setDetailVisible(true);
    Animated.spring(detailAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const closeDetail = () => {
    Animated.spring(detailAnimation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setDetailVisible(false);
      setSelectedRecipe(null);
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{t('groups.groupRecipes') || 'Groepsrecepten'}</Text>
              <Text style={styles.subtitle}>{groupName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
          ) : recipes.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="food-off" size={48} color={theme.colors.buttonDisabled} />
              <Text style={styles.emptyText}>
                {t('groups.noGroupRecipes') || 'Nog geen recepten gedeeld met deze groep'}
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
              {recipes.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={styles.recipeCard}
                  onPress={() => openDetail(r)}
                  activeOpacity={0.9}
                >
                  <ExpoImage
                    source={{ uri: r.image || PLACEHOLDER_IMAGE }}
                    style={styles.cardImage}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{r.name}</Text>
                    <View style={styles.cardMeta}>
                      <Text style={styles.cardTime}>{formatTime(r.cooking_time_minutes)}</Text>
                      {r.chef?.name && (
                        <Text style={styles.cardChef}>@{r.chef.tag || r.chef.name}</Text>
                      )}
                    </View>
                    {r.description ? (
                      <Text style={styles.cardDesc} numberOfLines={2}>{r.description}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>
          )}
        </View>
      </View>

      {/* Recipe Detail Modal */}
      <Modal visible={detailVisible} transparent animationType="none" onRequestClose={closeDetail}>
        <View style={styles.detailOverlay}>
          <TouchableOpacity style={styles.detailBg} activeOpacity={1} onPress={closeDetail} />
          <Animated.View
            style={[
              styles.detailContent,
              {
                transform: [{
                  scale: detailAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                }],
                opacity: detailAnimation,
              },
            ]}
          >
            <View style={styles.detailHeader}>
              <TouchableOpacity style={styles.detailBackBtn} onPress={closeDetail}>
                <Text style={styles.detailBackArrow}>←</Text>
                <Text style={styles.detailBackText}>Terug</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedRecipe?.image && (
                <ExpoImage
                  source={{ uri: selectedRecipe.image }}
                  style={styles.detailImage}
                  contentFit="cover"
                />
              )}
              <View style={styles.detailBody}>
                <Text style={styles.detailTitle}>{selectedRecipe?.name}</Text>
                {selectedRecipe?.chef?.name && (
                  <Text style={styles.detailChef}>
                    {t('ideas.by') || 'door'} @{selectedRecipe.chef.tag || selectedRecipe.chef.name}
                  </Text>
                )}

                <View style={styles.detailMetaRow}>
                  <View style={styles.detailMetaItem}>
                    <Feather name="clock" size={14} color={theme.colors.primary} />
                    <Text style={styles.detailMeta}>{formatTime(selectedRecipe?.cooking_time_minutes)}</Text>
                  </View>
                  {selectedRecipe?.estimated_cost != null && (
                    <View style={styles.detailMetaItem}>
                      <Feather name="tag" size={14} color={theme.colors.success} />
                      <Text style={[styles.detailMeta, { color: theme.colors.success }]}>€{Number(selectedRecipe.estimated_cost).toFixed(2)}</Text>
                    </View>
                  )}
                  {selectedRecipe?.cuisine_type && (
                    <View style={styles.detailMetaItem}>
                      <Text style={styles.detailMeta}>{selectedRecipe.cuisine_type}</Text>
                    </View>
                  )}
                </View>

                {selectedRecipe?.description && (
                  <Text style={styles.detailDesc}>{selectedRecipe.description}</Text>
                )}

                {selectedRecipe?.ingredients?.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>{t('recipes.ingredients') || 'Ingrediënten'}</Text>
                    <ServingSelector count={servingCount} onChange={setServingCount} />
                    {scaleIngredients(
                      selectedRecipe.ingredients,
                      getRecipeExtras(selectedRecipe.name).default_servings,
                      servingCount
                    ).map((ing, i) => (
                      <Text key={i} style={styles.detailIngredient}>• {ing}</Text>
                    ))}
                  </View>
                )}
                {selectedRecipe?.steps?.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>{t('recipes.instructions') || 'Stappen'}</Text>
                    {selectedRecipe.steps.map((step, i) => (
                      <View key={i} style={styles.detailStepRow}>
                        <View style={styles.detailStepNumber}>
                          <Text style={styles.detailStepNumberText}>{i + 1}</Text>
                        </View>
                        <Text style={styles.detailStep}>{step}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </Modal>
  );
}

const createStyles = (theme) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  container: { backgroundColor: theme.colors.surfaceWarm, borderTopLeftRadius: theme.borderRadius['2xl'], borderTopRightRadius: theme.borderRadius['2xl'], maxHeight: '85%', minHeight: 300, paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  title: { fontSize: theme.typography.fontSize['2xl'], fontWeight: '700', color: theme.colors.text },
  subtitle: { fontSize: theme.typography.fontSize.sm + 1, color: theme.colors.primary, marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: theme.borderRadius.lg, backgroundColor: theme.colors.borderSubtle, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingTop: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyText: { fontSize: theme.typography.fontSize.md, color: theme.colors.primary, marginTop: 12, textAlign: 'center', paddingHorizontal: 30 },

  // Recipe cards
  recipeCard: { backgroundColor: theme.colors.modal, borderRadius: theme.borderRadius.base, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  cardImage: { width: '100%', height: 150 },
  cardContent: { padding: 12 },
  cardTitle: { fontSize: theme.typography.fontSize.lg, fontWeight: '600', color: theme.colors.text },
  cardMeta: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cardTime: { fontSize: theme.typography.fontSize.sm, color: theme.colors.primary },
  cardChef: { fontSize: theme.typography.fontSize.sm, color: theme.colors.secondary, fontWeight: '500' },
  cardDesc: { fontSize: theme.typography.fontSize.sm + 1, color: theme.colors.textSecondary, marginTop: 4, lineHeight: 18 },

  // Detail modal
  detailOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  detailBg: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlay },
  detailContent: { backgroundColor: theme.colors.surfaceWarm, borderRadius: theme.borderRadius['2xl'], width: '100%', maxHeight: '90%', overflow: 'hidden' },
  detailHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  detailBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailBackArrow: { fontSize: theme.typography.fontSize["2xl"], color: theme.colors.primary },
  detailBackText: { fontSize: theme.typography.fontSize.base, color: theme.colors.primary, fontWeight: '500' },
  detailImage: { width: '100%', height: 220 },
  detailBody: { padding: 20 },
  detailTitle: { fontSize: theme.typography.fontSize['2xl'] + 2, fontWeight: '700', color: theme.colors.text },
  detailChef: { fontSize: theme.typography.fontSize.md, color: theme.colors.secondary, fontWeight: '500', marginTop: 4 },
  detailMetaRow: { flexDirection: 'row', gap: 16, marginTop: 10, flexWrap: 'wrap' },
  detailMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailMeta: { fontSize: theme.typography.fontSize.sm + 1, color: theme.colors.primary, fontWeight: '500' },
  detailDesc: { fontSize: theme.typography.fontSize.md, color: theme.colors.textSecondary, marginTop: 12, lineHeight: 20 },
  detailSection: { marginTop: 18 },
  detailSectionTitle: { fontSize: theme.typography.fontSize.lg, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  detailIngredient: { fontSize: theme.typography.fontSize.md, color: theme.colors.textSecondary, lineHeight: 22 },
  detailStepRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' },
  detailStepNumber: { width: 26, height: 26, borderRadius: theme.borderRadius.base, backgroundColor: theme.colors.secondary, alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 1 },
  detailStepNumberText: { fontSize: theme.typography.fontSize.md, fontWeight: '700', color: theme.colors.textInverse },
  detailStep: { fontSize: theme.typography.fontSize.md, color: theme.colors.textSecondary, lineHeight: 22, flex: 1 },
});
