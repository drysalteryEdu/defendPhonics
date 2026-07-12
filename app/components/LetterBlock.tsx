'use client'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { HandItem } from '../types'

function textSize(value: string): string {
  if (value.length <= 1) return 'text-3xl sm:text-5xl'
  if (value.length <= 3) return 'text-xl sm:text-3xl'
  return 'text-base sm:text-2xl'
}

interface Props {
  item: HandItem
  isHint?: boolean
}

export default function LetterBlock({ item, isHint }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { source: 'hand', item },
  })

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={[
        // square, responsive: 56px mobile / 96px sm+
        'w-14 h-14 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center',
        'cursor-grab active:cursor-grabbing select-none touch-manipulation',
        'shadow-md hover:shadow-xl hover:scale-105 transition-all duration-150',
        item.type === 'rime' ? 'bg-emerald-400' : 'bg-blue-400',
        isDragging ? 'opacity-30' : '',
        isHint ? 'ring-4 ring-amber-300 ring-offset-2 animate-pulse' : '',
      ].join(' ')}
    >
      <span className={`${textSize(item.value)} font-black text-white leading-none`}>
        {item.value}
      </span>
    </div>
  )
}
