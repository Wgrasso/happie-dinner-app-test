import React, { useState, useRef, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Dimensions, FlatList, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../lib/ThemeContext';
const { width } = Dimensions.get('window');

const STEPS = [
  {
    icon: 'users',
    title: 'Maak een groep',
    desc: 'Start een groep voor jouw studentenhuis. Nodig je huisgenoten uit met de groepscode.',
  },
  {
    icon: 'check-circle',
    title: 'Wie eet er mee?',
    desc: 'Elke dag klik je op "ja" of "nee". Zo weet iedereen wie er mee-eet.',
  },
  {
    icon: 'thumbs-up',
    title: 'Stem op gerechten',
    desc: 'Swipe door recepten en stem op wat je wilt eten. Het gerecht met de meeste stemmen wint!',
  },
  {
    icon: 'award',
    title: 'Word een Chef',
    desc: 'Maak je eigen chef profiel aan op het profiel-tabblad. Kies of je als chef of als huis post.',
  },
  {
    icon: 'share-2',
    title: 'Deel je recepten',
    desc: 'Plaats recepten en kies wie ze kan zien: alleen jij, iedereen, of specifieke groepen. Gedeelde recepten komen automatisch in de stemronde!',
  },
];

export default function OnboardingModal({ visible, onDone }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleNext = () => {
    if (currentIndex < STEPS.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      AsyncStorage.setItem('hasSeenOnboarding', 'true').catch(() => {});
      onDone();
    }
  };

  const handleSkip = () => {
    AsyncStorage.setItem('hasSeenOnboarding', 'true').catch(() => {});
    onDone();
  };

  const renderStep = ({ item }) => (
    <View style={styles.step}>
      <View style={styles.iconCircle}>
        <Feather name={item.icon} size={40} color={theme.colors.secondary} />
      </View>
      <Text style={styles.stepTitle}>{item.title}</Text>
      <Text style={styles.stepDesc}>{item.desc}</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Overslaan</Text>
          </TouchableOpacity>

          <FlatList
            ref={flatListRef}
            data={STEPS}
            renderItem={renderStep}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            keyExtractor={(_, i) => String(i)}
          />

          <View style={styles.footer}>
            <View style={styles.dots}>
              {STEPS.map((_, i) => (
                <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
              ))}
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextText}>
                {currentIndex < STEPS.length - 1 ? 'Volgende' : 'Aan de slag!'}
              </Text>
            </TouchableOpacity>
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
    overflow: 'hidden',
    paddingBottom: theme.spacing.xl,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    padding: theme.spacing.base,
    paddingBottom: 0,
  },
  skipText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.tabBarInactive,
  },
  step: {
    width: width - 48,
    alignItems: 'center',
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  stepTitle: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize['3xl'],
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  stepDesc: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: theme.spacing['2xl'],
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.border,
  },
  dotActive: {
    backgroundColor: theme.colors.secondary,
    width: 24,
  },
  nextBtn: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.base,
    paddingVertical: theme.spacing.base,
    width: '100%',
    alignItems: 'center',
  },
  nextText: {
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.background,
  },
});
