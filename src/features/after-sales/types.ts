export type ReturnStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'RECEIVED'
  | 'REFUNDED'
  | 'CANCELLED'

export type ReturnShippingPayer = 'CUSTOMER' | 'STORE'

export interface ResolvedPolicy {
  id: string | null
  name: string
  windowDays: number
  feePercent: number
  returnShippingPaidBy: ReturnShippingPayer
  conditions: string | null
}

/** Una línea del pedido, con lo que queda por devolver. */
export interface ReturnableItem {
  orderItemId: string
  nameSnapshot: string
  variantSnapshot: string
  unitPriceCents: number
  qty: number
  returnableQty: number
  policy: ResolvedPolicy | null
  deadline: string | null
  canRequest: boolean
}

export interface ReturnableOrder {
  orderId: string
  number: string
  status: string
  items: ReturnableItem[]
}

export interface ReturnRequest {
  id: string
  qty: number
  reason: string
  status: ReturnStatus
  adminNote: string | null
  refundedCents: number
  createdAt: string
  orderItem: { nameSnapshot: string; variantSnapshot: string; unitPriceCents: number; qty: number }
  order: { id: string; number: string; status: string; placedAt: string }
}
