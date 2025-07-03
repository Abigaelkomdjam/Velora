// components/AnimatedScreen.tsx
import { MotiView } from 'moti';
import React, { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';

export function AnimatedScreen({ children }: PropsWithChildren<{}>) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: -20 }}
      transition={{ type: 'timing', duration: 500 }}
      style={styles.container}
    >
      {children}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
