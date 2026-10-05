import {
  Headset,
  MessagesSquare,
  House,
  LayoutGrid,
  MapPin,
  Package,
  RotateCcw,
  Scale,
  ShoppingCart,
  UserCog,
} from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'
import type { Href } from 'expo-router'
import { FeatureKey } from '@/features/app-config'

export interface NavItem {
  href: Href
  label: string
  icon: LucideIcon
  /** Solo aparece con esta feature activa. */
  feature?: FeatureKey
  /** Solo con sesión iniciada. */
  private?: boolean
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

/** La tienda: lo mismo que las pestañas, para poder saltar desde cualquier sitio. */
const store: NavItem[] = [
  { href: '/', label: 'Inicio', icon: House },
  { href: '/catalog', label: 'Catálogo', icon: LayoutGrid },
  { href: '/cart', label: 'Carrito', icon: ShoppingCart },
]

/** Lo de la cuenta: antes eran botones apilados dentro de la pantalla. */
const account: NavItem[] = [
  { href: '/perfil', label: 'Mis datos', icon: UserCog, private: true },
  { href: '/pedidos', label: 'Mis pedidos', icon: Package, private: true },
  { href: '/direcciones', label: 'Direcciones', icon: MapPin, private: true },
  {
    href: '/devoluciones',
    label: 'Devoluciones',
    icon: RotateCcw,
    feature: FeatureKey.Returns,
    private: true,
  },
  {
    href: '/soporte',
    label: 'Soporte',
    icon: Headset,
    feature: FeatureKey.Tickets,
    private: true,
  },
  {
    href: '/chat',
    label: 'Chat con la tienda',
    icon: MessagesSquare,
    feature: FeatureKey.Chat,
    private: true,
  },
]

const info: NavItem[] = [{ href: '/legal', label: 'Información legal', icon: Scale }]

export const navGroups: NavGroup[] = [
  { title: 'Tienda', items: store },
  { title: 'Mi cuenta', items: account },
  { title: 'Información', items: info },
]
