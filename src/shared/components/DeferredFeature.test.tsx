import { act, create } from 'react-test-renderer'
import { expect, it, vi } from 'vitest'
import DeferredFeature from './DeferredFeature'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
it('ignores stale close events from a reopened or detached loading dialog', async () => {
  const onClose = vi.fn()
  const load = () => new Promise<{ default: () => null }>(() => {})
  let view!: ReturnType<typeof create>
  await act(async () => { view = create(<DeferredFeature load={load} componentProps={{}} label="Library" onClose={onClose} modal />, { createNodeMock: () => ({ showModal() {}, close() {} }) }) })
  const close = view.root.findByType('dialog').props.onClose
  close({ currentTarget: { isConnected: true, open: true } })
  close({ currentTarget: { isConnected: false, open: false } })
  expect(onClose).not.toHaveBeenCalled()
  close({ currentTarget: { isConnected: true, open: false } })
  expect(onClose).toHaveBeenCalledTimes(1)
  await act(async () => view.unmount())
})
