import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { lightHaptic } from '../../lib/haptics';

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 12;

export default function ServingSelector({ count, onChange }) {
  const { t } = useTranslation();

  const decrease = () => {
    if (count > MIN_SERVINGS) {
      lightHaptic();
      onChange(count - 1);
    }
  };

  const increase = () => {
    if (count < MAX_SERVINGS) {
      lightHaptic();
      onChange(count + 1);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, count <= MIN_SERVINGS && styles.buttonDisabled]}
        onPress={decrease}
        activeOpacity={0.7}
        disabled={count <= MIN_SERVINGS}
      >
        <Text style={[styles.buttonText, count <= MIN_SERVINGS && styles.buttonTextDisabled]}>−</Text>
      </TouchableOpacity>

      <Text style={styles.label}>
        {count} {t('recipes.servings')}
      </Text>

      <TouchableOpacity
        style={[styles.button, count >= MAX_SERVINGS && styles.buttonDisabled]}
        onPress={increase}
        activeOpacity={0.7}
        disabled={count >= MAX_SERVINGS}
      >
        <Text style={[styles.buttonText, count >= MAX_SERVINGS && styles.buttonTextDisabled]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F2EE',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 16,
  },
  button: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#8B7355',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#D5CFC7',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#FEFEFE',
    lineHeight: 20,
  },
  buttonTextDisabled: {
    color: '#F5F2EE',
  },
  label: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#2D2D2D',
    minWidth: 100,
    textAlign: 'center',
  },
});
