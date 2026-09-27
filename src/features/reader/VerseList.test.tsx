import { memo } from 'react'
import { act, create } from 'react-test-renderer'
import { expect, it, vi } from 'vitest'
import VerseList from './VerseList'
import verses from '../../../public/data/chapter-2.json'
import chapters from '../../../public/data/chapters.json'
import type { Verse } from '../../domain/quran/types'
import { reciters } from '../audio/audio'

const renders = vi.hoisted(() => ({ count: 0 }))
vi.mock('./VerseCard', () => ({ default: memo(() => { renders.count++; return null }) }))
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
it('skips 286 unchanged cards and renders only affected selection/audio cards', async () => {
  const props = { verses: verses as Verse[], chapters, reciter: reciters[0].id, highlightVerbs: true, showArabicVerses: true, showWordMeanings: true, language: 'both' as const, uiLanguage: 'en' as const, audioId: null as string | null, audioStatus: 'idle' as const, onToggleAudio: vi.fn(), onSelect: vi.fn() }
  let view!: ReturnType<typeof create>
  await act(async () => { view = create(<VerseList {...props} />) })
  expect(renders.count).toBe(286)
  renders.count = 0
  await act(async () => view.update(<VerseList {...props} />))
  expect(renders.count).toBe(0)
  await act(async () => view.update(<VerseList {...props} selectedKey="2:1" selectedPosition={1} />))
  expect(renders.count).toBe(1)
  renders.count = 0
  await act(async () => view.update(<VerseList {...props} selectedKey="2:1" selectedPosition={1} audioId="verse:2:2" audioStatus="playing" />))
  expect(renders.count).toBe(1)
  renders.count = 0
  await act(async () => view.update(<VerseList {...props} uiLanguage="bn" />))
  expect(renders.count).toBe(286)
  await act(async () => view.unmount())
})
