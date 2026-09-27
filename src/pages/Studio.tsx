import { lazy, Suspense, useEffect } from 'react'
import { ImmersiveHud } from '../components/ImmersiveHud'
import { useAppStore } from '../store/useAppStore'

const RoomCanvas = lazy(() =>
  import('../components/RoomCanvas').then((m) => ({ default: m.RoomCanvas })),
)

export function Studio() {
  // Yesil/gri duvar ekrani: kilit + gosterim oturumunu temizle
  useEffect(() => {
    const s = useAppStore.getState()
    if (s.presentationMode) s.setPresentationMode(false)
    if (s.roomLocked) s.setRoomLocked(false)
    if (s.assetsOpen) s.setAssetsOpen(false)
    if (s.designOpen) s.setDesignOpen(false)
  }, [])

  return (
    <div className="studio-immer">
      <Suspense fallback={<div className="immer-loading">Yükleniyor…</div>}>
        <RoomCanvas />
      </Suspense>
      <ImmersiveHud />
    </div>
  )
}
