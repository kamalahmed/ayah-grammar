import { describe, expect, it } from 'vitest'
import { deferModule } from './deferredModule'

describe('optional feature loading', () => {
  it('does not load until requested and shares an in-progress or completed load', async () => {
    let attempts = 0
    const load = deferModule(async () => { attempts++; return { default: 'study panel' } })
    expect(attempts).toBe(0)
    const first = load()
    expect(load()).toBe(first)
    expect(await first).toEqual({ default: 'study panel' })
    expect(await load()).toEqual({ default: 'study panel' })
    expect(attempts).toBe(1)
  })

  it('can retry a failed chunk after connectivity returns', async () => {
    let online = false
    const load = deferModule(async () => {
      if (!online) throw new Error('Offline')
      return { default: 'library' }
    })
    await expect(load()).rejects.toThrow('Offline')
    online = true
    expect(await load()).toEqual({ default: 'library' })
  })
})
