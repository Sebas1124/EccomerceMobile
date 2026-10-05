import { Tabs } from 'expo-router'
import { View } from 'react-native'
import { House, LayoutGrid, ShoppingCart, User } from 'lucide-react-native'
import { useBranding } from '@/features/app-config'
import { ThemeToggle, useColors } from '@/features/theme'
import { texts } from '@/shared/constants/texts'
import { haptics } from '@/shared/feedback'
import { NotificationBellButton } from '@/features/notifications'
import { DrawerButton } from '@/shared/navigation'

export default function TabsLayout() {
  const colors = useColors()
  const branding = useBranding()

  return (
    <Tabs
      screenListeners={{ tabPress: () => void haptics.trigger('selection') }}
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerShadowVisible: false,
        headerLeft: () => <DrawerButton />,
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <NotificationBellButton />
            <ThemeToggle />
          </View>
        ),
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        animation: 'fade',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: texts.tabs.home,
          headerTitle: branding.appName,
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: texts.tabs.catalog,
          tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: texts.tabs.cart,
          tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: texts.tabs.account,
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
