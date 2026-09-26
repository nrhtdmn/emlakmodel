import { lazy, Suspense } from 'react'
import { ImmersiveHud } from '../components/ImmersiveHud'

const RoomCanvas = lazy(() =>
  import('../components/RoomCanvas').then((m) => ({ default: m.RoomCanvas })),
)

export function Studio() {
  return (
    <div className="studio-immer">
      <Suspense fallback={<div className="immer-loading">Yükleniyor…</div>}>
        <RoomCanvas />
      </Suspense>
      <ImmersiveHud />
    </div>
  )
}
