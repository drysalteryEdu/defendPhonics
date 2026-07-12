'use client'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Cell } from '../types'

// Responsive text: single letter → biggest, rime (-at) → medium, word (cat) → smaller
function textSize(value: string): string {
  if (value.length <= 1) return 'text-3xl sm:text-5xl'
  if (value.length <= 3) return 'text-xl sm:text-3xl'
  return 'text-base sm:text-2xl'
}

const BG_CLASS: Record<string, string> = {
  letter: 'bg-blue-400 shadow-blue-300',
  rime:   'bg-emerald-400 shadow-emerald-300',
  hero:   'bg-amber-400 shadow-amber-300',
}

interface Props {
  cell: Cell
  onDoubleClick: () => void
  isHint?: boolean
}

export default function GridCell({ cell, onDoubleClick, isHint }: Props) {
  const isEmpty = cell.type === 'empty'

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: cell.id })
  const {
    attributes, listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: cell.id,
    disabled: isEmpty,
    data: { source: 'cell', cell },
  })

  const setNodeRef = (el: HTMLDivElement | null) => {
    setDropRef(el)
    setDragRef(el)
  }

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      onDoubleClick={onDoubleClick}
      {...(!isEmpty ? { ...attributes, ...listeners } : {})}
      className={[
        // base: square, centered, rounded, no-select
        'relative aspect-square rounded-2xl flex flex-col items-center justify-center select-none',
        'transition-all duration-150 touch-manipulation',
        // empty vs occupied
        isEmpty
          ? [
              'border-2 border-dashed',
              isOver
                ? 'border-sky-300 bg-sky-300/30 scale-105'
                : 'border-white/30 bg-white/10',
            ].join(' ')
          : [
              BG_CLASS[cell.type] ?? 'bg-gray-400',
              'shadow-lg cursor-grab active:cursor-grabbing',
              cell.type === 'hero' ? 'scale-105 ring-2 ring-amber-200' : '',
            ].join(' '),
        isDragging ? 'opacity-30' : '',
        !isEmpty && isOver ? 'ring-4 ring-yellow-300 scale-105' : '',
        isHint && !isEmpty ? 'ring-4 ring-amber-300 animate-pulse' : '',
      ].join(' ')}
    >
      {isEmpty ? (
        <span className="text-white/20 text-2xl">+</span>
      ) : cell.emoji ? (
        <>
          <span className="text-3xl sm:text-4xl leading-none">{cell.emoji}</span>
          <span className="text-[10px] sm:text-xs font-black text-white mt-1 tracking-wider uppercase">
            {cell.value}
          </span>
          {(cell.tier ?? 1) >= 2 && (
            <span className="absolute top-0.5 right-0.5 text-[10px] leading-none">
              {(cell.tier ?? 1) >= 3 ? '🌟' : '⭐'}
            </span>
          )}
        </>
      ) : (
        <span className={`${textSize(cell.value)} font-black text-white leading-none`}>
          {cell.value}
        </span>
      )}
    </div>
  )
}
