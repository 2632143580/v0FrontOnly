'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, Loader2, Save, Upload, Wrench } from 'lucide-react'
import { useConsole } from '../console-provider'
import { cn } from '@/lib/utils'
import type { PersonaData, PersonaSettings } from '@/lib/console-types'

/* ── 区段选择器 ── */

function SegmentedField({
  label,
  hint,
  segments,
  value,
  onChange,
}: {
  label: string
  hint: string
  segments: { key: number; label: string }[]
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] tracking-quiet text-faint">{label}</span>
      <div className="glass-2 flex rounded-lg border border-border/40 p-0.5">
        {segments.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => onChange(s.key)}
            className={cn(
              'flex-1 rounded-md px-2 py-1.5 text-[11px] tracking-quiet transition-colors duration-300',
              value === s.key
                ? 'bg-signal/15 text-signal'
                : 'text-faint hover:text-muted-foreground',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <span className="text-[10px] text-faint/70">{hint}</span>
    </div>
  )
}

/* ── MAX_WINDOW 段 ── */
const WINDOW_SEGMENTS = [
  { key: 10, label: '精简 10' },
  { key: 20, label: '标准 20' },
  { key: 40, label: '详细 40' },
  { key: 60, label: '完整 60' },
]

const ROUNDS_SEGMENTS = [
  { key: 3, label: '3 轮' },
  { key: 5, label: '5 轮' },
  { key: 8, label: '8 轮' },
  { key: 0, label: '全部' },
]

/* ── 手风琴提示词 ── */

function PromptAccordion({
  label,
  hint,
  value,
  onChange,
  expanded,
  onToggle,
}: {
  label: string
  hint: string
  value: string
  onChange: (v: string) => void
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className={cn('flex flex-col', expanded ? 'flex-1 min-h-0' : 'shrink-0')}>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left transition-colors',
          expanded ? 'text-signal' : 'text-faint hover:text-muted-foreground',
        )}
      >
        <span className="text-[10px] tracking-quiet font-medium">{label}</span>
      </button>
      {expanded && (
        <div className="flex min-h-0 flex-1 flex-col gap-1">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              'scroll-quiet flex-1 min-h-0 resize-none rounded-lg border border-border/40',
              'bg-background/30 px-3 py-2 font-mono text-[12px] leading-relaxed',
              'text-foreground/80 outline-none transition-colors duration-300',
              'placeholder:text-faint/60 focus:border-signal-dim/50',
            )}
            spellCheck={false}
          />
          <span className="text-[10px] text-faint/70">{hint}</span>
        </div>
      )}
    </div>
  )
}

/* ── 工具调用条 ── */

function ToolCallStrip({ calls }: { calls: { name: string; status?: string; description?: string; result_preview?: string }[] }) {
  if (calls.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-faint">
        <Wrench className="h-3 w-3" />
        <span>未调用工具</span>
      </div>
    )
  }
  return (
    <div className="glass-2 flex flex-col gap-1 rounded-lg border border-border/40 p-2">
      {calls.slice(-4).map((c, i) => (
        <div key={i} className="flex items-start gap-1.5 text-[11px]">
          <span
            className={cn(
              'mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full',
              c.status === 'done' ? 'bg-ok/70' : 'bg-signal/70 animate-pulse',
            )}
          />
          <span className="text-faint font-mono">{c.name}</span>
          {c.description && (
            <span className="text-faint/60 truncate">-- {c.description}</span>
          )}
          {c.status === 'done' && c.result_preview && (
            <span className="text-faint/50 truncate">{c.result_preview.slice(0, 40)}</span>
          )}
        </div>
      ))}
    </div>
  )
}

/* ── 主面板 ── */

export function LlmSettingsPanel() {
  const {
    persona,
    personaLoaded,
    savingPersona,
    toolCalls,
    savePersona,
    exportPersona,
    importPersona,
  } = useConsole()

  const [drafts, setDrafts] = useState<{
    max_window: number
    memory_rounds: number
    system_prompt: string
    evaluate_prompt: string
    summary_prompt: string
  } | null>(null)

  const [expandedKey, setExpandedKey] = useState<string>('system')

  const fileRef = useRef<HTMLInputElement>(null)

  // 初始化草稿
  useEffect(() => {
    if (!persona) return
    setDrafts({
      max_window: persona.settings.max_window,
      memory_rounds: persona.settings.memory_rounds,
      system_prompt: persona.prompts.system_prompt,
      evaluate_prompt: persona.prompts.evaluate_prompt,
      summary_prompt: persona.prompts.summary_prompt,
    })
  }, [persona])

  // 变更检测
  const changed = useMemo(() => {
    if (!persona || !drafts) return null
    const ch: Partial<PersonaData> = {}
    const s = persona.settings
    if (drafts.max_window !== s.max_window || drafts.memory_rounds !== s.memory_rounds) {
      ch.settings = {
        max_window: drafts.max_window,
        memory_rounds: drafts.memory_rounds,
        tool_msg_max_len: s.tool_msg_max_len,
        chat_temperature: s.chat_temperature,
        evaluate_temperature: s.evaluate_temperature,
        summary_interval: s.summary_interval,
      }
    }
    const p = persona.prompts
    if (drafts.system_prompt !== p.system_prompt || drafts.evaluate_prompt !== p.evaluate_prompt || drafts.summary_prompt !== p.summary_prompt) {
      ch.prompts = {
        system_prompt: drafts.system_prompt,
        evaluate_prompt: drafts.evaluate_prompt,
        summary_prompt: drafts.summary_prompt,
      }
    }
    return Object.keys(ch).length > 0 ? ch : null
  }, [persona, drafts])

  const handleSave = () => {
    if (!changed) return
    savePersona(changed)
  }

  const handleExport = () => {
    exportPersona()
  }

  const handleImport = () => {
    fileRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const bundle = JSON.parse(reader.result as string) as PersonaData
        importPersona(bundle)
      } catch {
        // 解析失败静默
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  if (!persona || !drafts) {
    return (
      <section className="glass flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-border/50">
        <span className="text-[13px] text-faint">
          {personaLoaded ? '人设尚未就绪' : '正在读取人设...'}
        </span>
      </section>
    )
  }

  return (
    <section
      aria-label="对话设置"
      className="glass flex min-h-0 flex-1 flex-col rounded-2xl border border-border/50"
    >
      {/* header */}
      <header className="flex items-center justify-between border-b border-border/40 px-5 py-3.5 shrink-0">
        <div className="flex flex-col">
          <h2 className="font-display text-[15px] font-light tracking-quiet text-foreground/85">
            对话设置
          </h2>
          <span className="text-[11px] tracking-quiet text-faint">
            调节它如何记忆与回应
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleExport}
            title="导出人设"
            className="lift rounded-lg p-1.5 text-faint hover:text-muted-foreground"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleImport}
            title="导入人设"
            className="lift rounded-lg p-1.5 text-faint hover:text-muted-foreground"
          >
            <Upload className="h-3.5 w-3.5" />
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
        </div>
      </header>

      {/* body -- 无 overflow，靠 flex 分配高度 */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-5 py-4">
        {/* 上下文区 */}
        <div className="flex flex-col gap-3 shrink-0">
          <SegmentedField
            label="上下文窗口"
            hint="保留最近 N 条消息作为上下文。越长越完整，但消耗更多 token"
            segments={WINDOW_SEGMENTS}
            value={drafts.max_window}
            onChange={(v) => setDrafts((d) => (d ? { ...d, max_window: v } : d))}
          />
          <SegmentedField
            label="记忆轮次"
            hint="每次对话带几轮历史（1 轮 = 一问一答）。'全部' 不限制"
            segments={ROUNDS_SEGMENTS}
            value={drafts.memory_rounds}
            onChange={(v) => setDrafts((d) => (d ? { ...d, memory_rounds: v } : d))}
          />
        </div>

        {/* 提示词区 -- 手风琴，吸收剩余空间 */}
        <div className="flex min-h-0 flex-1 flex-col gap-0.5">
          <PromptAccordion
            label="系统提示词 · 人设"
            hint="定义 AI 的角色、行为规则和工具决策策略。支持 {current_time} 占位符"
            value={drafts.system_prompt}
            onChange={(v) => setDrafts((d) => (d ? { ...d, system_prompt: v } : d))}
            expanded={expandedKey === 'system'}
            onToggle={() => setExpandedKey((k) => (k === 'system' ? '' : 'system'))}
          />
          <PromptAccordion
            label="评估提示词"
            hint="控制自修正环节的判定规则。回复必须包含 SUFFICIENT 或 RETRY:原因"
            value={drafts.evaluate_prompt}
            onChange={(v) => setDrafts((d) => (d ? { ...d, evaluate_prompt: v } : d))}
            expanded={expandedKey === 'evaluate'}
            onToggle={() => setExpandedKey((k) => (k === 'evaluate' ? '' : 'evaluate'))}
          />
          <PromptAccordion
            label="摘要提示词"
            hint="控制对话摘要的生成方式。摘要帮助 AI 记住长期上下文"
            value={drafts.summary_prompt}
            onChange={(v) => setDrafts((d) => (d ? { ...d, summary_prompt: v } : d))}
            expanded={expandedKey === 'summary'}
            onToggle={() => setExpandedKey((k) => (k === 'summary' ? '' : 'summary'))}
          />
        </div>

        {/* 工具调用区 */}
        <div className="shrink-0">
          <ToolCallStrip calls={toolCalls} />
        </div>
      </div>

      {/* footer -- 保存栏 */}
      <footer className="flex items-center justify-between border-t border-border/40 px-5 py-3 shrink-0">
        <span className="text-[10px] tracking-quiet text-faint">
          {changed ? '有未保存的更改' : '已是最新'}
        </span>
        <button
          type="button"
          disabled={!changed || savingPersona}
          onClick={handleSave}
          className={cn(
            'lift flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] tracking-quiet transition-all',
            changed
              ? 'bg-signal/15 text-signal hover:bg-signal/25'
              : 'text-faint/50 cursor-not-allowed',
          )}
        >
          {savingPersona ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Save className="h-3 w-3" />
          )}
          保存
        </button>
      </footer>
    </section>
  )
}
