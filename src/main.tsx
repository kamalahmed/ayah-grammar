import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { cacheVisitedResources } from './offlineResources'
import './styles.css'
import './dark.css'
import './bookStudy.css'

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready).then(() => {
      cacheVisitedResources(navigator.serviceWorker)
    }).catch(() => { /* Reading works even where offline storage is unavailable. */ })
  })
}
