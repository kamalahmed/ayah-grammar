import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import OfflineControls from './OfflineControls'
import { getOfflineManifest, offlinePackStatus, saveOfflinePack } from './offlinePack'

vi.mock('./offlinePack', () => ({ getOfflineManifest: vi.fn(), offlinePackStatus: vi.fn(), saveOfflinePack: vi.fn() }))
const manifest = { version: 'a'.repeat(64), totalBytes: 10, files: [{ url: '/index.html', bytes: 10, sha256: 'b'.repeat(64) }] }
let view: ReactTestRenderer | undefined
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
afterEach(async () => { if (view) await act(async () => view!.unmount()); vi.resetAllMocks() })
describe('offline controls lifecycle', () => {
  it('does no startup work, checks on opening, and refreshes on reopening', async () => {
    vi.mocked(getOfflineManifest).mockResolvedValue(manifest)
    vi.mocked(offlinePackStatus).mockResolvedValue({ saved: 0, total: 1, ready: false })
    await act(async () => { view = create(<OfflineControls active={false} uiLanguage="en" />) })
    expect(getOfflineManifest).not.toHaveBeenCalled()
    await act(async () => view!.update(<OfflineControls active uiLanguage="en" />))
    expect(offlinePackStatus).toHaveBeenCalledTimes(1)
    await act(async () => view!.update(<OfflineControls active={false} uiLanguage="en" />))
    await act(async () => view!.update(<OfflineControls active uiLanguage="en" />))
    expect(offlinePackStatus).toHaveBeenCalledTimes(2)
  })
  it('continues one download while hidden and preserves completion after reopening', async () => {
    vi.stubGlobal('navigator', { storage: {} })
    vi.mocked(getOfflineManifest).mockResolvedValue(manifest)
    vi.mocked(offlinePackStatus).mockResolvedValue({ saved: 0, total: 1, ready: false })
    let finish!: () => void
    vi.mocked(saveOfflinePack).mockImplementation(() => new Promise<void>(resolve => { finish = resolve }))
    await act(async () => { view = create(<OfflineControls active uiLanguage="en" />) })
    await act(async () => { void view!.root.findByType('button').props.onClick() })
    await act(async () => view!.update(<OfflineControls active={false} uiLanguage="en" />))
    await act(async () => view!.update(<OfflineControls active uiLanguage="en" />))
    expect(offlinePackStatus).toHaveBeenCalledTimes(1)
    expect(view!.root.findByType('button').props.disabled).toBe(true)
    await act(async () => finish())
    expect(view!.root.findByType('button').children).toEqual(['Saved for offline use'])
    expect(saveOfflinePack).toHaveBeenCalledTimes(1)
  })
})
