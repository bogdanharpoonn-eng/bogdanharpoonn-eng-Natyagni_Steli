import { useState } from 'react'
import type { RoomTemplateId } from '@/features/room/templates'
import { uk } from '@/i18n/uk'

interface TemplatePickerProps {
  onPick: (template: RoomTemplateId, customCorners?: number) => void
  onCancel?: () => void
}

const OPTIONS: Array<{ id: RoomTemplateId; label: string }> = [
  { id: 'rectangle', label: uk.templateRectangle },
  { id: 'lshape', label: uk.templateL },
  { id: 'ushape', label: uk.templateU },
  { id: 'custom', label: uk.templateCustom },
]

export function TemplatePicker({ onPick, onCancel }: TemplatePickerProps) {
  const [customCorners, setCustomCorners] = useState(5)

  return (
    <div className="rounded-lg border border-slate-600 bg-slate-900 p-3">
      <h3 className="text-sm font-semibold text-slate-100">{uk.templateTitle}</h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className="min-h-touch rounded-md bg-slate-800 px-2 text-sm text-slate-100 ring-1 ring-slate-600"
            onClick={() => {
              if (opt.id === 'custom') onPick('custom', customCorners)
              else onPick(opt.id)
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-slate-300">
        <span>{uk.templateCustomCorners}</span>
        <input
          type="number"
          min={3}
          max={20}
          value={customCorners}
          onChange={(e) => setCustomCorners(Number(e.target.value) || 5)}
          className="min-h-touch w-20 rounded-md border border-slate-600 bg-slate-950 px-2"
        />
      </label>
      {onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 min-h-touch w-full rounded-md text-sm text-slate-400 ring-1 ring-slate-700"
        >
          {uk.commonCancel}
        </button>
      ) : null}
    </div>
  )
}
