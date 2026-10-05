export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'

export interface OrderItem {
  id: string
  variantId: string | null
  nameSnapshot: string
  variantSnapshot: string
  skuSnapshot: string
  unitPriceCents: number
  qty: number
  vatRate: number
  lineTotalCents: number
}

export interface OrderStatusChange {
  id: string
  from: OrderStatus | null
  to: OrderStatus
  note: string | null
  createdAt: string
  actor: { id: string; firstName: string; lastName: string } | null
}

export interface OrderAddress {
  fullName: string
  street: string
  city: string
  postalCode: string
  province?: string | null
  country: string
  phone?: string | null
  notes?: string | null
}

export interface Shipment {
  id: string
  providerId: string
  trackingNumber: string
  trackingUrl: string | null
  status: 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'EXCEPTION' | 'CANCELED'
}

export interface Order {
  id: string
  number: string
  status: OrderStatus
  subtotalCents: number
  discountCents: number
  shippingCents: number
  vatCents: number
  totalCents: number
  taxBreakdown: { rate: number; baseCents: number; taxCents: number }[]
  shippingAddress: OrderAddress | null
  paymentMethod: string
  placedAt: string
  items: OrderItem[]
  history: OrderStatusChange[]
  shipments?: Shipment[]
}
