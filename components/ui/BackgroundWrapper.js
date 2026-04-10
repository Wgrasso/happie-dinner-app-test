import React from 'react';
import { ImageBackground, StyleSheet } from 'react-native';

const textures = {
  background: require('../../assets/background-pattern.jpg'),
  surface: require('../../assets/linen-textures/surface.png'),
  surfaceAlt: require('../../assets/linen-textures/surface-alt.png'),
  card: require('../../assets/linen-textures/card.png'),
  success: require('../../assets/linen-textures/success.png'),
  successLight: require('../../assets/linen-textures/success-light.png'),
  error: require('../../assets/linen-textures/error.png'),
  primary: require('../../assets/linen-textures/primary.png'),
  white: require('../../assets/linen-textures/background.png'),
};

/**
 * Wraps children in a linen-textured background.
 * @param {'background'|'surface'|'surfaceAlt'|'card'|'success'|'successLight'|'error'|'primary'} variant
 */
export default function BackgroundWrapper({ children, style, variant = 'background' }) {
  return (
    <ImageBackground
      source={textures[variant] || textures.background}
      style={[styles.background, style]}
      imageStyle={style?.borderRadius != null ? { borderRadius: style.borderRadius } : undefined}
      resizeMode="cover"
    >
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    overflow: 'hidden',
  },
});
