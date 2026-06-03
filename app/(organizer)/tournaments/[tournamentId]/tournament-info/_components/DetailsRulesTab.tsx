'use client'

import { useEffect, useRef, useState } from 'react'
import { Bold, Italic, Heading, List, Eye, Pencil, Save, FileText, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateTournament } from '@/lib/tournaments/api'
import { useTournamentRefresh } from '../../_components/tournament-context'
import { authErrorMessage } from '@/lib/auth/auth-error'
import { RULE_TEMPLATES, templateToMarkdown } from '@/lib/data/rule-templates'

// Inline markdown tối giản: **đậm** *nghiêng*
function renderInline(text: string) {
  return text
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    .filter(Boolean)
    .map((p, i) => {
      if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>
      if (p.startsWith('*') && p.endsWith('*')) return <em key={i}>{p.slice(1, -1)}</em>
      return <span key={i}>{p}</span>
    })
}

// Render markdown theo dòng: # tiêu đề, - danh sách, đoạn văn
function renderMarkdown(src: string) {
  return src.split('\n').map((line, i) => {
    if (/^#{1,3}\s/.test(line)) {
      const lvl = (line.match(/^#+/)?.[0].length ?? 1) as 1 | 2 | 3
      const txt = line.replace(/^#+\s/, '')
      const size = lvl === 1 ? 'text-[18px]' : lvl === 2 ? 'text-[15px]' : 'text-[14px]'
      return <p key={i} className={cn('font-bold text-white mt-3 first:mt-0', size)}>{renderInline(txt)}</p>
    }
    if (/^[-*]\s/.test(line)) {
      return <li key={i} className="ml-5 list-disc text-zinc-300 text-[13px]">{renderInline(line.replace(/^[-*]\s/, ''))}</li>
    }
    if (!line.trim()) return <div key={i} className="h-2" />
    return <p key={i} className="text-[13px] text-zinc-300 leading-relaxed">{renderInline(line)}</p>
  })
}

const PLACEHOLDER = `# Thể lệ giải đấu

## Đối tượng tham gia
- VĐV phong trào, không chuyên
- Đủ 16 tuổi trở lên

## Luật thi đấu
Áp dụng luật **BWF** với một số điều chỉnh...`

export function DetailsRulesTab({
  tournamentId,
  initialRules,
}: {
  tournamentId: string
  initialRules: string | null
}) {
  const [text, setText] = useState(initialRules ?? '')
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [tplOpen, setTplOpen] = useState(false)
  const refresh = useTournamentRefresh()
  const ref = useRef<HTMLTextAreaElement>(null)
  const tplRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tplOpen) return
    function onClick(e: MouseEvent) {
      if (tplRef.current && !tplRef.current.contains(e.target as Node)) setTplOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [tplOpen])

  function applyTemplate(id: string) {
    setTplOpen(false)
    const tpl = RULE_TEMPLATES.find((t) => t.id === id)
    if (!tpl) return
    if (text.trim() && !window.confirm('Thay toàn bộ nội dung điều lệ hiện tại bằng template?')) return
    setPreview(false)
    setText(templateToMarkdown(tpl))
  }

  async function save() {
    setSaving(true)
    setErr(null)
    try {
      await updateTournament(tournamentId, { rulesText: text || null })
      await refresh() // sync context so switching tabs keeps the saved rules
    } catch (e) {
      setErr(authErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  function wrap(before: string, after = before) {
    const el = ref.current
    if (!el) return
    const { selectionStart: s, selectionEnd: e, value } = el
    const sel = value.slice(s, e) || 'văn bản'
    setText(value.slice(0, s) + before + sel + after + value.slice(e))
    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = s + before.length
      el.selectionEnd = s + before.length + sel.length
    })
  }

  function prefixLine(prefix: string) {
    const el = ref.current
    if (!el) return
    const { selectionStart: s, value } = el
    const lineStart = value.lastIndexOf('\n', s - 1) + 1
    setText(value.slice(0, lineStart) + prefix + value.slice(lineStart))
    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = el.selectionEnd = s + prefix.length
    })
  }

  const toolBtn = 'p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors'

  return (
    <div className="px-8 py-6">
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-zinc-800">
          <div className={cn('flex items-center gap-0.5', preview && 'opacity-30 pointer-events-none')}>
            <button onClick={() => wrap('**')} className={toolBtn} title="Đậm"><Bold className="w-4 h-4" /></button>
            <button onClick={() => wrap('*')} className={toolBtn} title="Nghiêng"><Italic className="w-4 h-4" /></button>
            <button onClick={() => prefixLine('## ')} className={toolBtn} title="Tiêu đề"><Heading className="w-4 h-4" /></button>
            <button onClick={() => prefixLine('- ')} className={toolBtn} title="Danh sách"><List className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center gap-2">
            {/* Dùng template */}
            <div ref={tplRef} className="relative">
              <button
                onClick={() => setTplOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] text-zinc-300 border border-zinc-700 hover:border-zinc-500 rounded-md transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                Dùng template
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', tplOpen && 'rotate-180')} />
              </button>
              {tplOpen && (
                <div className="absolute right-0 z-30 mt-1 w-64 py-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-xl">
                  {RULE_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => applyTemplate(t.id)}
                      className="w-full text-left px-3 py-2 hover:bg-zinc-700/60 transition-colors"
                    >
                      <p className="text-[13px] text-white">{t.name}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">{t.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setPreview((v) => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] text-zinc-300 border border-zinc-700 hover:border-zinc-500 rounded-md transition-colors"
            >
              {preview ? <Pencil className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {preview ? 'Soạn thảo' : 'Xem trước'}
            </button>
            <button
              onClick={save}
              disabled={saving}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium rounded-md transition-colors',
                saving ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-400 text-white',
              )}
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>

        {err && <div className="text-[12px] text-red-300 bg-red-950/40 border-b border-red-900/50 px-3 py-2">{err}</div>}

        {/* Body */}
        {preview ? (
          <div className="px-4 py-3 min-h-[360px]">
            {text.trim() ? renderMarkdown(text) : <p className="text-[13px] text-zinc-600 italic">Chưa có nội dung thể lệ.</p>}
          </div>
        ) : (
          <textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            className="w-full min-h-[360px] bg-transparent px-4 py-3 text-[13px] text-white placeholder:text-zinc-600 font-mono leading-relaxed resize-y focus:outline-none"
          />
        )}
      </section>
      <p className="text-[11px] text-zinc-600 mt-2">
        Hỗ trợ Markdown: <code className="text-zinc-400">**đậm**</code> <code className="text-zinc-400">*nghiêng*</code> <code className="text-zinc-400"># tiêu đề</code> <code className="text-zinc-400">- danh sách</code>
      </p>
    </div>
  )
}
