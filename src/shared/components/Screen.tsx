import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useColors } from '@/features/theme'
import { spacing } from '@/shared/theme/tokens'

/** Contenedor base de pantalla: fondo del tema, safe area, teclado, scroll y entrada animada. */
export function Screen({ children, centered = false }: { children: ReactNode; centered?: boolean }) {
  const colors = useColors()
  return (
    <SafeAreaView edges={['left', 'right']} style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, centered && styles.centered]}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.duration(300)} style={{ gap: spacing.lg }}>
            {children}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  centered: { flexGrow: 1, justifyContent: 'center' },
})
