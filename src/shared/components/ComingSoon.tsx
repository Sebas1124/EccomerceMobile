import { Hammer } from 'lucide-react-native'
import { View } from 'react-native'
import { useColors } from '@/features/theme'
import { texts } from '@/shared/constants/texts'
import { AppText } from './AppText'
import { Screen } from './Screen'

export function ComingSoon({ title }: { title: string }) {
  const colors = useColors()
  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: 12, paddingVertical: 64 }}>
        <Hammer color={colors.mutedForeground} size={40} />
        <AppText variant="title">{title}</AppText>
        <AppText variant="muted" style={{ textAlign: 'center' }}>
          {texts.common.comingSoonDescription}
        </AppText>
      </View>
    </Screen>
  )
}
