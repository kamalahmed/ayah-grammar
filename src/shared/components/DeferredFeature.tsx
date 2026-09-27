import { useEffect, useRef, useState } from 'react'
import type { ComponentType } from 'react'
import { X } from 'lucide-react'
import type { UiLanguage } from '../../i18n/uiText'
import { uiText } from '../../i18n/uiText'

interface Props<P extends object> {
  load: () => Promise<{ default: ComponentType<P> }>
  componentProps: P
  label: string
  onClose: () => void
  modal?: boolean
  componentKey?: string
  uiLanguage?: UiLanguage
}

function LoadingFeature({ label, error, retry, onClose, modal, uiLanguage = 'en' }: { label: string; error: boolean; retry: () => void; onClose: () => void; modal?: boolean; uiLanguage?: UiLanguage }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])
  const content = <>
    <div className="panel-header"><div className="panel-heading">{label}</div><button className="icon-button" onClick={onClose} aria-label={uiText(uiLanguage, 'Close {label}', { label })}><X size={19} /></button></div>
    <div className="loading-message" role={error ? 'alert' : 'status'}>
      {error ? <><p>{uiText(uiLanguage, 'Could not load {label}. Reconnect and try again.', { label })}</p><div className="panel-actions"><button className="action-button" onClick={retry}>{uiText(uiLanguage, 'Try again')}</button><button className="action-button" onClick={() => window.location.reload()}>{uiText(uiLanguage, 'Reload app')}</button></div></> : uiText(uiLanguage, 'Opening {label}…', { label })}
    </div>
  </>
  return modal ? <dialog ref={dialog} className="book-library" onClose={event => { if (event.currentTarget.isConnected && !event.currentTarget.open) onClose() }} aria-label={label}>{content}</dialog> : <aside className="study-panel" aria-label={label}>{content}</aside>
}

export default function DeferredFeature<P extends object>({ load, componentProps, label, onClose, modal, componentKey, uiLanguage }: Props<P>) {
  const [Component, setComponent] = useState<ComponentType<P> | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setError(false)
    load().then(module => { if (active) setComponent(() => module.default) })
      .catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [load, attempt])
  return Component ? <Component key={componentKey} {...componentProps} /> : <LoadingFeature label={label} error={error} retry={() => setAttempt(value => value + 1)} onClose={onClose} modal={modal} uiLanguage={uiLanguage} />
}
