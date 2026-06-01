'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { BracketMatchCard } from '../BracketMatchCard'
import { NODE_W, type MatchNodeData, type RoundLabelData } from './build-flow'

export function MatchNode({ data }: NodeProps) {
  const { match, final } = data as MatchNodeData
  return (
    <div style={{ width: NODE_W }}>
      <Handle type="target" position={Position.Left} className="!opacity-0 !border-0" />
      <BracketMatchCard match={match} final={final} />
      <Handle type="source" position={Position.Right} className="!opacity-0 !border-0" />
    </div>
  )
}

export function RoundLabelNode({ data }: NodeProps) {
  const { label } = data as RoundLabelData
  return (
    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
      {label}
    </p>
  )
}
