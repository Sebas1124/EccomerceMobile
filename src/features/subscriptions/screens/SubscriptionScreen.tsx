import { router } from 'expo-router'
import { Check, CreditCard, Sparkles, TriangleAlert } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useAuthStore } from '@/features/auth'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Screen } from '@/shared/components/Screen'
import { confirm, notify } from '@/shared/feedback'
import { formatDate, formatPrice } from '@/shared/lib/format'
import { radius, spacing } from '@/shared/theme/tokens'
import { subscriptionsApi } from '../api/subscriptions-api'
import { BenefitsList } from '../components/BenefitsList'
import { subscriptionsTexts as t } from '../texts'
import type { MySubscription, PublicPlan } from '../types'

/**
 * Planes de socio y la suscripción propia.
 *
 * El escaparate se ve sin sesión —es lo que convence— y al elegir un plan se
 * pasa por el login. Quien ya es socio ve lo suyo arriba del todo.
 */
export function SubscriptionScreen() {
  const colors = useColors()
  const authenticated = useAuthStore((state) => state.status === 'authenticated')
  const [plans, setPlans] = useState<PublicPlan[] | null>(null)
  const [mine, setMine] = useState<MySubscription | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    subscriptionsApi
      .plans()
      .then(({ items }) => {
        if (alive) setPlans(items)
      })
      .catch((error: unknown) => {
        if (!alive) return
        notify.fromError(error, t.loadError)
        setPlans([])
      })

    if (authenticated) {
      subscriptionsApi
        .mine()
        .then(({ subscription }) => {
          if (alive) setMine(subscription)
        })
        // Sin suscripción no hay nada que enseñar arriba; los planes siguen.
        .catch(() => undefined)
    }

    return () => {
      alive = false
    }
  }, [authenticated])

  const subscribe = async (plan: PublicPlan) => {
    if (!authenticated) {
      notify.info(t.signIn)
      router.push('/login')
      return
    }
    setBusy(plan.id)
    try {
      const { subscription } = await subscriptionsApi.subscribe(plan.id)
      setMine(subscription)
      notify.success(t.subscribed(plan.name))
    } catch (error) {
      notify.fromError(error, t.subscribeError)
    } finally {
      setBusy(null)
    }
  }

  const cancel = () =>
    confirm({
      title: t.cancelTitle,
      description: t.cancelConfirm,
      tone: 'warning',
      confirmLabel: t.cancel,
      action: async () => {
        try {
          await subscriptionsApi.cancel()
          setMine(null)
          notify.success(t.cancelled)
        } catch (error) {
          notify.fromError(error, t.cancelError)
        }
      },
    })

  return (
    <Screen>
      <View style={{ gap: spacing.xs, paddingTop: spacing.lg }}>
        <View style={styles.heading}>
          <Sparkles color={colors.primary} size={22} />
          <AppText variant="title">{t.title}</AppText>
        </View>
        <AppText variant="muted">{t.subtitle}</AppText>
      </View>

      {mine && (
        <Card
          title={t.mine}
          description={`${t.since(formatDate(mine.startedAt))} · ${t.renews(formatDate(mine.renewsAt))}`}
        >
          {mine.status === 'PAST_DUE' && (
            <View style={styles.warning}>
              <TriangleAlert color={colors.destructive} size={16} />
              <AppText variant="error" style={{ flex: 1, fontSize: 13 }}>
                {t.statusPastDue}
              </AppText>
            </View>
          )}
          {mine.status === 'PAUSED' && (
            <View style={styles.warning}>
              <TriangleAlert color={colors.warning} size={16} />
              <AppText variant="muted" style={{ flex: 1, fontSize: 13 }}>
                {t.statusPaused}
              </AppText>
            </View>
          )}

          <View style={styles.priceRow}>
            <AppText variant="title">{formatPrice(mine.priceCents)}</AppText>
            <AppText variant="muted">{t.perMonth}</AppText>
          </View>

          <BenefitsList benefits={mine.benefits} />

          {mine.providerId === 'manual' && (
            <View style={styles.note}>
              <CreditCard color={colors.mutedForeground} size={14} />
              <AppText variant="muted" style={{ flex: 1, fontSize: 12 }}>
                {t.manual}
              </AppText>
            </View>
          )}

          <Button label={t.cancel} variant="ghost" onPress={() => void cancel()} />
        </Card>
      )}

      {plans?.length === 0 && <AppText variant="muted">{t.empty}</AppText>}

      {plans?.map((plan, index) => {
        const isCurrent = mine?.plan.id === plan.id
        return (
          <Animated.View key={plan.id} entering={FadeInDown.delay(index * 60).duration(260)}>
            <Card
              title={plan.name}
              description={plan.description}
              // El plan contratado se destaca: es lo que se busca al entrar.
              style={isCurrent ? { borderColor: colors.primary } : undefined}
            >
              <View style={styles.priceRow}>
                <AppText variant="title">{formatPrice(plan.priceCents)}</AppText>
                <AppText variant="muted">{t.perMonth}</AppText>
              </View>

              <BenefitsList benefits={plan.benefits} />

              <Button
                label={isCurrent ? t.current : t.choose}
                icon={isCurrent ? Check : undefined}
                variant={isCurrent ? 'outline' : 'primary'}
                loading={busy === plan.id}
                // Con una suscripción viva no se puede contratar otra: hay que
                // darse de baja antes, y el servidor lo rechaza igual.
                disabled={isCurrent || busy !== null || mine !== null}
                haptic="success"
                onPress={() => void subscribe(plan)}
              />
            </Card>
          </Animated.View>
        )
      })}
    </Screen>
  )
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  note: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
})
