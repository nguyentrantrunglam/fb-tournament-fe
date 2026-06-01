import type { Node, Edge } from '@xyflow/react'
import type { KnockoutRound, BracketMatch } from '@/lib/types/bracket'

export const NODE_W = 268
const NODE_H = 116 // đủ cao cho đôi (2 tên đầy đủ / side)
const GAP_X = 112
const PITCH = NODE_H + 34 // khoảng cách dọc giữa 2 trận liền kề ở vòng đầu
const LABEL_Y = -52

export type MatchNodeData = { match: BracketMatch; final: boolean }
export type RoundLabelData = { label: string }

// Dựng nodes + edges cho sơ đồ KO. Giả định mỗi vòng sau = nửa số trận vòng trước:
// trận i ở vòng r được nuôi bởi trận 2i và 2i+1 ở vòng r-1.
export function buildKnockoutFlow(rounds: KnockoutRound[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const centersByRound: number[][] = []

  rounds.forEach((round, r) => {
    const x = r * (NODE_W + GAP_X)
    const centers: number[] = []

    round.matches.forEach((m, i) => {
      let center: number
      if (r === 0) {
        center = i * PITCH + NODE_H / 2
      } else {
        const prev = centersByRound[r - 1]!
        const a = prev[2 * i] ?? i * PITCH + NODE_H / 2
        const b = prev[2 * i + 1] ?? a
        center = (a + b) / 2
      }
      centers.push(center)
      nodes.push({
        id: m.id,
        type: 'match',
        position: { x, y: center - NODE_H / 2 },
        data: { match: m, final: round.key === 'F' } satisfies MatchNodeData,
        draggable: false,
        selectable: false,
      })
    })

    nodes.push({
      id: `label-${round.key}`,
      type: 'roundLabel',
      position: { x, y: LABEL_Y },
      data: { label: `${round.label} · ${round.countLabel}` } satisfies RoundLabelData,
      draggable: false,
      selectable: false,
    })

    centersByRound.push(centers)
  })

  rounds.forEach((round, r) => {
    if (r === 0) return
    round.matches.forEach((m, i) => {
      const prev = rounds[r - 1]!.matches
      for (const src of [prev[2 * i], prev[2 * i + 1]]) {
        if (src) edges.push({ id: `${src.id}->${m.id}`, source: src.id, target: m.id })
      }
    })
  })

  return { nodes, edges }
}
