import { Image } from 'expo-image'
import { useEffect, useRef } from 'react'
import { Linking, Pressable, ScrollView, View } from 'react-native'
import { AppText } from '@/shared/components/AppText'
import { spacing } from '@/shared/theme/tokens'
import type { BrandsConfig } from '../types'

/** Ancho de cada logo; se usa para saber cuánto medir la tira. */
const LOGO_WIDTH = 108

/**
 * Tira de marcas.
 *
 * En la web se mueve sola con CSS. Aquí **no**: en una pantalla de móvil una
 * tira que se desplaza sola compite con el dedo —el gesto natural es arrastrar
 * y, si el contenido ya se mueve, pelean— y además mantiene vivo un bucle de
 * animación mientras la portada esté abierta.
 *
 * Así que se deja un carrusel que se arrastra, con un empujón inicial para que
 * se note que hay más a la derecha. Es lo mismo que resuelve el `animate` de la
 * web: decir que hay más marcas de las que caben.
 */
export function BrandsStrip({ config }: { config: BrandsConfig }) {
  const scroller = useRef<ScrollView>(null)

  useEffect(() => {
    if (!config.animate || config.items.length < 3) return
    // Un empujón corto y de vuelta: enseña que la tira se mueve sin robarle el
    // control a nadie.
    const nudge = setTimeout(() => {
      scroller.current?.scrollTo({ x: LOGO_WIDTH / 2, animated: true })
      setTimeout(() => scroller.current?.scrollTo({ x: 0, animated: true }), 550)
    }, 700)
    return () => clearTimeout(nudge)
  }, [config.animate, config.items.length])

  if (config.items.length === 0) return null

  return (
    <View style={{ gap: spacing.sm }}>
      {config.title && <AppText variant="subtitle">{config.title}</AppText>}

      <ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.lg, alignItems: 'center' }}
      >
        {config.items.map((item, index) => {
          const logo = (
            <Image
              source={{ uri: item.imageUrl }}
              accessibilityLabel={item.name}
              contentFit="contain"
              transition={150}
              style={{ width: LOGO_WIDTH, height: 48, opacity: 0.85 }}
            />
          )

          return item.href ? (
            <Pressable
              key={`${item.name}-${index}`}
              accessibilityRole="link"
              accessibilityLabel={item.name}
              onPress={() => void Linking.openURL(item.href!)}
            >
              {logo}
            </Pressable>
          ) : (
            <View key={`${item.name}-${index}`}>{logo}</View>
          )
        })}
      </ScrollView>
    </View>
  )
}
