import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!deferred || hidden) return null

  return (
    <div className="install-hint">
      <p>EmlakVR’yi ana ekrana ekle — çevrimdışı stüdyo, PWA olarak çalışır.</p>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <button
          className="btn btn-primary btn-sm"
          type="button"
          onClick={async () => {
            await deferred.prompt()
            await deferred.userChoice
            setDeferred(null)
          }}
        >
          Yükle
        </button>
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setHidden(true)}>
          Sonra
        </button>
      </div>
    </div>
  )
}
