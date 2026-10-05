import { Frown, Heart, PartyPopper, Smile, Sparkles, ThumbsUp } from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'
import { chatTexts as t } from '../texts'
import type { ChatReactionKind } from '../api/chat-api'

/**
 * Catálogo cerrado de reacciones.
 *
 * Son iconos de Lucide, no emojis: lo pide el proyecto y además cierra la
 * puerta a que alguien mande cualquier cosa. El servidor valida contra el
 * mismo enum, así que esta lista no es la única defensa.
 */
export const REACTIONS: { kind: ChatReactionKind; icon: LucideIcon; label: string }[] = [
  { kind: 'LIKE', icon: ThumbsUp, label: t.reactions.LIKE },
  { kind: 'LOVE', icon: Heart, label: t.reactions.LOVE },
  { kind: 'THANKS', icon: PartyPopper, label: t.reactions.THANKS },
  { kind: 'SMILE', icon: Smile, label: t.reactions.SMILE },
  { kind: 'WOW', icon: Sparkles, label: t.reactions.WOW },
  { kind: 'SAD', icon: Frown, label: t.reactions.SAD },
]

export const iconOf = (kind: ChatReactionKind) =>
  REACTIONS.find((one) => one.kind === kind)?.icon ?? ThumbsUp
