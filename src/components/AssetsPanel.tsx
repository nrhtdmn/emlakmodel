import { useRef, useState } from 'react'
import { CATEGORY_LABELS, formatTRY, type Category } from '../data/catalog'
import { idbDel, idbPut, revokeAssetUrl } from '../lib/assetsDb'
import { measureGlbMm } from '../lib/measureGlb'
import { downloadProjectBackup, importProjectBackup } from '../lib/projectBackup'
import { useAppStore, type UserAssetMeta } from '../store/useAppStore'

function assetId() {
  return `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

function formatMb(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const BUILTIN = Object.keys(CATEGORY_LABELS) as Category[]

export function AssetsPanel() {
  const userAssets = useAppStore((s) => s.userAssets)
  const customCategories = useAppStore((s) => s.customCategories)
  const registerUserAsset = useAppStore((s) => s.registerUserAsset)
  const removeUserAsset = useAppStore((s) => s.removeUserAsset)
  const setPending = useAppStore((s) => s.setPendingCatalogId)
  const pendingId = useAppStore((s) => s.pendingCatalogId)
  const setAssetsOpen = useAppStore((s) => s.setAssetsOpen)
  const applyRoomScene = useAppStore((s) => s.applyRoomScene)
  const applyCeiling = useAppStore((s) => s.applyCeiling)
  const addCustomCategory = useAppStore((s) => s.addCustomCategory)
  const removeCustomCategory = useAppStore((s) => s.removeCustomCategory)
  const updateUserAsset = useAppStore((s) => s.updateUserAsset)
  const hiddenCatalogIds = useAppStore((s) => s.hiddenCatalogIds)
  const restoreCatalogExamples = useAppStore((s) => s.restoreCatalogExamples)
  const itemCount = useAppStore((s) => s.items.length)
  const room = useAppStore((s) => s.activeRoom())
  const propInput = useRef<HTMLInputElement>(null)
  const roomInput = useRef<HTMLInputElement>(null)
  const ceilingInput = useRef<HTMLInputElement>(null)
  const importInput = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [tab, setTab] = useState<'prop' | 'room' | 'ceiling' | 'cats' | 'backup'>('prop')
  const [uploadCat, setUploadCat] = useState('mobilya')
  const [uploadBrand, setUploadBrand] = useState('')
  const [uploadSub, setUploadSub] = useState('')
  const [newCat, setNewCat] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const allCats = [
    ...BUILTIN.map((id) => ({ id, label: CATEGORY_LABELS[id] })),
    ...customCategories.map((c) => ({ id: c, label: c })),
  ]

  const props = userAssets.filter((a) => (a.kind ?? 'prop') === 'prop')
  const rooms = userAssets.filter((a) => a.kind === 'room')
  const ceilings = userAssets.filter((a) => a.kind === 'ceiling')
  const list = tab === 'prop' ? props : tab === 'room' ? rooms : tab === 'ceiling' ? ceilings : []
  const editing = list.find((a) => a.assetId === editingId)

  const onFiles = async (files: FileList | null, kind: 'prop' | 'room' | 'ceiling') => {
    if (!files?.length) return
    setBusy(true)
    setErr(null)
    setOk(null)
    try {
      for (const file of Array.from(files)) {
        const lower = file.name.toLowerCase()
        if (!lower.endsWith('.glb') && !lower.endsWith('.gltf')) {
          setErr('Sadece .glb / .gltf (Blender → File → Export → glTF, birim: metre)')
          continue
        }
        const id = assetId()
        let dims = { widthMm: 1000, depthMm: 800, heightMm: 800 }
        try {
          dims = await measureGlbMm(file)
        } catch {
          setErr('Ölçü okunamadı; model yine yüklendi. Blender’da birim metre olsun.')
        }
        await idbPut(id, file)
        const kindLabel = kind === 'room' ? 'Oda / sahne' : kind === 'ceiling' ? 'Tavan' : 'Eşya'
        const meta: UserAssetMeta = {
          id: `user_${id}`,
          assetId: id,
          kind,
          name: file.name.replace(/\.(glb|gltf)$/i, ''),
          brand: kind === 'prop' ? uploadBrand.trim() || 'Yüklenen' : 'Yüklenen',
          category: kind === 'prop' ? uploadCat : 'dekor',
          subcategory: kind === 'prop' ? uploadSub.trim() || undefined : undefined,
          price: 0,
          labor: 0,
          widthMm: dims.widthMm,
          depthMm: dims.depthMm,
          heightMm: dims.heightMm,
          unit: 'adet',
          color: kind === 'ceiling' ? '#f0ece4' : kind === 'room' ? '#6b7c6e' : '#8a9a8c',
          material: 'Özel GLB',
          features: [kindLabel, `${dims.widthMm}×${dims.depthMm}×${dims.heightMm} mm`, formatMb(file.size)],
          stock: 1,
          deliveryDays: 0,
          scenario: 'standart',
          modelUrl: `idb:${id}`,
        }
        registerUserAsset(meta)
        if (kind === 'room') {
          applyRoomScene(`idb:${id}`)
          useAppStore.getState().updateActiveRoom({
            widthMm: dims.widthMm,
            depthMm: dims.depthMm,
            heightMm: dims.heightMm,
          })
        } else if (kind === 'ceiling') {
          applyCeiling(`idb:${id}`)
        } else {
          setEditingId(id)
        }
      }
    } catch {
      setErr('Yükleme başarısız (disk / tarayıcı depolama dolu olabilir)')
    } finally {
      setBusy(false)
      if (propInput.current) propInput.current.value = ''
      if (roomInput.current) roomInput.current.value = ''
      if (ceilingInput.current) ceilingInput.current.value = ''
    }
  }

  const deleteAsset = async (a: UserAssetMeta) => {
    if (!confirm(`“${a.name}” silinsin mi?`)) return
    revokeAssetUrl(a.assetId)
    await idbDel(a.assetId)
    removeUserAsset(a.assetId)
    if (editingId === a.assetId) setEditingId(null)
  }

  const onExport = async () => {
    setBusy(true)
    setErr(null)
    setOk(null)
    try {
      await downloadProjectBackup()
      setOk('Yedek indirildi — ev, yerleşim ve tüm GLB modeller dahil.')
    } catch {
      setErr('Dışa aktarma başarısız')
    } finally {
      setBusy(false)
    }
  }

  const onImport = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    if (!confirm('Mevcut proje silinip yedek yüklenecek. Devam?')) {
      if (importInput.current) importInput.current.value = ''
      return
    }
    setBusy(true)
    setErr(null)
    setOk(null)
    try {
      await importProjectBackup(file)
      setOk('Yedek yüklendi.')
      setTab('prop')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'İçe aktarma başarısız')
    } finally {
      setBusy(false)
      if (importInput.current) importInput.current.value = ''
    }
  }

  return (
    <div className="design-panel assets-panel">
      <div className="design-head">
        <h3>Modeller</h3>
        <button type="button" className="immer-exit" onClick={() => setAssetsOpen(false)}>
          ✕
        </button>
      </div>

      <div className="immer-cats" style={{ marginBottom: '0.55rem' }}>
        <button type="button" className={tab === 'prop' ? 'on' : ''} onClick={() => setTab('prop')}>
          Eşya
        </button>
        <button type="button" className={tab === 'room' ? 'on' : ''} onClick={() => setTab('room')}>
          Oda
        </button>
        <button
          type="button"
          className={tab === 'ceiling' ? 'on' : ''}
          onClick={() => setTab('ceiling')}
        >
          Tavan
        </button>
        <button type="button" className={tab === 'cats' ? 'on' : ''} onClick={() => setTab('cats')}>
          Kategori
        </button>
        <button
          type="button"
          className={tab === 'backup' ? 'on' : ''}
          onClick={() => setTab('backup')}
        >
          Yedek
        </button>
      </div>

      {tab === 'backup' && (
        <>
          <p className="immer-tip" style={{ marginTop: 0 }}>
            Tarayıcıda tutulan her şey (ev, odalar, yerleşim, yüklenen GLB’ler) tek JSON dosyasına
            iner. Başka cihazda veya müşteri için yeniden yükle.
          </p>
          <input
            ref={importInput}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => onImport(e.target.files)}
          />
          <div className="tools-row" style={{ marginBottom: '0.65rem' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={busy}
              onClick={onExport}
            >
              {busy ? '…' : 'Dışa aktar'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={busy}
              onClick={() => importInput.current?.click()}
            >
              İçe aktar
            </button>
          </div>
          {hiddenCatalogIds.length > 0 && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', marginBottom: '0.5rem' }}
              onClick={() => {
                restoreCatalogExamples()
                setOk('Yerleşik örnekler kataloga geri geldi.')
              }}
            >
              Silinen örnekleri geri getir ({hiddenCatalogIds.length})
            </button>
          )}
          <p className="immer-tip">
            {userAssets.length} model · {itemCount} yerleşim
          </p>
        </>
      )}

      {tab === 'cats' && (
        <>
          <p className="immer-tip" style={{ marginTop: 0 }}>
            Kendi kategorini oluştur; yüklerken veya düzenlerken ata.
          </p>
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.65rem' }}>
            <input
              type="text"
              className="cat-input"
              placeholder="Örn. Priz, Avize…"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addCustomCategory(newCat)
                  setNewCat('')
                }
              }}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                addCustomCategory(newCat)
                setNewCat('')
              }}
            >
              Ekle
            </button>
          </div>
          <ul className="niche-list">
            {customCategories.map((c) => (
              <li key={c}>
                <span>{c}</span>
                <button type="button" onClick={() => removeCustomCategory(c)}>
                  Sil
                </button>
              </li>
            ))}
            {customCategories.length === 0 && <li className="empty-hint">Henüz özel kategori yok.</li>}
          </ul>
        </>
      )}

      {tab === 'prop' && (
        <>
          <label className="field">
            Yükleme kategorisi
            <select className="cat-input" value={uploadCat} onChange={(e) => setUploadCat(e.target.value)}>
              {allCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Marka
            <input
              className="cat-input"
              placeholder="Örn. IKEA, Vitra…"
              value={uploadBrand}
              onChange={(e) => setUploadBrand(e.target.value)}
            />
          </label>
          <label className="field">
            Alt kategori
            <input
              className="cat-input"
              placeholder="Örn. Koltuk, Masa…"
              value={uploadSub}
              onChange={(e) => setUploadSub(e.target.value)}
            />
          </label>
          <input
            ref={propInput}
            type="file"
            accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
            multiple
            hidden
            onChange={(e) => onFiles(e.target.files, 'prop')}
          />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={busy}
            onClick={() => propInput.current?.click()}
            style={{ width: '100%', marginBottom: '0.65rem' }}
          >
            {busy ? 'Yükleniyor…' : 'Eşya GLB yükle'}
          </button>
        </>
      )}

      {tab === 'room' && (
        <>
          <input
            ref={roomInput}
            type="file"
            accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
            multiple
            hidden
            onChange={(e) => onFiles(e.target.files, 'room')}
          />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={busy}
            onClick={() => roomInput.current?.click()}
            style={{ width: '100%', marginBottom: '0.65rem' }}
          >
            {busy ? 'Yükleniyor…' : 'Oda / sahne GLB yükle'}
          </button>
          {room.sceneModelUrl && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', marginBottom: '0.5rem' }}
              onClick={() => applyRoomScene(undefined)}
            >
              Varsayılan kutu odaya dön
            </button>
          )}
        </>
      )}

      {tab === 'ceiling' && (
        <>
          <p className="immer-tip" style={{ marginTop: 0 }}>
            Tavan modeli gerçek ölçüde yüklenir; oda yüksekliğine oturur. Fiyatı düzenleyebilirsin.
          </p>
          <input
            ref={ceilingInput}
            type="file"
            accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
            multiple
            hidden
            onChange={(e) => onFiles(e.target.files, 'ceiling')}
          />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={busy}
            onClick={() => ceilingInput.current?.click()}
            style={{ width: '100%', marginBottom: '0.65rem' }}
          >
            {busy ? 'Yükleniyor…' : 'Tavan GLB yükle'}
          </button>
          {room.ceilingModelUrl && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', marginBottom: '0.5rem' }}
              onClick={() => applyCeiling(undefined)}
            >
              Tavan modelini kaldır (düz tavan)
            </button>
          )}
        </>
      )}

      {err && (
        <p className="empty-hint" style={{ color: '#f0b4ac' }}>
          {err}
        </p>
      )}
      {ok && (
        <p className="empty-hint" style={{ color: '#a8d5b5' }}>
          {ok}
        </p>
      )}

      {editing && (tab === 'prop' || tab === 'ceiling') && (
        <div className="asset-edit">
          <strong>Düzenle: {editing.name}</strong>
          <label className="field">
            Ad
            <input
              className="cat-input"
              value={editing.name}
              onChange={(e) => updateUserAsset(editing.assetId, { name: e.target.value })}
            />
          </label>
          <label className="field">
            Kategori
            <select
              className="cat-input"
              value={editing.category}
              onChange={(e) => updateUserAsset(editing.assetId, { category: e.target.value })}
            >
              {allCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Marka
            <input
              className="cat-input"
              value={editing.brand}
              onChange={(e) => updateUserAsset(editing.assetId, { brand: e.target.value })}
            />
          </label>
          <label className="field">
            Alt kategori
            <input
              className="cat-input"
              placeholder="Örn. Koltuk"
              value={editing.subcategory ?? ''}
              onChange={(e) =>
                updateUserAsset(editing.assetId, { subcategory: e.target.value.trim() || undefined })
              }
            />
          </label>
          <div className="design-grid">
            <label className="field">
              Malzeme ₺
              <input
                type="number"
                className="cat-input"
                min={0}
                step={1}
                value={editing.price}
                onChange={(e) =>
                  updateUserAsset(editing.assetId, { price: Math.max(0, Number(e.target.value) || 0) })
                }
              />
            </label>
            <label className="field">
              İşçilik ₺
              <input
                type="number"
                className="cat-input"
                min={0}
                step={1}
                value={editing.labor}
                onChange={(e) =>
                  updateUserAsset(editing.assetId, { labor: Math.max(0, Number(e.target.value) || 0) })
                }
              />
            </label>
          </div>
          <p className="immer-tip" style={{ margin: 0 }}>
            Gerçek ölçü (modelden): {editing.widthMm} × {editing.depthMm} × {editing.heightMm ?? '—'}{' '}
            mm — değiştirilmez.
          </p>
          <div className="tools-row">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>
              Kapat
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteAsset(editing)}>
              Modeli sil
            </button>
          </div>
        </div>
      )}

      {(tab === 'prop' || tab === 'room' || tab === 'ceiling') && (
        <div className="immer-products">
          {list.map((a) => (
            <div
              key={a.id}
              className="immer-product"
              style={{ gridTemplateColumns: '36px 1fr', alignItems: 'start' }}
            >
              <span className="swatch" style={{ background: a.color }} />
              <div style={{ display: 'grid', gap: '0.35rem' }}>
                <button
                  type="button"
                  style={{
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    padding: 0,
                  }}
                  onClick={() => {
                    if (tab === 'prop') setPending(pendingId === a.id ? null : a.id)
                    else if (tab === 'room') applyRoomScene(a.modelUrl)
                    else applyCeiling(a.modelUrl)
                  }}
                >
                  <strong>{a.name}</strong>
                  <small>
                    {formatTRY(a.price)}
                    {a.labor ? ` + işçilik ${formatTRY(a.labor)}` : ''} · {a.widthMm}×{a.depthMm}×
                    {a.heightMm ?? '—'} mm
                  </small>
                </button>
                <div className="tools-row">
                  {(tab === 'prop' || tab === 'ceiling') && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setEditingId(editingId === a.assetId ? null : a.assetId)}
                    >
                      Düzenle
                    </button>
                  )}
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteAsset(a)}>
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <p className="empty-hint">
              {tab === 'prop' ? 'Henüz eşya yok.' : tab === 'room' ? 'Henüz oda yok.' : 'Henüz tavan yok.'}
            </p>
          )}
        </div>
      )}

      <p className="immer-tip">İpucu: + / − yakınlaş · prize çift tıkla → odak.</p>
    </div>
  )
}
