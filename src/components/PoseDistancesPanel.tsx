import { getItemClearances, poseFromClearance, type ClearanceKey } from '../lib/roomBounds'
import { resolveItem, useAppStore } from '../store/useAppStore'

const FIELDS: { key: ClearanceKey; label: string }[] = [
  { key: 'leftMm', label: 'Sol duvar' },
  { key: 'rightMm', label: 'Sağ duvar' },
  { key: 'backMm', label: 'Arka duvar' },
  { key: 'frontMm', label: 'Ön duvar' },
  { key: 'floorMm', label: 'Yerden' },
  { key: 'ceilingMm', label: 'Tavandan' },
]

function useClearances(uid: string) {
  const room = useAppStore((s) => s.activeRoom())
  const item = useAppStore((s) => s.items.find((i) => i.uid === uid))
  const catalog = item ? resolveItem(item) : undefined
  if (!item || !catalog) return null
  const dims = {
    widthMm: catalog.widthMm,
    depthMm: catalog.depthMm,
    heightMm: catalog.heightMm ?? 600,
  }
  return {
    item,
    catalog,
    dims,
    clear: getItemClearances(room, dims, item),
    room,
  }
}

/** Seçimde her zaman görünen canlı cm özeti */
export function LiveClearanceStrip({ uid }: { uid: string }) {
  const data = useClearances(uid)
  if (!data) return null
  const { clear } = data
  return (
    <div className="live-clear">
      <span>Sol {Math.round(clear.leftMm / 10)}</span>
      <span>Sağ {Math.round(clear.rightMm / 10)}</span>
      <span>Arka {Math.round(clear.backMm / 10)}</span>
      <span>Ön {Math.round(clear.frontMm / 10)}</span>
      <span>↓ {Math.round(clear.floorMm / 10)}</span>
      <span>↑ {Math.round(clear.ceilingMm / 10)}</span>
      <em>cm</em>
    </div>
  )
}

export function PoseDistancesPanel({ uid }: { uid: string }) {
  const data = useClearances(uid)
  const setItemPose = useAppStore((s) => s.setItemPose)
  if (!data) return null
  const { item, dims, clear, room } = data

  const onChange = (key: ClearanceKey, raw: string) => {
    const cm = Number(raw)
    if (!Number.isFinite(cm)) return
    const posed = poseFromClearance(room, dims, item, key, Math.round(cm) * 10)
    setItemPose(uid, posed.xMm, posed.yMm, posed.elevMm, posed.rotation, posed.pitch, posed.roll)
  }

  return (
    <div className="pose-dist">
      <div className="pose-dist-head">Mesafeler (cm) — yazarak ayarla</div>
      <div className="pose-dist-grid">
        {FIELDS.map(({ key, label }) => (
          <label key={key} className="pose-dist-field">
            <span>{label}</span>
            <input
              type="number"
              min={0}
              step={1}
              value={Math.round(clear[key] / 10)}
              onChange={(e) => onChange(key, e.target.value)}
              onFocus={(e) => e.target.select()}
            />
          </label>
        ))}
      </div>
      <p className="pose-dist-hint">
        {Math.round(dims.widthMm / 10)}×{Math.round(dims.depthMm / 10)}×
        {Math.round(dims.heightMm / 10)} cm · Y {Math.round(item.rotation)}° · X{' '}
        {Math.round(item.pitch ?? 0)}° · E=döndür ok
      </p>
    </div>
  )
}
