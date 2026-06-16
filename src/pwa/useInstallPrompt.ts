/**
 * PWA install affordance. On Chromium captures `beforeinstallprompt` and exposes
 * a programmatic prompt; on iOS Safari (no such event) exposes a flag so the UI
 * can show an "Add to Home Screen" hint instead. Already-installed → nothing.
 */

import { useCallback, useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface InstallPrompt {
  /** Chromium fired beforeinstallprompt and we're not installed → show a button. */
  canInstall: boolean
  /** iOS Safari, not installed → show the manual "Add to Home Screen" hint. */
  showIosHint: boolean
  installed: boolean
  promptInstall: () => Promise<void>
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/CriOS|FxiOS|EdgiOS/.test(ua)) return false // non-Safari iOS browsers
  // iPhone/iPod, classic iPad UA, OR iPadOS 13+ which reports a desktop
  // "Macintosh" UA but has a touch screen.
  const isIosUa = /iP(hone|ad|od)/.test(ua)
  const isIpadOs = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
  return (isIosUa || isIpadOs) && /Safari/.test(ua)
}

export function useInstallPrompt(): InstallPrompt {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState<boolean>(isStandalone)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }, [deferred])

  return {
    canInstall: !!deferred && !installed,
    showIosHint: !installed && !deferred && isIosSafari(),
    installed,
    promptInstall,
  }
}
