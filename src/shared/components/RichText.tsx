import { Fragment } from 'react'
import { Linking, StyleSheet, View } from 'react-native'
import { useColors } from '@/features/theme'
import { spacing } from '@/shared/theme/tokens'
import { AppText } from './AppText'

/**
 * Pinta el HTML que escribe el panel con componentes nativos, sin WebView.
 * El servidor lo sanea con lista blanca, así que aquí solo hay que entender
 * ese puñado de etiquetas; cualquier otra se degrada a texto normal.
 */

/** Un trozo de texto con el formato que arrastra. */
interface Piece {
  text: string
  bold?: boolean
  italic?: boolean
  href?: string
}

/** Bloque de nivel superior ya interpretado. */
type Block =
  | { kind: 'h2' | 'h3' | 'p'; pieces: Piece[] }
  | { kind: 'li'; pieces: Piece[]; marker: string }
  | { kind: 'hr' }

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  '#39': "'",
  nbsp: ' ',
  ldquo: '“',
  rdquo: '”',
  hellip: '…',
  eacute: 'é',
  iacute: 'í',
  oacute: 'ó',
  aacute: 'á',
  uacute: 'ú',
  ntilde: 'ñ',
}

const decode = (value: string) =>
  value.replace(/&(#?\w+);/g, (match, name: string) => ENTITIES[name] ?? match)

/** Parte el contenido de un bloque en trozos con su formato. */
function toPieces(html: string): Piece[] {
  const pieces: Piece[] = []
  // Se recorre el HTML abriendo y cerrando etiquetas en línea; la pila lleva
  // el formato activo en cada momento.
  const stack: { bold: boolean; italic: boolean; href?: string }[] = [
    { bold: false, italic: false },
  ]
  const pattern = /<(\/?)(strong|b|em|i|u|a|code|br)([^>]*)>/gi
  let index = 0

  const push = (raw: string) => {
    const text = decode(raw.replace(/<[^>]+>/g, ''))
    if (!text) return
    const top = stack[stack.length - 1]!
    pieces.push({ text, bold: top.bold, italic: top.italic, href: top.href })
  }

  for (let match = pattern.exec(html); match; match = pattern.exec(html)) {
    push(html.slice(index, match.index))
    index = match.index + match[0].length

    const [, closing, tag, attrs] = match
    const name = tag!.toLowerCase()
    if (name === 'br') {
      pieces.push({ text: '\n' })
      continue
    }
    if (closing) {
      if (stack.length > 1) stack.pop()
      continue
    }
    const top = stack[stack.length - 1]!
    stack.push({
      bold: top.bold || name === 'strong' || name === 'b',
      italic: top.italic || name === 'em' || name === 'i',
      href: name === 'a' ? (/href="([^"]+)"/i.exec(attrs ?? '')?.[1] ?? top.href) : top.href,
    })
  }
  push(html.slice(index))

  return pieces
}

/** Saca los bloques en el orden en que aparecen. */
function toBlocks(html: string): Block[] {
  const blocks: Block[] = []
  const pattern = /<(h2|h3|h4|p|hr|ul|ol|blockquote)\b[^>]*>([\s\S]*?)<\/\1>|<hr\s*\/?>/gi

  for (let match = pattern.exec(html); match; match = pattern.exec(html)) {
    const tag = match[1]?.toLowerCase()
    const inner = match[2] ?? ''

    if (!tag || tag === 'hr') {
      blocks.push({ kind: 'hr' })
      continue
    }

    if (tag === 'ul' || tag === 'ol') {
      const items = [...inner.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
      items.forEach((item, position) => {
        blocks.push({
          kind: 'li',
          pieces: toPieces(item[1] ?? ''),
          marker: tag === 'ol' ? `${position + 1}.` : '•',
        })
      })
      continue
    }

    // h4 y blockquote no tienen estilo propio: se leen como un párrafo.
    const kind = tag === 'h2' ? 'h2' : tag === 'h3' ? 'h3' : 'p'
    const pieces = toPieces(inner)
    if (pieces.length > 0) blocks.push({ kind, pieces })
  }

  // Sin ninguna etiqueta de bloque se enseña el texto pelado, no una pantalla vacía.
  if (blocks.length === 0) {
    const pieces = toPieces(html)
    if (pieces.length > 0) blocks.push({ kind: 'p', pieces })
  }

  return blocks
}

function Line({ pieces }: { pieces: Piece[] }) {
  const colors = useColors()
  return (
    <>
      {pieces.map((piece, index) => (
        <AppText
          key={index}
          style={[
            piece.bold && { fontWeight: '600' },
            piece.italic && { fontStyle: 'italic' },
            piece.href != null && { color: colors.primary, textDecorationLine: 'underline' },
          ]}
          onPress={piece.href ? () => void Linking.openURL(piece.href!) : undefined}
        >
          {piece.text}
        </AppText>
      ))}
    </>
  )
}

export function RichText({ html }: { html: string }) {
  const colors = useColors()
  const blocks = toBlocks(html)

  return (
    <View style={{ gap: spacing.sm }}>
      {blocks.map((block, index) => (
        <Fragment key={index}>
          {block.kind === 'hr' && (
            <View style={[styles.rule, { backgroundColor: colors.border }]} />
          )}

          {block.kind === 'h2' && (
            <AppText variant="subtitle" style={styles.h2}>
              <Line pieces={block.pieces} />
            </AppText>
          )}

          {block.kind === 'h3' && (
            <AppText style={styles.h3}>
              <Line pieces={block.pieces} />
            </AppText>
          )}

          {block.kind === 'p' && (
            <AppText style={styles.paragraph}>
              <Line pieces={block.pieces} />
            </AppText>
          )}

          {block.kind === 'li' && (
            <View style={styles.item}>
              <AppText variant="muted" style={styles.marker}>
                {block.marker}
              </AppText>
              <AppText style={[styles.paragraph, { flex: 1 }]}>
                <Line pieces={block.pieces} />
              </AppText>
            </View>
          )}
        </Fragment>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  h2: { marginTop: spacing.lg },
  h3: { marginTop: spacing.md, fontSize: 16, fontWeight: '600' },
  paragraph: { lineHeight: 22 },
  item: { flexDirection: 'row', gap: spacing.sm, paddingLeft: spacing.xs },
  marker: { lineHeight: 22, minWidth: 18 },
  rule: { height: StyleSheet.hairlineWidth, marginVertical: spacing.sm },
})
