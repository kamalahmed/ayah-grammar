export function readFontScale(saved: string | null): number {
  const value = Number(saved)
  return Number.isFinite(value) && value >= 0.8 && value <= 1.4 ? Math.round(value * 10) / 10 : 1
}

export function readArabicScale(saved: string | null): number {
  const value = Number(saved)
  return Number.isFinite(value) && value >= 0.8 && value <= 2 ? Math.round(value * 10) / 10 : 1
}

export function readReaderShare(saved: string | null): number {
  const value = Number(saved)
  return Number.isFinite(value) && value >= 0.2 && value <= 0.7 ? value : 0.3
}

export function readerShareBounds(availableWidth: number): [number, number] {
  const usableWidth = Math.max(880, availableWidth)
  const lower = Math.max(0.25, 300 / usableWidth)
  const upper = Math.min(0.65, 1 - 580 / usableWidth)
  return [lower, Math.max(lower, upper)]
}

export function clampReaderShare(value: number, availableWidth: number): number {
  const [lower, upper] = readerShareBounds(availableWidth)
  return Math.min(Math.max(value, lower), upper)
}
