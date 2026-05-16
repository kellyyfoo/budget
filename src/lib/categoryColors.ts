export const COLOR_PALETTES = {
  'warm-gray':  { badge: 'bg-[#FFE566] text-[#111111]', dot: 'bg-[#FFE566]' },
  'sage':       { badge: 'bg-[#CCFF00] text-[#111111]', dot: 'bg-[#CCFF00]' },
  'slate-blue': { badge: 'bg-[#00D4FF] text-[#111111]', dot: 'bg-[#00D4FF]' },
  'dusty-rose': { badge: 'bg-[#FF69B4] text-[#111111]', dot: 'bg-[#FF69B4]' },
  'teal':       { badge: 'bg-[#00FFCC] text-[#111111]', dot: 'bg-[#00FFCC]' },
  'sand':       { badge: 'bg-[#FF9933] text-[#111111]', dot: 'bg-[#FF9933]' },
  'lavender':   { badge: 'bg-[#CC66FF] text-[#111111]', dot: 'bg-[#CC66FF]' },
  'blush':      { badge: 'bg-[#FF4477] text-[#111111]', dot: 'bg-[#FF4477]' },
  'moss':       { badge: 'bg-[#99FF33] text-[#111111]', dot: 'bg-[#99FF33]' },
  'steel':      { badge: 'bg-[#6699FF] text-[#111111]', dot: 'bg-[#6699FF]' },
} as const

export type ColorKey = keyof typeof COLOR_PALETTES
export const COLOR_KEYS = Object.keys(COLOR_PALETTES) as ColorKey[]

const FALLBACK_KEYS = COLOR_KEYS

export function getPalette(color: string) {
  return COLOR_PALETTES[color as ColorKey] ?? COLOR_PALETTES[FALLBACK_KEYS[Math.abs(slugHash(color)) % FALLBACK_KEYS.length]]
}

function slugHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return h
}
