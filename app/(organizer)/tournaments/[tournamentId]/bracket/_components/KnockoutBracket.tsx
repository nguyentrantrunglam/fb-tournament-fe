'use client'

import { useMemo } from 'react'
import { ReactFlow, Background, Controls, BackgroundVariant } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { buildKnockoutFlow } from './bracket-flow/build-flow'
import { MatchNode, RoundLabelNode } from './bracket-flow/nodes'
import type { KnockoutRound } from '@/lib/types/bracket'

const nodeTypes = { match: MatchNode, roundLabel: RoundLabelNode }

const EDGE_OPTS = {
  type: 'smoothstep' as const,
  style: { stroke: '#3f3f46', strokeWidth: 1.5 },
}

export function KnockoutBracket({ rounds }: { rounds: KnockoutRound[] }) {
  const { nodes, edges } = useMemo(() => buildKnockoutFlow(rounds), [rounds])

  return (
    <div className="w-full min-h-[50vh] h-[calc(100dvh-240px)] rounded-xl border border-zinc-800 bg-zinc-950/40 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={EDGE_OPTS}
        colorMode="dark"
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        maxZoom={1.6}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        zoomOnScroll={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#27272a" />
        <Controls showInteractive={false} className="!shadow-none" />
      </ReactFlow>
    </div>
  )
}
