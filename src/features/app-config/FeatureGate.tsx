import type { ReactNode } from 'react'
import type { FeatureKey } from './types'
import { useFeature } from './app-config-store'

export function FeatureGate({
  feature,
  children,
  fallback = null,
}: {
  feature: FeatureKey
  children: ReactNode
  fallback?: ReactNode
}) {
  return useFeature(feature) ? children : fallback
}
