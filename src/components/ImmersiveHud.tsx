import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { CATALOG, CATEGORY_LABELS, formatTRY, type Category } from '../data/catalog'
import { WALL_LABELS, isCeilingVisible, isWallHidden, type WallIndex } from '../data/house'
import { calcTotals, resolveItem, useAppStore } from '../store/useAppStore'
import { AssetsPanel } from './AssetsPanel'
import { HouseDesignPanel } from './HouseDesignPanel'
import { PoseDistancesPanel, LiveClearanceStrip } from './PoseDistancesPanel'

const BUILTIN = Object.keys(CATEGORY_LABELS) as Category[]
const WALLS: WallIndex[] = [0, 1, 2, 3]

export function ImmersiveHud() {
  const category = useAppStore((s) => s.category)
  const setCategory = useAppStore((s) => s.setCategory)
  const brandFilter = useAppStore((s) => s.brandFilter)
  const setBrandFilter = useAppStore((s) => s.setBrandFilter)
  const subcategoryFilter = useAppStore((s) => s.subcategoryFilter)
  const setSubcategoryFilter = useAppStore((s) => s.setSubcategoryFilter)
  const customCategories = useAppStore((s) => s.customCategories)
  const pendingId = useAppStore((s) => s.pendingCatalogId)
  const setPending = useAppStore((s) => s.setPendingCatalogId)
  const hudOpen = useAppStore((s) => s.hudOpen)
  const setHudOpen = useAppStore((s) => s.setHudOpen)
  const house = useAppStore((s) => s.house)
  const activeRoomId = useAppStore((s) => s.activeRoomId)
  const enterRoom = useAppStore((s) => s.enterRoom)
  const room = useAppStore((s) => s.activeRoom())
  const items = useAppStore((s) => s.items)
  const userAssets = useAppStore((s) => s.userAssets)
  const hiddenCatalogIds = useAppStore((s) => s.hiddenCatalogIds)
  const hideCatalogExample = useAppStore((s) => s.hideCatalogExample)
  const showMeasures = useAppStore((s) => s.showMeasures)
  const setShowMeasures = useAppStore((s) => s.setShowMeasures)
  const designOpen = useAppStore((s) => s.designOpen)
  const setDesignOpen = useAppStore((s) => s.setDesignOpen)
  const assetsOpen = useAppStore((s) => s.assetsOpen)
  const setAssetsOpen = useAppStore((s) => s.setAssetsOpen)
  const selectedUid = useAppStore((s) => s.selectedUid)
  const rotateItem = useAppStore((s) => s.rotateItem)
  const removeItem = useAppStore((s) => s.removeItem)
  const nudgeItem = useAppStore((s) => s.nudgeItem)
  const nudgeRotate = useAppStore((s) => s.nudgeRotate)
  const transformMode = useAppStore((s) => s.transformMode)
  const setTransformMode = useAppStore((s) => s.setTransformMode)
  const toggleWallHidden = useAppStore((s) => s.toggleWallHidden)
  const setCeilingVisible = useAppStore((s) => s.setCeilingVisible)
  const poseDetailOpen = useAppStore((s) => s.poseDetailOpen)
  const setPoseDetailOpen = useAppStore((s) => s.setPoseDetailOpen)
  const roomLocked = useAppStore((s) => s.roomLocked)
  const setRoomLocked = useAppStore((s) => s.setRoomLocked)
  const presentationMode = useAppStore((s) => s.presentationMode)
  const setPresentationMode = useAppStore((s) => s.setPresentationMode)
  const undo = useAppStore((s) => s.undo)
  const redo = useAppStore((s) => s.redo)
  const resetProject = useAppStore((s) => s.resetProject)
  const [presentHelpOpen, setPresentHelpOpen] = useState(false)

  useEffect(() => {
    if (!presentationMode) setPresentHelpOpen(false)
  }, [presentationMode])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return
      const mod = e.ctrlKey || e.metaKey
      if (mod && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if (mod && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault()
        redo()
        return
      }
      if (e.key === 'w' || e.key === 'W') {
        if (!presentationMode) setTransformMode('translate')
      }
      if (e.key === 'e' || e.key === 'E') {
        if (!presentationMode) setTransformMode('rotate')
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedUid) {
        if (presentationMode) return
        e.preventDefault()
        removeItem(selectedUid)
      }
      if (e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4') {
        toggleWallHidden((Number(e.key) - 1) as WallIndex)
      }
      if (e.key === '5') setCeilingVisible(!isCeilingVisible(room))
      if (selectedUid && !presentationMode) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          if (transformMode === 'rotate') nudgeRotate(selectedUid, e.shiftKey ? 0 : -5, 0, e.shiftKey ? -5 : 0)
          else nudgeItem(selectedUid, -1, 0)
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          if (transformMode === 'rotate') nudgeRotate(selectedUid, e.shiftKey ? 0 : 5, 0, e.shiftKey ? 5 : 0)
          else nudgeItem(selectedUid, 1, 0)
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          if (transformMode === 'rotate') nudgeRotate(selectedUid, 0, -5, 0)
          else if (e.shiftKey) nudgeItem(selectedUid, 0, 0, 1)
          else nudgeItem(selectedUid, 0, -1)
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          if (transformMode === 'rotate') nudgeRotate(selectedUid, 0, 5, 0)
          else if (e.shiftKey) nudgeItem(selectedUid, 0, 0, -1)
          else nudgeItem(selectedUid, 0, 1)
        } else if (e.key === 'i' || e.key === 'I') {
          e.preventDefault()
          setPoseDetailOpen(!poseDetailOpen)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    setTransformMode,
    selectedUid,
    removeItem,
    toggleWallHidden,
    setCeilingVisible,
    room,
    nudgeItem,
    nudgeRotate,
    transformMode,
    poseDetailOpen,
    setPoseDetailOpen,
    undo,
    redo,
    presentationMode,
  ])

  const catTabs = [
    ...BUILTIN.map((id) => ({ id, label: CATEGORY_LABELS[id] })),
    ...customCategories.map((c) => ({ id: c, label: c })),
  ]

  const inCategory = [
    ...userAssets.filter((a) => (a.kind ?? 'prop') === 'prop' && a.category === category),
    ...CATALOG.filter((c) => c.category === category && !hiddenCatalogIds.includes(c.id)),
  ]
  const brands = [...new Set(inCategory.map((p) => p.brand).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'tr'),
  )
  const afterBrand = brandFilter ? inCategory.filter((p) => p.brand === brandFilter) : inCategory
  const subcats = [
    ...new Set(afterBrand.map((p) => p.subcategory).filter((s): s is string => Boolean(s))),
  ].sort((a, b) => a.localeCompare(b, 'tr'))
  const products = subcategoryFilter
    ? afterBrand.filter((p) => p.subcategory === subcategoryFilter)
    : afterBrand
  const totals = calcTotals(
    items.filter((i) => i.roomId === activeRoomId),
    room,
  )
  const selected = selectedUid
    ? resolveItem(items.find((i) => i.uid === selectedUid)!)
    : null
  const pending =
    pendingId
      ? userAssets.find((a) => a.id === pendingId) ?? CATALOG.find((c) => c.id === pendingId)
      : null

  return (
    <div className="immer-hud">
      <div className="immer-top">
        <Link to="/" className="immer-exit">
          ←
        </Link>

        <button
          type="button"
          className={`immer-toggle ${presentationMode ? 'on' : ''}`}
          title={
            presentationMode
              ? 'Gösterim açık — düzenleme kapalı'
              : 'Gösterim modu — sadece gezinti'
          }
          onClick={() => setPresentationMode(!presentationMode)}
        >
          {presentationMode ? 'Gösterim ✓' : 'Gösterim'}
        </button>

        {!presentationMode && (
          <>
            <button type="button" className="immer-toggle" onClick={() => setHudOpen(!hudOpen)}>
              {hudOpen ? 'Katalog' : '+ Ekle'}
            </button>

            <button
              type="button"
              className={`immer-toggle ${assetsOpen ? 'on' : ''}`}
              onClick={() => setAssetsOpen(!assetsOpen)}
            >
              Modeller
            </button>
          </>
        )}

        <div className="immer-rooms">
          {house.rooms.map((r) => (
            <button
              key={r.id}
              type="button"
              className={r.id === activeRoomId ? 'on' : ''}
              onClick={() => enterRoom(r.id)}
            >
              {r.name}
            </button>
          ))}
        </div>

        {!presentationMode && (
          <>
            <button
              type="button"
              className="immer-toggle"
              title="Yeni proje — odalar sıfırlanır, modeller kalır"
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
            <button
              type="button"
              className={`immer-toggle ${showMeasures ? 'on' : ''}`}
              onClick={() => setShowMeasures(!showMeasures)}
            >
              Ölçü
            </button>
            <button
              type="button"
              className={`immer-toggle ${designOpen ? 'on' : ''}`}
              onClick={() => setDesignOpen(!designOpen)}
            >
              Oda
            </button>
          </>
        )}
        <button
          type="button"
          className={`immer-toggle ${roomLocked ? 'on' : ''}`}
          title={roomLocked ? 'Oda kilitli — kapıdan çık' : 'Odayı kilitle'}
          onClick={() => setRoomLocked(!roomLocked)}
        >
          {roomLocked ? '🔒' : '🔓'}
        </button>
      </div>

      <div className="immer-vis">
        <span className="immer-vis-label">Görünüm</span>
        {WALLS.map((w) => (
          <button
            key={w}
            type="button"
            className={`immer-toggle ${!isWallHidden(room, w) ? 'on' : ''}`}
            title={`${WALL_LABELS[w]} duvar (${w + 1})`}
            onClick={() => toggleWallHidden(w)}
          >
            {WALL_LABELS[w]}
          </button>
        ))}
        <button
          type="button"
          className={`immer-toggle ${isCeilingVisible(room) ? 'on' : ''}`}
          title="Tavan (5)"
          onClick={() => setCeilingVisible(!isCeilingVisible(room))}
        >
          Tavan
        </button>
      </div>

      {hudOpen && !presentationMode && (
        <div className="immer-panel immer-panel-fixed">
          <div className="immer-cats">
            {catTabs.map((c) => (
              <button
                key={c.id}
                type="button"
                className={category === c.id ? 'on' : ''}
                onClick={() => setCategory(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          {brands.length > 0 && (
            <div className="immer-cats immer-subcats">
              <button
                type="button"
                className={!brandFilter ? 'on' : ''}
                onClick={() => setBrandFilter(null)}
              >
                Tüm markalar
              </button>
              {brands.map((b) => (
                <button
                  key={b}
                  type="button"
                  className={brandFilter === b ? 'on' : ''}
                  onClick={() => setBrandFilter(b)}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
          {subcats.length > 0 && (
            <div className="immer-cats immer-subcats">
              <button
                type="button"
                className={!subcategoryFilter ? 'on' : ''}
                onClick={() => setSubcategoryFilter(null)}
              >
                Tüm alt
              </button>
              {subcats.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={subcategoryFilter === s ? 'on' : ''}
                  onClick={() => setSubcategoryFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="immer-products">
            {products.map((p) => {
              const isUser = 'assetId' in p
              return (
                <div key={p.id} className={`immer-product-row ${pendingId === p.id ? 'on' : ''}`}>
                  <button
                    type="button"
                    className={`immer-product ${pendingId === p.id ? 'on' : ''}`}
                    onClick={() => {
                      if (p.category === 'duvar' && p.unit === 'm2') {
                        useAppStore.getState().applyPaint(p.id)
                        return
                      }
                      if (p.category === 'zemin' && p.unit === 'm2') {
                        useAppStore.getState().applyFloor(p.id)
                        return
                      }
                      setPending(pendingId === p.id ? null : p.id)
                    }}
                  >
                    <span className="swatch" style={{ background: p.color }} />
                    <span>
                      <strong>
                        {p.name}
                        {isUser ? ' · GLB' : ''}
                      </strong>
                      <small>
                        {p.brand}
                        {p.subcategory ? ` · ${p.subcategory}` : ''} · {formatTRY(p.price)}
                      </small>
                    </span>
                  </button>
                  {!isUser && (
                    <button
                      type="button"
                      className="immer-product-del"
                      title="Örneği kaldır"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`“${p.name}” örneği katalogdan kaldırılsın mı?`)) {
                          hideCatalogExample(p.id)
                        }
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <p className="immer-tip">E + ok: ←→ yatay · ↑↓ dikey · Ctrl+Z geri</p>
        </div>
      )}

      {assetsOpen && !presentationMode && <AssetsPanel />}
      {designOpen && !presentationMode && <HouseDesignPanel />}

      {presentationMode && (
        <div className="immer-present-help">
          <button
            type="button"
            className={`immer-present-b ${presentHelpOpen ? 'on' : ''}`}
            title="Gezinti yardımı"
            aria-expanded={presentHelpOpen}
            onClick={() => setPresentHelpOpen((v) => !v)}
          >
            B
          </button>
          {presentHelpOpen && (
            <div className="immer-status immer-present" role="status">
              <strong>Gösterim · göz hizası</strong>
              <span>Sürükle bak · ↑↓ ileri/geri · Shift+↑↓ yukarı/aşağı · ←→ yan</span>
            </div>
          )}
        </div>
      )}

      {!presentationMode && (pending || selected) && (
        <div className="immer-status">
          {pending && (
            <>
              <strong>{pending.name}</strong>
              <span>Zemine sürükle bırak · tıkla iptal</span>
            </>
          )}
          {selected && !pending && selectedUid && (
            <>
              <div className="immer-status-row">
                <strong>{selected?.name}</strong>
                <button
                  type="button"
                  className={`immer-detail-btn ${poseDetailOpen ? 'on' : ''}`}
                  title="Sayı gir (I)"
                  onClick={() => setPoseDetailOpen(!poseDetailOpen)}
                >
                  ⌖
                </button>
              </div>
              <LiveClearanceStrip uid={selectedUid} />
              <span>
                <button
                  type="button"
                  className={transformMode === 'translate' ? 'on' : ''}
                  onClick={() => setTransformMode('translate')}
                >
                  Taşı (W)
                </button>
                <button
                  type="button"
                  className={transformMode === 'rotate' ? 'on' : ''}
                  onClick={() => setTransformMode('rotate')}
                  title="←→ yatay · ↑↓ dikey · Shift+←→ yan"
                >
                  Döndür (E)
                </button>
                <button type="button" onClick={() => rotateItem(selectedUid, 90)}>
                  +90°
                </button>
                <button type="button" onClick={() => removeItem(selectedUid)}>
                  Sil
                </button>
              </span>
              {poseDetailOpen && <PoseDistancesPanel uid={selectedUid} />}
            </>
          )}
        </div>
      )}

      <div className="immer-bottom">
        <span className="immer-room-name">{room.name}</span>
        <div className="immer-total">
          <span>Toplam</span>
          <strong>{formatTRY(totals.grand)}</strong>
        </div>
      </div>
    </div>
  )
}
