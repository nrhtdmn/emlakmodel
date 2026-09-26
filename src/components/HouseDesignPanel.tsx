import { WALL_LABELS, isCeilingVisible, isWallHidden, type WallIndex } from '../data/house'
import { useAppStore } from '../store/useAppStore'

const WALLS: WallIndex[] = [0, 1, 2, 3]

function cm(mm: number) {
  return Math.round(mm / 10)
}
function toMm(cmVal: number) {
  return Math.round(cmVal) * 10
}

export function HouseDesignPanel() {
  const room = useAppStore((s) => s.activeRoom())
  const updateActiveRoom = useAppStore((s) => s.updateActiveRoom)
  const addRoom = useAppStore((s) => s.addRoom)
  const removeRoom = useAppStore((s) => s.removeRoom)
  const addNiche = useAppStore((s) => s.addNiche)
  const updateNiche = useAppStore((s) => s.updateNiche)
  const removeNiche = useAppStore((s) => s.removeNiche)
  const addOpening = useAppStore((s) => s.addOpening)
  const updateOpening = useAppStore((s) => s.updateOpening)
  const removeOpening = useAppStore((s) => s.removeOpening)
  const toggleWallHidden = useAppStore((s) => s.toggleWallHidden)
  const setCeilingVisible = useAppStore((s) => s.setCeilingVisible)
  const selectedWall = useAppStore((s) => s.selectedWall)
  const setSelectedWall = useAppStore((s) => s.setSelectedWall)
  const house = useAppStore((s) => s.house)
  const resetProject = useAppStore((s) => s.resetProject)
  const setDesignOpen = useAppStore((s) => s.setDesignOpen)

  const wall = selectedWall

  return (
    <div className="design-panel">
      <div className="design-head">
        <h3>Ev / oda (cm)</h3>
        <button type="button" className="immer-exit" onClick={() => setDesignOpen(false)}>
          ✕
        </button>
      </div>

      <label className="field">
        Oda adı
        <input
          type="text"
          value={room.name}
          onChange={(e) => updateActiveRoom({ name: e.target.value })}
        />
      </label>

      <div className="design-grid">
        <label className="field">
          Genişlik cm
          <input
            type="number"
            min={150}
            max={1500}
            step={1}
            value={cm(room.widthMm)}
            onChange={(e) => updateActiveRoom({ widthMm: toMm(Number(e.target.value) || cm(room.widthMm)) })}
          />
        </label>
        <label className="field">
          Derinlik cm
          <input
            type="number"
            min={150}
            max={1500}
            step={1}
            value={cm(room.depthMm)}
            onChange={(e) => updateActiveRoom({ depthMm: toMm(Number(e.target.value) || cm(room.depthMm)) })}
          />
        </label>
        <label className="field">
          Yükseklik cm
          <input
            type="number"
            min={200}
            max={600}
            step={1}
            value={cm(room.heightMm)}
            onChange={(e) =>
              updateActiveRoom({ heightMm: toMm(Number(e.target.value) || cm(room.heightMm)) })
            }
          />
        </label>
      </div>

      <div className="design-grid">
        <label className="field">
          Duvar
          <input
            type="color"
            value={room.wallColor}
            onChange={(e) => updateActiveRoom({ wallColor: e.target.value })}
          />
        </label>
        <label className="field">
          Zemin
          <input
            type="color"
            value={room.floorColor}
            onChange={(e) => updateActiveRoom({ floorColor: e.target.value })}
          />
        </label>
        <label className="field">
          Tavan
          <input
            type="color"
            value={room.ceilingColor ?? '#f0ece4'}
            onChange={(e) => updateActiveRoom({ ceilingColor: e.target.value })}
          />
        </label>
      </div>

      <h4>Duvar seç</h4>
      <p className="immer-tip" style={{ marginTop: 0 }}>
        3B’de duvara tıkla veya buradan seç — sonra girinti / kolon / kapı ekle.
      </p>
      <div className="tools-row">
        {WALLS.map((w) => (
          <button
            key={w}
            type="button"
            className={`btn btn-sm ${selectedWall === w ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSelectedWall(selectedWall === w ? null : w)}
          >
            {WALL_LABELS[w]}
          </button>
        ))}
      </div>

      <h4>Görünüm</h4>
      <div className="tools-row">
        {WALLS.map((w) => (
          <button
            key={`vis-${w}`}
            type="button"
            className={`btn btn-sm ${!isWallHidden(room, w) ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => toggleWallHidden(w)}
          >
            {WALL_LABELS[w]} {!isWallHidden(room, w) ? '✓' : '–'}
          </button>
        ))}
        <button
          type="button"
          className={`btn btn-sm ${isCeilingVisible(room) ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setCeilingVisible(!isCeilingVisible(room))}
        >
          Tavan {isCeilingVisible(room) ? '✓' : '–'}
        </button>
      </div>

      <h4>Girinti / kolon</h4>
      <div className="tools-row">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={wall == null}
          onClick={() => addNiche({ kind: 'recess', wall: wall ?? 0 })}
        >
          + Girinti
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={wall == null}
          onClick={() =>
            addNiche({ kind: 'protrusion', wall: wall ?? 0, widthMm: 400, depthMm: 400, heightMm: room.heightMm })
          }
        >
          + Kolon / çıkıntı
        </button>
      </div>
      <ul className="niche-list">
        {room.niches.map((n) => (
          <li key={n.id} className="niche-edit">
            <div className="niche-edit-head">
              <strong>
                {n.kind === 'recess' ? 'Girinti' : 'Kolon'} · {WALL_LABELS[n.wall]}
              </strong>
              <button type="button" onClick={() => removeNiche(n.id)}>
                Sil
              </button>
            </div>
            <div className="design-grid">
              <label className="field">
                Duvar
                <select
                  value={n.wall}
                  onChange={(e) => updateNiche(n.id, { wall: Number(e.target.value) as WallIndex })}
                >
                  {WALLS.map((w) => (
                    <option key={w} value={w}>
                      {WALL_LABELS[w]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Başlangıç cm
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={cm(n.offsetMm)}
                  onChange={(e) => updateNiche(n.id, { offsetMm: toMm(Number(e.target.value) || 0) })}
                />
              </label>
              <label className="field">
                Genişlik cm
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={cm(n.widthMm)}
                  onChange={(e) => updateNiche(n.id, { widthMm: toMm(Number(e.target.value) || 1) })}
                />
              </label>
              <label className="field">
                Derinlik cm
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={cm(n.depthMm)}
                  onChange={(e) => updateNiche(n.id, { depthMm: toMm(Number(e.target.value) || 1) })}
                />
              </label>
              <label className="field">
                Yükseklik cm
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={cm(n.heightMm)}
                  onChange={(e) => updateNiche(n.id, { heightMm: toMm(Number(e.target.value) || 1) })}
                />
              </label>
            </div>
          </li>
        ))}
        {room.niches.length === 0 && <li className="empty-hint">Duvar seç → girinti veya kolon ekle.</li>}
      </ul>

      <h4>Kapı / pencere boşluğu</h4>
      <div className="tools-row">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={wall == null}
          onClick={() => addOpening({ kind: 'door', wall: wall ?? 2, widthMm: 900, heightMm: 2100 })}
        >
          + Kapı
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={wall == null}
          onClick={() =>
            addOpening({ kind: 'window', wall: wall ?? 0, widthMm: 1200, heightMm: 1200, sillMm: 900 })
          }
        >
          + Pencere
        </button>
      </div>
      <ul className="niche-list">
        {(room.openings ?? []).map((o) => (
          <li key={o.id} className="niche-edit">
            <div className="niche-edit-head">
              <strong>
                {o.kind === 'door' ? 'Kapı' : 'Pencere'} · {WALL_LABELS[o.wall]}
              </strong>
              <button type="button" onClick={() => removeOpening(o.id)}>
                Sil
              </button>
            </div>
            <div className="design-grid">
              <label className="field">
                Duvar
                <select
                  value={o.wall}
                  onChange={(e) => updateOpening(o.id, { wall: Number(e.target.value) as WallIndex })}
                >
                  {WALLS.map((w) => (
                    <option key={w} value={w}>
                      {WALL_LABELS[w]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Başlangıç cm
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={cm(o.offsetMm)}
                  onChange={(e) => updateOpening(o.id, { offsetMm: toMm(Number(e.target.value) || 0) })}
                />
              </label>
              <label className="field">
                Genişlik cm
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={cm(o.widthMm)}
                  onChange={(e) => updateOpening(o.id, { widthMm: toMm(Number(e.target.value) || 1) })}
                />
              </label>
              <label className="field">
                Yükseklik cm
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={cm(o.heightMm)}
                  onChange={(e) => updateOpening(o.id, { heightMm: toMm(Number(e.target.value) || 1) })}
                />
              </label>
              <label className="field">
                Eşik cm
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={cm(o.sillMm)}
                  onChange={(e) => updateOpening(o.id, { sillMm: toMm(Number(e.target.value) || 0) })}
                />
              </label>
            </div>
          </li>
        ))}
        {(room.openings ?? []).length === 0 && (
          <li className="empty-hint">Kilitliyken yalnızca kapı boşluğundan dışarı çıkılır.</li>
        )}
      </ul>

      <div className="tools-row" style={{ marginTop: '0.75rem' }}>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => addRoom()}>
          Yeni oda
        </button>
        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={() => removeRoom(room.id)}
          disabled={house.rooms.length <= 1}
        >
          Odayı sil
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            if (
              window.confirm(
                'Yeni proje başlatılsın mı?\n\nOdalar, ev ve yerleşimler silinir.\nYüklediğiniz katalog modelleri kalır.',
              )
            ) {
              resetProject()
            }
          }}
        >
          Sıfırla
        </button>
      </div>
    </div>
  )
}
