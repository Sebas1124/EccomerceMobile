import type { User } from '@/features/auth'

export type AddressKind = 'SHIPPING' | 'BILLING'
export type DeletionStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'

export interface Address {
  id: string
  kind: AddressKind
  label: string | null
  fullName: string
  street: string
  street2: string | null
  city: string
  province: string | null
  postalCode: string
  /** ISO 3166-1 alpha-2. */
  country: string
  phone: string | null
  notes: string | null
  isDefault: boolean
  createdAt: string
}

export interface AddressPayload {
  kind: AddressKind
  label: string | null
  fullName: string
  street: string
  street2: string | null
  city: string
  province: string | null
  postalCode: string
  country: string
  phone: string | null
  notes: string | null
  isDefault: boolean
}

export interface AddressValues {
  label: string
  fullName: string
  street: string
  postalCode: string
  city: string
  province: string
  phone: string
}

export interface DeletionRequest {
  status: DeletionStatus
  reason: string | null
  purgeAt: string
  confirmedAt: string | null
  createdAt: string
}

export interface AccountOverview {
  user: User
  pendingEmail: { newEmail: string; createdAt: string } | null
  deletionRequest: DeletionRequest | null
}

export interface ProfileValues {
  firstName: string
  lastName: string
  phone: string
}
