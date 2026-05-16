'use client'

import { useState, useRef, useEffect } from 'react'

interface DatePickerProps {
  label?: string
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function parseDate(iso: string): { year: number; month: number; day: number } | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  return { year: y, month: m - 1, day: d }
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatDisplay(iso: string): string {
  if (!iso) return 'Select a date'
  const parsed = parseDate(iso)
  if (!parsed) return iso
  return `${MONTHS[parsed.month]} ${parsed.day}, ${parsed.year}`
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function startDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export default function DatePicker({ label, value, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const parsed = parseDate(value)
  const today = new Date()
  const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth())
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function selectDay(day: number) {
    onChange(toISO(viewYear, viewMonth, day))
    setOpen(false)
  }

  const totalDays = daysInMonth(viewYear, viewMonth)
  const startDay = startDayOfMonth(viewYear, viewMonth)
  const cells: Array<{ day: number | null }> = []
  for (let i = 0; i < startDay; i++) cells.push({ day: null })
  for (let d = 1; d <= totalDays; d++) cells.push({ day: d })
  while (cells.length % 7 !== 0) cells.push({ day: null })

  const isSelected = (day: number) =>
    parsed?.year === viewYear && parsed?.month === viewMonth && parsed?.day === day
  const isToday = (day: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-[10px] tracking-[0.18em] uppercase text-[#111111] font-medium mb-2.5">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full text-left bg-transparent border-b border-[#E5E5E0] focus:border-[#111111] outline-none py-2 text-sm font-light text-[#111111] transition-colors cursor-pointer hover:border-[#111111]"
      >
        {formatDisplay(value)}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-[#FAFAF8] border border-[#E5E5E0] p-4 w-72 shadow-sm">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 text-[#999999] hover:text-[#111111] transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="text-[10px] tracking-[0.2em] uppercase font-medium text-[#111111]">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 text-[#999999] hover:text-[#111111] transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[9px] tracking-[0.1em] uppercase text-[#BBBBBB] font-medium py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((cell, i) => (
              <div key={i} className="flex items-center justify-center h-8">
                {cell.day !== null ? (
                  <button
                    type="button"
                    onClick={() => selectDay(cell.day!)}
                    className={`w-8 h-8 flex items-center justify-center text-xs font-light rounded-full transition-colors cursor-pointer ${
                      isSelected(cell.day!)
                        ? 'bg-[#111111] text-[#FAFAF8]'
                        : 'text-[#111111] hover:bg-[#F0F0EC]'
                    } ${isToday(cell.day!) && !isSelected(cell.day!) ? 'underline' : ''}`}
                  >
                    {cell.day}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
