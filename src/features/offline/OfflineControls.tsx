import { useEffect, useRef, useState } from 'react'
import { getOfflineManifest, offlinePackStatus, saveOfflinePack, type OfflineManifest } from './offlinePack'
import { uiText, type UiLanguage } from '../../i18n/uiText'

export default function OfflineControls({ active, uiLanguage }: { active: boolean; uiLanguage: UiLanguage }) {
  const t = (english: string, values?: Record<string, string | number>) => uiText(uiLanguage, english, values)
  const saving = useRef(false)
  const [offlineManifest, setOfflineManifest] = useState<OfflineManifest | null>(null)
  const [offlineState, setOfflineState] = useState<'checking' | 'available' | 'saving' | 'ready' | 'error'>('checking')
  const [offlineProgress, setOfflineProgress] = useState({ saved: 0, total: 0 })
  useEffect(() => {
    if (!active || saving.current) return
    let current = true
    setOfflineState('checking')
    getOfflineManifest().then(async manifest => {
      const status = await offlinePackStatus(manifest)
      if (!current) return
      setOfflineManifest(manifest)
      setOfflineProgress({ saved: status.saved, total: status.total })
      setOfflineState(status.ready ? 'ready' : 'available')
    }).catch(() => { if (current) setOfflineState('error') })
    return () => { current = false }
  }, [active])

  const saveOffline = async () => {
    if (saving.current) return
    saving.current = true
    setOfflineState('saving')
    try {
      const manifest = offlineManifest ?? await getOfflineManifest()
      setOfflineManifest(manifest)
      if (navigator.storage?.persist) await navigator.storage.persist().catch(() => false)
      await saveOfflinePack(manifest, progress => {
        if (progress.saved % 10 === 0 || progress.saved === progress.total) setOfflineProgress(progress)
      })
      setOfflineProgress({ saved: manifest.files.length, total: manifest.files.length })
      setOfflineState('ready')
    } catch { setOfflineState('error') }
    finally { saving.current = false }
  }

  return         <div className="offline-pack-control">
          <p>{t('Offline reading')}</p>
          <small className="setting-hint">{t('Save all surahs, word meanings, verb study, and the 500-verb library on this device. Audio and external links still need internet.')}</small>
          {offlineManifest && <small className="setting-hint">{t('About {count} MB on this device.', { count: Math.ceil(offlineManifest.totalBytes / 1_000_000) })}</small>}
          <button className="action-button" onClick={saveOffline} disabled={offlineState === 'checking' || offlineState === 'saving' || offlineState === 'ready'}>{t(offlineState === 'ready' ? 'Saved for offline use' : offlineState === 'saving' ? 'Saving offline files…' : offlineState === 'error' ? 'Retry offline save' : 'Save for offline use')}</button>
          {offlineState === 'saving' && <progress value={offlineProgress.saved} max={offlineProgress.total || 1} aria-label={t('Offline save progress')} />}
          <small className="setting-hint" role="status">{offlineState === 'ready' ? t('All reading and study files are saved on this device.') : offlineState === 'error' ? t('Offline save stopped. Reconnect and retry; saved files will be reused.') : offlineState === 'saving' ? t('{saved} of {total} files saved. Keep this page open.', offlineProgress) : offlineState === 'checking' ? t('Checking offline files…') : t('Save once while online before reading without a connection.')}</small>
        </div>
}
