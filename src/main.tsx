import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import { cacheVisitedResources } from './features/offline/offlineResources'
import './styles/styles.css'
import './styles/dark.css'
import './features/study/bookStudy.css'

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready).then(() => {
      cacheVisitedResources(navigator.serviceWorker)
    }).catch(() => { /* Reading works even where offline storage is unavailable. */ })
  })
}
