import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CATALOG, CATEGORY_LABELS, type CatalogItem } from '../data/catalog'
import {
  DEMO_HOUSE,
  nicheUid,
  openingUid,
  roomUid,
  type HouseDef,
  type Niche,
  type RoomDef,
  type WallOpening,
} from '../data/house'
import { clampItemInRoom } from '../lib/roomBounds'

export type ViewMode = 'live' | 'design' | 'proof'
export type ProofMode = 'vaat' | 'teslim' | 'fark'
export type Tool = 'hand' | 'select'
export type TransformMode = 'translate' | 'rotate'

export interface PlacedItem {
  uid: string
  catalogId: string
  roomId: string
  xMm: number
  yMm: number
  /** Yerden yükseklik (mm) — 3B’de Y ekseni */
  elevMm: number
  /** Yatay dönüş (Y ekseni, derece) */
  rotation: number
  /** Dikey eğim (X ekseni, derece) */
  pitch?: number
  /** Yan yatış (Z ekseni, derece) */
  roll?: number
  qty: number
  locked?: boolean
}

/** Yüklenen / hazır katalog öğesi meta (blob IndexedDB’de) */
export type UserAssetMeta = CatalogItem & {
  assetId: string
  kind?: 'prop' | 'room' | 'ceiling'
}

interface AppState {
  house: HouseDef
  activeRoomId: string
  items: PlacedItem[]
  userAssets: UserAssetMeta[]
  customCategories: string[]
  /** Gizlenen yerleşik örnek katalog id’leri */
  hiddenCatalogIds: string[]
  /** Seçili marka filtresi (null = tümü) */
  brandFilter: string | null
  /** Marka alt kategorisi filtresi (null = tümü) */
  subcategoryFilter: string | null
  selectedUid: string | null
  pendingCatalogId: string | null
  category: string
  viewMode: ViewMode
  proofMode: ProofMode
  tool: Tool
  transformMode: TransformMode
  snapMm: number
  timeOfDay: number
  hudOpen: boolean
  showMeasures: boolean
  designOpen: boolean
  assetsOpen: boolean
  poseDetailOpen: boolean
  transformDragging: boolean
  /** Kilit: kamera odadan (açık kapı hariç) çıkamaz */
  roomLocked: boolean
  /** Gösterim: düzenleme kapalı, sadece gezinti */
  presentationMode: boolean
  /** Gösterim girerken duvar/kilit yedeği */
  presentationBackup: {
    hiddenWalls: (0 | 1 | 2 | 3)[]
    ceilingVisible: boolean
    roomLocked: boolean
  } | null
  selectedWall: 0 | 1 | 2 | 3 | null
  promisedItems: PlacedItem[] | null
  deliveredItems: PlacedItem[] | null

  activeRoom: () => RoomDef
  getCatalogById: (id: string) => CatalogItem | undefined
  setViewMode: (m: ViewMode) => void
  setProofMode: (m: ProofMode) => void
  setCategory: (c: string) => void
  setBrandFilter: (b: string | null) => void
  setSubcategoryFilter: (s: string | null) => void
  setTool: (t: Tool) => void
  setTransformMode: (m: TransformMode) => void
  setSnapMm: (n: number) => void
  setTimeOfDay: (h: number) => void
  setHudOpen: (v: boolean) => void
  setShowMeasures: (v: boolean) => void
  setDesignOpen: (v: boolean) => void
  setAssetsOpen: (v: boolean) => void
  setPoseDetailOpen: (v: boolean) => void
  setTransformDragging: (v: boolean) => void
  setRoomLocked: (v: boolean) => void
  setPresentationMode: (v: boolean) => void
  setSelectedWall: (w: 0 | 1 | 2 | 3 | null) => void
  setPendingCatalogId: (id: string | null) => void
  select: (uid: string | null) => void
  enterRoom: (roomId: string) => void

  updateActiveRoom: (partial: Partial<RoomDef>, opts?: { history?: boolean }) => void
  addRoom: () => void
  removeRoom: (roomId: string) => void
  addNiche: (niche?: Partial<Niche>) => void
  updateNiche: (nicheId: string, partial: Partial<Niche>) => void
  removeNiche: (nicheId: string) => void
  addOpening: (opening?: Partial<WallOpening>) => void
  updateOpening: (openingId: string, partial: Partial<WallOpening>) => void
  removeOpening: (openingId: string) => void

  registerUserAsset: (meta: UserAssetMeta) => void
  removeUserAsset: (assetId: string) => void
  applyRoomScene: (sceneModelUrl: string | undefined) => void
  applyCeiling: (ceilingModelUrl: string | undefined) => void
  toggleWallHidden: (wall: 0 | 1 | 2 | 3) => void
  setCeilingVisible: (visible: boolean) => void
  addCustomCategory: (name: string) => void
  removeCustomCategory: (name: string) => void
  setUserAssetCategory: (assetId: string, category: string) => void
  renameUserAsset: (assetId: string, name: string) => void
  updateUserAsset: (
    assetId: string,
    partial: Partial<
      Pick<
        UserAssetMeta,
        'name' | 'category' | 'brand' | 'subcategory' | 'widthMm' | 'depthMm' | 'heightMm' | 'price' | 'labor'
      >
    >,
  ) => void
  hideCatalogExample: (catalogId: string) => void
  restoreCatalogExamples: () => void
  hydrateFromBackup: (state: {
    house: HouseDef
    activeRoomId: string
    items: PlacedItem[]
    userAssets: UserAssetMeta[]
    customCategories: string[]
    promisedItems: PlacedItem[] | null
    deliveredItems: PlacedItem[] | null
    snapMm: number
    showMeasures: boolean
    hiddenCatalogIds: string[]
  }) => void

  addItem: (catalogId: string, xMm?: number, yMm?: number) => void
  moveItem: (uid: string, xMm: number, yMm: number) => void
  setItemPose: (
    uid: string,
    xMm: number,
    yMm: number,
    elevMm: number,
    rotation: number,
    pitch?: number,
    roll?: number,
  ) => void
  nudgeItem: (uid: string, dxMm: number, dyMm: number, dElevMm?: number) => void
  /** Ok tuşları / +90 — yaw yatay, pitch dikey, roll yan */
  nudgeRotate: (uid: string, dYaw?: number, dPitch?: number, dRoll?: number) => void
  rotateItem: (uid: string, delta?: number) => void
  removeItem: (uid: string) => void
  applyPaint: (catalogId: string) => void
  applyFloor: (catalogId: string) => void
  lockPromise: () => void
  simulateDelivery: () => void
  resetHouse: () => void
  /** Yeni proje: oda/ev/yerleşim sıfır; katalog modelleri kalır */
  resetProject: () => void
  seedRoomFurniture: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

function uid() {
  return `p_${Math.random().toString(36).slice(2, 10)}`
}

function snap(v: number, grid: number) {
  return Math.round(v / grid) * grid
}

export function resolveItem(p: PlacedItem): CatalogItem | undefined {
  return getCatalogByIdStatic(p.catalogId)
}

export function getCatalogByIdStatic(id: string): CatalogItem | undefined {
  return CATALOG.find((c) => c.id === id) ?? useAppStore.getState().userAssets.find((a) => a.id === id)
}

export function calcTotals(items: PlacedItem[], room: RoomDef) {
  let material = 0
  let labor = 0
  const lines: { name: string; qty: number; unitPrice: number; labor: number; total: number }[] = []

  for (const p of items) {
    const c = resolveItem(p)
    if (!c) continue
    const mat = c.price * p.qty
    const lab = c.labor * p.qty
    material += mat
    labor += lab
    lines.push({
      name: c.name,
      qty: p.qty,
      unitPrice: c.price,
      labor: c.labor,
      total: mat + lab,
    })
  }

  const areaM2 = (room.widthMm * room.depthMm) / 1_000_000
  const wallM2 = ((room.widthMm + room.depthMm) * 2 * (room.heightMm / 1000)) / 1000
  const shipping = Math.round((material + labor) * 0.04)
  const vat = Math.round((material + labor + shipping) * 0.2)
  const grand = material + labor + shipping + vat

  return { material, labor, shipping, vat, grand, lines, areaM2, wallM2 }
}

/** Geri al / yinele için belge anlık görüntüsü */
type DocSnapshot = {
  house: HouseDef
  activeRoomId: string
  items: PlacedItem[]
  selectedUid: string | null
  promisedItems: PlacedItem[] | null
  deliveredItems: PlacedItem[] | null
  hiddenCatalogIds: string[]
}

const HISTORY_MAX = 60
let historyPast: DocSnapshot[] = []
let historyFuture: DocSnapshot[] = []
let historySuspended = false

function cloneDoc(s: {
  house: HouseDef
  activeRoomId: string
  items: PlacedItem[]
  selectedUid: string | null
  promisedItems: PlacedItem[] | null
  deliveredItems: PlacedItem[] | null
  hiddenCatalogIds: string[]
}): DocSnapshot {
  return {
    house: structuredClone(s.house),
    activeRoomId: s.activeRoomId,
    items: structuredClone(s.items),
    selectedUid: s.selectedUid,
    promisedItems: structuredClone(s.promisedItems),
    deliveredItems: structuredClone(s.deliveredItems),
    hiddenCatalogIds: [...s.hiddenCatalogIds],
  }
}

function pushHistory(get: () => AppState) {
  if (historySuspended) return
  historyPast.push(cloneDoc(get()))
  if (historyPast.length > HISTORY_MAX) historyPast.shift()
  historyFuture = []
}

function clearHistory() {
  historyPast = []
  historyFuture = []
}

function withoutHistory(fn: () => void) {
  historySuspended = true
  try {
    fn()
  } finally {
    historySuspended = false
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      house: structuredClone(DEMO_HOUSE),
      activeRoomId: 'salon',
      items: [],
      userAssets: [],
      customCategories: [],
      hiddenCatalogIds: [],
      brandFilter: null,
      subcategoryFilter: null,
      selectedUid: null,
      pendingCatalogId: null,
      category: 'mobilya',
      viewMode: 'live',
      proofMode: 'vaat',
      tool: 'hand',
      transformMode: 'translate',
      snapMm: 10,
      timeOfDay: 14,
      hudOpen: true,
      showMeasures: false,
      designOpen: false,
      assetsOpen: false,
      poseDetailOpen: false,
      transformDragging: false,
      roomLocked: false,
      presentationMode: false,
      presentationBackup: null,
      selectedWall: null,
      promisedItems: null,
      deliveredItems: null,

      activeRoom: () => {
        const { house, activeRoomId } = get()
        return house.rooms.find((r) => r.id === activeRoomId) ?? house.rooms[0]
      },

      getCatalogById: (id) =>
        CATALOG.find((c) => c.id === id) ?? get().userAssets.find((a) => a.id === id),

      setViewMode: (viewMode) => set({ viewMode }),
      setProofMode: (proofMode) => set({ proofMode }),
      setCategory: (category) => set({ category, brandFilter: null, subcategoryFilter: null }),
      setBrandFilter: (brandFilter) => set({ brandFilter, subcategoryFilter: null }),
      setSubcategoryFilter: (subcategoryFilter) => set({ subcategoryFilter }),
      setTool: (tool) => set({ tool, pendingCatalogId: tool === 'select' ? null : get().pendingCatalogId }),
      setTransformMode: (transformMode) => set({ transformMode }),
      setSnapMm: (snapMm) => set({ snapMm }),
      setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
      setHudOpen: (hudOpen) => {
        if (get().presentationMode && hudOpen) return
        set({ hudOpen })
      },
      setShowMeasures: (showMeasures) => set({ showMeasures }),
      setDesignOpen: (designOpen) => {
        if (get().presentationMode && designOpen) return
        set({ designOpen, assetsOpen: designOpen ? false : get().assetsOpen })
      },
      setAssetsOpen: (assetsOpen) => {
        if (get().presentationMode && assetsOpen) return
        set({ assetsOpen, designOpen: assetsOpen ? false : get().designOpen })
      },
      setPoseDetailOpen: (poseDetailOpen) => {
        if (get().presentationMode) return
        set({ poseDetailOpen })
      },
      setTransformDragging: (transformDragging) => {
        if (get().presentationMode && transformDragging) return
        // Sürükleme başında bir kez kaydet; ara kareler geçmişe yazılmaz
        if (
          transformDragging &&
          !get().transformDragging &&
          get().selectedUid &&
          !get().pendingCatalogId
        ) {
          pushHistory(get)
        }
        set({ transformDragging })
      },
      setRoomLocked: (roomLocked) => set({ roomLocked }),
      setPresentationMode: (presentationMode) => {
        if (presentationMode) {
          if (get().presentationMode) return
          const room = get().activeRoom()
          const { house, activeRoomId } = get()
          const backup = {
            hiddenWalls: [...(room.hiddenWalls ?? [])] as (0 | 1 | 2 | 3)[],
            ceilingVisible: room.ceilingVisible !== false,
            roomLocked: get().roomLocked,
          }
          set({
            house: {
              ...house,
              rooms: house.rooms.map((r) =>
                r.id === activeRoomId
                  ? { ...r, hiddenWalls: [], ceilingVisible: true }
                  : r,
              ),
            },
            presentationMode: true,
            presentationBackup: backup,
            roomLocked: true,
            selectedUid: null,
            pendingCatalogId: null,
            designOpen: false,
            assetsOpen: false,
            hudOpen: false,
            poseDetailOpen: false,
            transformDragging: false,
            selectedWall: null,
          })
        } else {
          const bak = get().presentationBackup
          const { house, activeRoomId } = get()
          set({
            presentationMode: false,
            presentationBackup: null,
            roomLocked: bak?.roomLocked ?? false,
            house: bak
              ? {
                  ...house,
                  rooms: house.rooms.map((r) =>
                    r.id === activeRoomId
                      ? {
                          ...r,
                          hiddenWalls: bak.hiddenWalls,
                          ceilingVisible: bak.ceilingVisible,
                        }
                      : r,
                  ),
                }
              : house,
          })
        }
      },
      setSelectedWall: (selectedWall) => {
        if (get().presentationMode) return
        set({ selectedWall })
      },
      setPendingCatalogId: (pendingCatalogId) => {
        if (get().presentationMode) return
        set({ pendingCatalogId, selectedUid: null, tool: pendingCatalogId ? 'hand' : get().tool })
      },
      select: (selectedUid) => {
        if (get().presentationMode) {
          set({ selectedUid: null, pendingCatalogId: null, poseDetailOpen: false, transformDragging: false })
          return
        }
        set({
          selectedUid,
          pendingCatalogId: selectedUid ? null : get().pendingCatalogId,
          poseDetailOpen: false,
          transformDragging: false,
        })
      },

      enterRoom: (roomId) => {
        if (!get().house.rooms.some((r) => r.id === roomId)) return
        set({ activeRoomId: roomId, selectedUid: null, pendingCatalogId: null })
      },

      registerUserAsset: (meta) =>
        set({ userAssets: [...get().userAssets.filter((a) => a.id !== meta.id), meta] }),

      removeUserAsset: (assetId) => {
        pushHistory(get)
        set({
          userAssets: get().userAssets.filter((a) => a.assetId !== assetId),
          items: get().items.filter((i) => i.catalogId !== `user_${assetId}`),
          pendingCatalogId:
            get().pendingCatalogId === `user_${assetId}` ? null : get().pendingCatalogId,
          house: {
            ...get().house,
            rooms: get().house.rooms.map((r) =>
              r.sceneModelUrl === `idb:${assetId}` || r.ceilingModelUrl === `idb:${assetId}`
                ? {
                    ...r,
                    sceneModelUrl:
                      r.sceneModelUrl === `idb:${assetId}` ? undefined : r.sceneModelUrl,
                    ceilingModelUrl:
                      r.ceilingModelUrl === `idb:${assetId}` ? undefined : r.ceilingModelUrl,
                  }
                : r,
            ),
          },
        })
      },

      applyRoomScene: (sceneModelUrl) => {
        get().updateActiveRoom({ sceneModelUrl })
      },

      applyCeiling: (ceilingModelUrl) => {
        get().updateActiveRoom({
          ceilingModelUrl,
          ceilingVisible: ceilingModelUrl ? true : get().activeRoom().ceilingVisible,
        })
      },

      toggleWallHidden: (wall) => {
        const room = get().activeRoom()
        const cur = new Set(room.hiddenWalls ?? [])
        if (cur.has(wall)) cur.delete(wall)
        else cur.add(wall)
        get().updateActiveRoom({ hiddenWalls: [...cur] as (0 | 1 | 2 | 3)[] })
      },

      setCeilingVisible: (ceilingVisible) => {
        get().updateActiveRoom({ ceilingVisible })
      },

      addCustomCategory: (name) => {
        const n = name.trim()
        if (!n) return
        const exists =
          get().customCategories.some((c) => c.toLowerCase() === n.toLowerCase()) ||
          Object.values(CATEGORY_LABELS).some((l) => l.toLowerCase() === n.toLowerCase()) ||
          (Object.keys(CATEGORY_LABELS) as string[]).includes(n)
        if (exists) {
          set({ category: get().customCategories.find((c) => c.toLowerCase() === n.toLowerCase()) ?? n })
          return
        }
        set({ customCategories: [...get().customCategories, n], category: n })
      },

      removeCustomCategory: (name) => {
        set({
          customCategories: get().customCategories.filter((c) => c !== name),
          userAssets: get().userAssets.map((a) =>
            a.category === name ? { ...a, category: 'mobilya' } : a,
          ),
          category: get().category === name ? 'mobilya' : get().category,
        })
      },

      setUserAssetCategory: (assetId, category) => {
        set({
          userAssets: get().userAssets.map((a) =>
            a.assetId === assetId ? { ...a, category } : a,
          ),
        })
      },

      renameUserAsset: (assetId, name) => {
        const n = name.trim()
        if (!n) return
        set({
          userAssets: get().userAssets.map((a) => (a.assetId === assetId ? { ...a, name: n } : a)),
        })
      },

      updateUserAsset: (assetId, partial) => {
        set({
          userAssets: get().userAssets.map((a) =>
            a.assetId === assetId ? { ...a, ...partial } : a,
          ),
        })
      },

      hideCatalogExample: (catalogId) => {
        if (catalogId.startsWith('user_')) return
        pushHistory(get)
        const hidden = new Set(get().hiddenCatalogIds)
        hidden.add(catalogId)
        const sel = get().selectedUid
        const selItem = sel ? get().items.find((i) => i.uid === sel) : null
        set({
          hiddenCatalogIds: [...hidden],
          items: get().items.filter((i) => i.catalogId !== catalogId),
          pendingCatalogId: get().pendingCatalogId === catalogId ? null : get().pendingCatalogId,
          selectedUid: selItem?.catalogId === catalogId ? null : sel,
        })
      },

      restoreCatalogExamples: () => {
        pushHistory(get)
        set({ hiddenCatalogIds: [] })
      },

      hydrateFromBackup: (state) => {
        clearHistory()
        set({
          house: state.house,
          activeRoomId: state.activeRoomId,
          items: state.items,
          userAssets: state.userAssets,
          customCategories: state.customCategories,
          promisedItems: state.promisedItems,
          deliveredItems: state.deliveredItems,
          snapMm: state.snapMm,
          showMeasures: state.showMeasures,
          hiddenCatalogIds: state.hiddenCatalogIds ?? [],
          selectedUid: null,
          pendingCatalogId: null,
          viewMode: 'live',
          designOpen: false,
          assetsOpen: false,
        })
      },

      updateActiveRoom: (partial, opts) => {
        if (get().presentationMode) return
        if (opts?.history !== false) pushHistory(get)
        const { house, activeRoomId } = get()
        set({
          house: {
            ...house,
            rooms: house.rooms.map((r) => (r.id === activeRoomId ? { ...r, ...partial } : r)),
          },
        })
      },

      addRoom: () => {
        if (get().presentationMode) return
        pushHistory(get)
        const { house } = get()
        const last = house.rooms[house.rooms.length - 1]
        const room: RoomDef = {
          id: roomUid(),
          name: `Oda ${house.rooms.length + 1}`,
          widthMm: 3500,
          depthMm: 3200,
          heightMm: 2700,
          wallColor: '#e8ebe4',
          floorColor: '#c4a574',
          ceilingColor: '#f0ece4',
          ceilingVisible: true,
          hiddenWalls: [],
          originXMm: (last?.originXMm ?? 0) + (last?.widthMm ?? 0) + 200,
          originZMm: last?.originZMm ?? 0,
          niches: [],
          openings: [],
        }
        set({ house: { ...house, rooms: [...house.rooms, room] }, activeRoomId: room.id })
      },

      removeRoom: (roomId) => {
        const { house, activeRoomId, items } = get()
        if (house.rooms.length <= 1) return
        if (get().presentationMode) return
        pushHistory(get)
        const rooms = house.rooms.filter((r) => r.id !== roomId)
        set({
          house: { ...house, rooms },
          activeRoomId: activeRoomId === roomId ? rooms[0].id : activeRoomId,
          items: items.filter((i) => i.roomId !== roomId),
        })
      },

      addNiche: (partial) => {
        const wall = partial?.wall ?? get().selectedWall ?? 0
        const n: Niche = {
          id: nicheUid(),
          offsetMm: 1000,
          widthMm: 1000,
          depthMm: 400,
          heightMm: get().activeRoom().heightMm,
          kind: 'recess',
          ...partial,
          wall,
        }
        n.offsetMm = Math.round(n.offsetMm / 10) * 10
        n.widthMm = Math.max(10, Math.round(n.widthMm / 10) * 10)
        n.depthMm = Math.max(10, Math.round(n.depthMm / 10) * 10)
        n.heightMm = Math.max(10, Math.round(n.heightMm / 10) * 10)
        const room = get().activeRoom()
        // updateActiveRoom kendi push'unu yapar
        get().updateActiveRoom({ niches: [...room.niches, n] })
      },

      updateNiche: (nicheId, partial) => {
        const room = get().activeRoom()
        get().updateActiveRoom({
          niches: room.niches.map((n) => {
            if (n.id !== nicheId) return n
            const next = { ...n, ...partial }
            if (partial.offsetMm != null) next.offsetMm = Math.round(partial.offsetMm / 10) * 10
            if (partial.widthMm != null) next.widthMm = Math.max(10, Math.round(partial.widthMm / 10) * 10)
            if (partial.depthMm != null) next.depthMm = Math.max(10, Math.round(partial.depthMm / 10) * 10)
            if (partial.heightMm != null)
              next.heightMm = Math.max(10, Math.round(partial.heightMm / 10) * 10)
            return next
          }),
        })
      },

      removeNiche: (nicheId) => {
        const room = get().activeRoom()
        get().updateActiveRoom({ niches: room.niches.filter((n) => n.id !== nicheId) })
      },

      addOpening: (partial) => {
        const wall = partial?.wall ?? get().selectedWall ?? 2
        const o: WallOpening = {
          id: openingUid(),
          offsetMm: 1000,
          widthMm: 900,
          heightMm: 2100,
          sillMm: 0,
          kind: 'door',
          ...partial,
          wall,
        }
        o.offsetMm = Math.round(o.offsetMm / 10) * 10
        o.widthMm = Math.max(10, Math.round(o.widthMm / 10) * 10)
        o.heightMm = Math.max(10, Math.round(o.heightMm / 10) * 10)
        o.sillMm = Math.round((o.sillMm ?? 0) / 10) * 10
        const room = get().activeRoom()
        get().updateActiveRoom({ openings: [...(room.openings ?? []), o] })
      },

      updateOpening: (openingId, partial) => {
        const room = get().activeRoom()
        get().updateActiveRoom({
          openings: (room.openings ?? []).map((o) => {
            if (o.id !== openingId) return o
            const next = { ...o, ...partial }
            if (partial.offsetMm != null) next.offsetMm = Math.round(partial.offsetMm / 10) * 10
            if (partial.widthMm != null) next.widthMm = Math.max(10, Math.round(partial.widthMm / 10) * 10)
            if (partial.heightMm != null)
              next.heightMm = Math.max(10, Math.round(partial.heightMm / 10) * 10)
            if (partial.sillMm != null) next.sillMm = Math.round(partial.sillMm / 10) * 10
            return next
          }),
        })
      },

      removeOpening: (openingId) => {
        const room = get().activeRoom()
        get().updateActiveRoom({
          openings: (room.openings ?? []).filter((o) => o.id !== openingId),
        })
      },

      addItem: (catalogId, xMm, yMm) => {
        if (get().presentationMode) return
        const c = get().getCatalogById(catalogId)
        if (!c) return
        if (c.category === 'duvar' && c.unit === 'm2') {
          get().applyPaint(catalogId)
          return
        }
        if (c.category === 'zemin' && c.unit === 'm2') {
          get().applyFloor(catalogId)
          return
        }
        pushHistory(get)
        const room = get().activeRoom()
        const { snapMm, items, activeRoomId } = get()
        const dims = {
          widthMm: c.widthMm,
          depthMm: c.depthMm,
          heightMm: c.heightMm ?? 600,
        }
        const rawX = xMm ?? snap(room.widthMm / 2 - c.widthMm / 2, snapMm)
        const rawY = yMm ?? snap(room.depthMm / 2 - c.depthMm / 2, snapMm)
        const posed = clampItemInRoom(room, dims, {
          xMm: snap(rawX, snapMm),
          yMm: snap(rawY, snapMm),
          elevMm: 0,
          rotation: 0,
        })
        const placed: PlacedItem = {
          uid: uid(),
          catalogId,
          roomId: activeRoomId,
          ...posed,
          qty: 1,
        }
        set({
          items: [...items, placed],
          selectedUid: placed.uid,
          pendingCatalogId: null,
        })
      },

      moveItem: (id, xMm, yMm) => {
        if (get().presentationMode) return
        if (!get().transformDragging) pushHistory(get)
        const room = get().activeRoom()
        const { items, snapMm } = get()
        set({
          items: items.map((p) => {
            if (p.uid !== id) return p
            const c = resolveItem(p)
            const dims = {
              widthMm: c?.widthMm ?? 400,
              depthMm: c?.depthMm ?? 400,
              heightMm: c?.heightMm ?? 600,
            }
            const posed = clampItemInRoom(room, dims, {
              xMm: snap(xMm, snapMm),
              yMm: snap(yMm, snapMm),
              elevMm: p.elevMm,
              rotation: p.rotation,
              pitch: p.pitch,
              roll: p.roll,
            })
            return { ...p, ...posed }
          }),
        })
      },

      setItemPose: (id, xMm, yMm, elevMm, rotation, pitch, roll) => {
        if (get().presentationMode) return
        if (!get().transformDragging) pushHistory(get)
        const room = get().activeRoom()
        const snapMm = get().snapMm
        set({
          items: get().items.map((p) => {
            if (p.uid !== id) return p
            const c = resolveItem(p)
            const dims = {
              widthMm: c?.widthMm ?? 400,
              depthMm: c?.depthMm ?? 400,
              heightMm: c?.heightMm ?? 600,
            }
            const posed = clampItemInRoom(room, dims, {
              xMm: snap(xMm, snapMm),
              yMm: snap(yMm, snapMm),
              elevMm: snap(elevMm, snapMm),
              rotation,
              pitch: pitch ?? p.pitch ?? 0,
              roll: roll ?? p.roll ?? 0,
            })
            return { ...p, ...posed }
          }),
        })
      },

      nudgeItem: (id, dxMm, dyMm, dElevMm = 0) => {
        if (get().presentationMode) return
        const item = get().items.find((p) => p.uid === id)
        if (!item || item.locked) return
        const step = get().snapMm
        get().setItemPose(
          id,
          item.xMm + dxMm * (step || 10),
          item.yMm + dyMm * (step || 10),
          item.elevMm + dElevMm * (step || 10),
          item.rotation,
          item.pitch ?? 0,
          item.roll ?? 0,
        )
      },

      nudgeRotate: (id, dYaw = 0, dPitch = 0, dRoll = 0) => {
        if (get().presentationMode) return
        const item = get().items.find((p) => p.uid === id)
        if (!item || item.locked) return
        get().setItemPose(
          id,
          item.xMm,
          item.yMm,
          item.elevMm,
          item.rotation + dYaw,
          (item.pitch ?? 0) + dPitch,
          (item.roll ?? 0) + dRoll,
        )
      },

      rotateItem: (id, delta = 90) => {
        get().nudgeRotate(id, delta, 0, 0)
      },

      removeItem: (id) => {
        if (get().presentationMode) return
        pushHistory(get)
        set({
          items: get().items.filter((p) => p.uid !== id),
          selectedUid: get().selectedUid === id ? null : get().selectedUid,
        })
      },

      applyPaint: (catalogId) => {
        if (get().presentationMode) return
        const c = CATALOG.find((i) => i.id === catalogId)
        if (!c) return
        pushHistory(get)
        const room = get().activeRoom()
        const wallM2 =
          Math.ceil(
            (((room.widthMm + room.depthMm) * 2 * room.heightMm) / 1_000_000) * 10,
          ) / 10
        const without = get().items.filter((p) => {
          if (p.roomId !== room.id) return true
          const it = resolveItem(p)
          return !(it?.category === 'duvar' && it.unit === 'm2')
        })
        set({
          house: {
            ...get().house,
            rooms: get().house.rooms.map((r) =>
              r.id === room.id ? { ...r, wallColor: c.color } : r,
            ),
          },
          items: [
            ...without,
            {
              uid: uid(),
              catalogId,
              roomId: room.id,
              xMm: 0,
              yMm: 0,
              elevMm: 0,
              rotation: 0,
              qty: wallM2,
              locked: true,
            },
          ],
          pendingCatalogId: null,
        })
      },

      applyFloor: (catalogId) => {
        if (get().presentationMode) return
        const c = CATALOG.find((i) => i.id === catalogId)
        if (!c) return
        pushHistory(get)
        const room = get().activeRoom()
        const area = Math.ceil(((room.widthMm * room.depthMm) / 1_000_000) * 10) / 10
        const without = get().items.filter((p) => {
          if (p.roomId !== room.id) return true
          const it = resolveItem(p)
          return !(it?.category === 'zemin' && it.unit === 'm2')
        })
        set({
          house: {
            ...get().house,
            rooms: get().house.rooms.map((r) =>
              r.id === room.id ? { ...r, floorColor: c.color } : r,
            ),
          },
          items: [
            ...without,
            {
              uid: uid(),
              catalogId,
              roomId: room.id,
              xMm: 0,
              yMm: 0,
              elevMm: 0,
              rotation: 0,
              qty: area,
              locked: true,
            },
          ],
          pendingCatalogId: null,
        })
      },

      lockPromise: () => {
        pushHistory(get)
        set({
          promisedItems: structuredClone(get().items),
          viewMode: 'proof',
          proofMode: 'vaat',
        })
      },

      simulateDelivery: () => {
        pushHistory(get)
        const base = structuredClone(get().promisedItems ?? get().items)
        const delivered = base.map((p, i) => {
          if (i % 4 === 0 && !p.locked) {
            return { ...p, xMm: p.xMm + 120, yMm: p.yMm + 40 }
          }
          return p
        })
        const paint = delivered.find((p) => resolveItem(p)?.category === 'duvar')
        if (paint) {
          const alt = CATALOG.find((c) => c.category === 'duvar' && c.id !== paint.catalogId)
          if (alt) paint.catalogId = alt.id
        }
        set({ deliveredItems: delivered, viewMode: 'proof', proofMode: 'fark' })
      },

      resetHouse: () => {
        get().resetProject()
      },

      resetProject: () => {
        clearHistory()
        set({
          house: structuredClone(DEMO_HOUSE),
          activeRoomId: DEMO_HOUSE.rooms[0]?.id ?? 'salon',
          items: [],
          selectedUid: null,
          pendingCatalogId: null,
          promisedItems: null,
          deliveredItems: null,
          viewMode: 'live',
          proofMode: 'vaat',
          roomLocked: false,
          presentationMode: false,
          presentationBackup: null,
          selectedWall: null,
          designOpen: false,
          assetsOpen: false,
          poseDetailOpen: false,
          transformDragging: false,
          brandFilter: null,
          subcategoryFilter: null,
          tool: 'hand',
          transformMode: 'translate',
          // userAssets, customCategories, hiddenCatalogIds bilinçli olarak korunur
        })
      },

      seedRoomFurniture: () => {
        pushHistory(get)
        withoutHistory(() => {
          const room = get().activeRoom()
          get().applyFloor(room.id === 'yatak' ? 'parke-ceviz' : 'lam-oak-8')
          get().applyPaint(room.id === 'yatak' ? 'boya-kirec' : 'boya-sage')
          if (room.id === 'salon' || room.name.toLowerCase().includes('salon')) {
            get().addItem('koltuk-3', 400, 2800)
            get().addItem('masa-yemek', 2800, 1400)
            get().addItem('avize-line', 2000, 1800)
          } else if (room.id === 'yatak') {
            get().addItem('yatak-160', 900, 700)
            get().addItem('spot-6', 1600, 1400)
          }
        })
      },

      canUndo: () => historyPast.length > 0,
      canRedo: () => historyFuture.length > 0,

      undo: () => {
        if (get().presentationMode) return
        if (!historyPast.length) return
        historyFuture.push(cloneDoc(get()))
        const snap = historyPast.pop()!
        set({
          house: snap.house,
          activeRoomId: snap.activeRoomId,
          items: snap.items,
          selectedUid: snap.selectedUid,
          promisedItems: snap.promisedItems,
          deliveredItems: snap.deliveredItems,
          hiddenCatalogIds: snap.hiddenCatalogIds,
          pendingCatalogId: null,
          transformDragging: false,
          poseDetailOpen: false,
        })
      },

      redo: () => {
        if (get().presentationMode) return
        if (!historyFuture.length) return
        historyPast.push(cloneDoc(get()))
        const snap = historyFuture.pop()!
        set({
          house: snap.house,
          activeRoomId: snap.activeRoomId,
          items: snap.items,
          selectedUid: snap.selectedUid,
          promisedItems: snap.promisedItems,
          deliveredItems: snap.deliveredItems,
          hiddenCatalogIds: snap.hiddenCatalogIds,
          pendingCatalogId: null,
          transformDragging: false,
          poseDetailOpen: false,
        })
      },
    }),
    {
      name: 'emlakvr-house-v2',
      partialize: (s) => ({
        house: s.house,
        activeRoomId: s.activeRoomId,
        items: s.items,
        userAssets: s.userAssets,
        customCategories: s.customCategories,
        hiddenCatalogIds: s.hiddenCatalogIds,
        promisedItems: s.promisedItems,
        deliveredItems: s.deliveredItems,
        snapMm: 10,
        showMeasures: s.showMeasures,
        // roomLocked persist etme — kilitli dis kamera duvara yapisir
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as object),
        snapMm: 10,
        // Yesil/gri ekran kurtarma: her yuklemede duzenleme + kilit acik
        presentationMode: false,
        presentationBackup: null,
        transformDragging: false,
        roomLocked: false,
        assetsOpen: false,
        designOpen: false,
      }),
    },
  ),
)
