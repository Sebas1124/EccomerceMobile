import {
  BadgePercent,
  Cake,
  CalendarClock,
  Gift,
  Headset,
  PiggyBank,
  Repeat,
  RotateCcw,
  ShoppingBasket,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react-native'
import { formatPrice } from '@/shared/lib/format'
import { subscriptionsTexts as t } from '../texts'
import type { SubscriptionBenefits } from '../types'

export interface BenefitLine {
  key: string
  icon: LucideIcon
  label: string
}

/**
 * Las ventajas activas de un plan, en el orden en que se cuentan.
 *
 * A quien compra no se le dice cómo se cumple cada una —eso está en el panel—:
 * aquí solo importa qué incluye el plan.
 */
export function benefitLines(benefits: SubscriptionBenefits): BenefitLine[] {
  const lines: BenefitLine[] = []
  const b = t.benefits

  if (benefits.freeShipping === 'always') {
    lines.push({ key: 'shipping', icon: Truck, label: b.freeShippingAlways })
  } else if (benefits.freeShipping === 'threshold' && benefits.freeShippingFromCents > 0) {
    lines.push({
      key: 'shipping',
      icon: Truck,
      label: b.freeShippingFrom(formatPrice(benefits.freeShippingFromCents)),
    })
  }

  if (benefits.discountPercent > 0) {
    lines.push({
      key: 'discount',
      icon: BadgePercent,
      label: b.discount(benefits.discountPercent),
    })
  }

  if (benefits.monthlyCouponCents > 0) {
    lines.push({
      key: 'monthly-coupon',
      icon: Gift,
      label: b.monthlyCoupon(formatPrice(benefits.monthlyCouponCents)),
    })
  }

  if (benefits.extraReturnDays > 0) {
    lines.push({
      key: 'returns',
      icon: RotateCcw,
      label: b.extraReturnDays(benefits.extraReturnDays),
    })
  }

  if (benefits.earlyAccessHours > 0) {
    lines.push({
      key: 'early',
      icon: CalendarClock,
      label: b.earlyAccess(benefits.earlyAccessHours),
    })
  }

  if (benefits.cashbackPercent > 0) {
    lines.push({
      key: 'cashback',
      icon: PiggyBank,
      label: b.cashback(benefits.cashbackPercent),
    })
  }

  if (benefits.prioritySupport) {
    lines.push({ key: 'support', icon: Headset, label: b.prioritySupport })
  }

  if (benefits.noMinimumOrder) {
    lines.push({ key: 'no-minimum', icon: ShoppingBasket, label: b.noMinimumOrder })
  }

  if (benefits.birthdayGiftCents > 0) {
    lines.push({
      key: 'birthday',
      icon: Cake,
      label: b.birthdayGift(formatPrice(benefits.birthdayGiftCents)),
    })
  }

  if (benefits.guests > 0) {
    lines.push({ key: 'guests', icon: Users, label: b.guests(benefits.guests) })
  }

  if (benefits.recurringOrders > 0) {
    lines.push({
      key: 'recurring',
      icon: Repeat,
      label: b.recurringOrders(benefits.recurringOrders),
    })
  }

  return lines
}
