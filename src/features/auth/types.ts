export type Role = 'SUPERADMIN' | 'ADMIN' | 'CUSTOMER'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: Role
  status: 'ACTIVE' | 'PENDING_DELETION' | 'DELETED' | 'BLOCKED'
  emailVerified: boolean
  twoFactorEnabled: boolean
  createdAt: string
}

export interface Device {
  id: string
  name: string
  platform: string
  trusted: boolean
  lastSeenAt: string
  createdAt: string
  activeSessions: number
  current: boolean
}

export interface LoginValues {
  email: string
  password: string
  trustDevice: boolean
}

export interface RegisterValues {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}
