import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Html, OrbitControls, TransformControls, useGLTF } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import type { CatalogItem } from '../data/catalog'
import { isCeilingVisible, type RoomDef, type WallIndex } from '../data/house'
import { getAssetObjectUrl } from '../lib/assetsDb'
import { buildWallMeshes, clampCameraInRoom } from '../lib/roomGeometry'
import { footprintExtents, getItemClearances } from '../lib/roomBounds'
import { resolveItem, useAppStore, type PlacedItem } from '../store/useAppStore'

const MM = 0.001
/** Gosterim: ayakta goz yuksekligi (metre, zemin y=0) */
const STAND_EYE = 1.65

function roomSizeM(room: RoomDef) {
  return { w: room.widthMm * MM, d: room.depthMm * MM, h: room.heightMm * MM }
}

function clampStandingXZ(room: RoomDef, x: number, z: number, margin = 0.45): [number, number] {
  const { w, d } = roomSizeM(room)
  return [
    THREE.MathUtils.clamp(x, margin, Math.max(margin, w - margin)),
    THREE.MathUtils.clamp(z, margin, Math.max(margin, d - margin)),
  ]
}

/** Gosterim: Orbit sahneede kalir; kamera ayakta tutulur */
function PresentCamera({
  room,
  orbitRef,
}: {
  room: RoomDef
  orbitRef: RefObject<OrbitControlsImpl | null>
}) {
  const on = useAppStore((s) => s.presentationMode)
  const { camera, gl } = useThree()
  const yaw = useRef(0)
  const pitch = useRef(0)
  const ready = useRef(false)
  const pos = useRef(new THREE.Vector3())
  const armed = useRef(false)
  const dragging = useRef(false)
  const prev = useRef({ x: 0, y: 0 })
  const euler = useMemo(() => new THREE.Euler(0, 0, 0, 'YXZ'), [])
  const forward = useMemo(() => new THREE.Vector3(), [])
  const right = useMemo(() => new THREE.Vector3(), [])
  const quat = useMemo(() => new THREE.Quaternion(), [])

  const resetStanding = () => {
    const { w, d } = roomSizeM(room)
    const x = w * 0.5
    const z = THREE.MathUtils.clamp(d * 0.3, 0.6, Math.max(0.6, d - 0.6))
    pos.current.set(x, STAND_EYE, z)
    pitch.current = 0
    yaw.current = z < d * 0.5 ? Math.PI : 0
    ready.current = true
    const persp = camera as THREE.PerspectiveCamera
    if ('fov' in persp) {
      persp.fov = 70
      persp.near = 0.05
      persp.far = 120
      persp.updateProjectionMatrix()
    }
    const oc = orbitRef.current
    if (oc) {
      oc.enabled = false
      oc.enableDamping = false
    }
  }

  useLayoutEffect(() => {
    const oc = orbitRef.current
    if (!on) {
      ready.current = false
      if (oc) {
        oc.enabled = true
        oc.enableDamping = true
      }
      const persp = camera as THREE.PerspectiveCamera
      if ('fov' in persp) {
        persp.fov = 50
        persp.updateProjectionMatrix()
      }
      return
    }
    resetStanding()
  }, [on, room.id, room.widthMm, room.depthMm, camera, orbitRef])

  useEffect(() => {
    if (!on) return
    const el = gl.domElement
    el.style.cursor = 'grab'
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      armed.current = true
      dragging.current = false
      prev.current = { x: e.clientX, y: e.clientY }
      el.style.cursor = 'grabbing'
    }
    const onUp = () => {
      armed.current = false
      dragging.current = false
      el.style.cursor = 'grab'
    }
    const onMove = (e: PointerEvent) => {
      if (!armed.current && !dragging.current) return
      const dx = e.clientX - prev.current.x
      const dy = e.clientY - prev.current.y
      if (armed.current && !dragging.current) {
        if (Math.abs(dx) + Math.abs(dy) < 2) return
        dragging.current = true
        armed.current = false
      }
      if (!dragging.current) return
      prev.current = { x: e.clientX, y: e.clientY }
      const hh = el.clientHeight || 1
      yaw.current -= ((2 * Math.PI * dx) / hh) * 0.55
      pitch.current -= ((2 * Math.PI * dy) / hh) * 0.4
      pitch.current = Math.max(-0.7, Math.min(0.5, pitch.current))
    }
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return
      if (!ready.current) return
      const step = e.shiftKey ? 0.3 : 0.15
      euler.set(pitch.current, yaw.current, 0, 'YXZ')
      forward.set(0, 0, -1).applyEuler(euler)
      forward.y = 0
      if (forward.lengthSq() < 1e-8) forward.set(Math.sin(yaw.current), 0, Math.cos(yaw.current))
      forward.normalize()
      right.set(forward.z, 0, -forward.x)
      let moved = false
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault()
        pos.current.addScaledVector(forward, step)
        moved = true
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault()
        pos.current.addScaledVector(forward, -step)
        moved = true
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        pos.current.addScaledVector(right, -step)
        moved = true
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        pos.current.addScaledVector(right, step)
        moved = true
      }
      if (!moved) return
      const [x, z] = clampStandingXZ(room, pos.current.x, pos.current.z)
      pos.current.set(x, STAND_EYE, z)
    }
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('keydown', onKey)
    return () => {
      el.style.cursor = ''
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('keydown', onKey)
    }
  }, [on, gl, room, euler, forward, right])

  useFrame(() => {
    if (!on || !ready.current) return
    const oc = orbitRef.current
    if (oc) oc.enabled = false
    const [x, z] = clampStandingXZ(room, pos.current.x, pos.current.z)
    pos.current.set(x, STAND_EYE, z)
    camera.position.copy(pos.current)
    euler.set(pitch.current, yaw.current, 0, 'YXZ')
    quat.setFromEuler(euler)
    camera.quaternion.copy(quat)
    camera.up.set(0, 1, 0)
  })

  return null
}

function alignModelToFootprint(model: THREE.Object3D): THREE.Box3 {
  model.updateWorldMatrix(true, true)
  const box = new THREE.Box3().setFromObject(model)
  if (box.isEmpty()) return box
  model.position.x -= (box.min.x + box.max.x) / 2
  model.position.y -= box.min.y
  model.position.z -= (box.min.z + box.max.z) / 2
  model.updateWorldMatrix(true, true)
  return new THREE.Box3().setFromObject(model)
}

/** Oda meshâ€™i: min kÃ¶ÅŸeyi (0,0,0)â€™a oturtur */
function alignModelToCorner(model: THREE.Object3D): THREE.Box3 {
  model.updateWorldMatrix(true, true)
  const box = new THREE.Box3().setFromObject(model)
  if (box.isEmpty()) return box
  model.position.x -= box.min.x
  model.position.y -= box.min.y
  model.position.z -= box.min.z
  model.updateWorldMatrix(true, true)
  return new THREE.Box3().setFromObject(model)
}

function useAlignedGlb(url: string, mode: 'footprint' | 'corner' = 'footprint') {
  const { scene } = useGLTF(url)
  return useMemo(() => {
    const root = new THREE.Group()
    const model = scene.clone(true)
    root.add(model)
    if (mode === 'corner') alignModelToCorner(model)
    else alignModelToFootprint(model)
    return root
  }, [scene, mode])
}

function useRoomItems() {
  const items = useAppStore((s) => s.items)
  const activeRoomId = useAppStore((s) => s.activeRoomId)
  return useMemo(() => items.filter((i) => i.roomId === activeRoomId), [items, activeRoomId])
}

function RoomSceneGlb({ url }: { url: string }) {
  const root = useAlignedGlb(url, 'corner')
  const updateActiveRoom = useAppStore((s) => s.updateActiveRoom)
  const fitted = useRef(false)

  useLayoutEffect(() => {
    if (fitted.current) return
    root.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(root)
    if (box.isEmpty()) return
    const size = box.getSize(new THREE.Vector3())
    fitted.current = true
    updateActiveRoom(
      {
        widthMm: Math.max(1, Math.round(size.x * 1000)),
        depthMm: Math.max(1, Math.round(size.z * 1000)),
        heightMm: Math.max(1, Math.round(size.y * 1000)),
      },
      { history: false },
    )
  }, [root, updateActiveRoom])

  return <primitive object={root} />
}

function RoomEnvironment({ room }: { room: RoomDef }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const raw = room.sceneModelUrl
    if (!raw) {
      setUrl(null)
      return
    }
    if (raw.startsWith('idb:')) {
      getAssetObjectUrl(raw.slice(4)).then((u) => {
        if (alive) setUrl(u)
      })
    } else {
      setUrl(raw)
    }
    return () => {
      alive = false
    }
  }, [room.sceneModelUrl])

  return (
    <>
      {url ? (
        <GlbSafe fallback={<RoomBox room={room} />}>
          <Suspense fallback={<RoomBox room={room} />}>
            <RoomSceneGlb url={url} />
          </Suspense>
        </GlbSafe>
      ) : (
        <RoomBox room={room} />
      )}
      <CeilingLayer room={room} />
    </>
  )
}

function CeilingGlb({ url, room }: { url: string; room: RoomDef }) {
  const root = useAlignedGlb(url)
  const w = room.widthMm * MM
  const d = room.depthMm * MM
  const h = room.heightMm * MM

  return <primitive object={root} position={[w / 2, h, d / 2]} />
}

function CeilingPlane({ room }: { room: RoomDef }) {
  const w = room.widthMm * MM
  const d = room.depthMm * MM
  const h = room.heightMm * MM
  const color = room.ceilingColor ?? '#f0ece4'
  // Ä°nce kutu: iÃ§eriden (aÅŸaÄŸÄ±dan) net gÃ¶rÃ¼nÃ¼r
  return (
    <mesh position={[w / 2, h - 0.025, d / 2]} castShadow={false} receiveShadow>
      <boxGeometry args={[w, 0.05, d]} />
      <meshLambertMaterial color={color} />
    </mesh>
  )
}

function CeilingLayer({ room }: { room: RoomDef }) {
  const [url, setUrl] = useState<string | null>(null)
  const visible = isCeilingVisible(room)

  useEffect(() => {
    let alive = true
    const raw = room.ceilingModelUrl
    if (!raw || !visible) {
      setUrl(null)
      return
    }
    if (raw.startsWith('idb:')) {
      getAssetObjectUrl(raw.slice(4)).then((u) => {
        if (alive) setUrl(u)
      })
    } else {
      setUrl(raw)
    }
    return () => {
      alive = false
    }
  }, [room.ceilingModelUrl, visible])

  if (!visible) return null

  // Tam oda GLB varsa varsayÄ±lan dÃ¼z tavanÄ± gÃ¶sterme; sadece Ã¶zel tavan modeli
  if (room.sceneModelUrl && !room.ceilingModelUrl) return null

  if (url) {
    return (
      <GlbSafe fallback={<CeilingPlane room={room} />}>
        <Suspense fallback={<CeilingPlane room={room} />}>
          <CeilingGlb url={url} room={room} />
        </Suspense>
      </GlbSafe>
    )
  }

  if (room.sceneModelUrl) return null

  return <CeilingPlane room={room} />
}

function RoomBox({ room }: { room: RoomDef }) {
  const selectedWall = useAppStore((s) => s.selectedWall)
  const setSelectedWall = useAppStore((s) => s.setSelectedWall)
  const designOpen = useAppStore((s) => s.designOpen)
  const { panels, extras, w, d, h } = useMemo(() => buildWallMeshes(room), [room])

  const pickWall = (wall: WallIndex, e: ThreeEvent<MouseEvent>) => {
    if (!designOpen) return
    e.stopPropagation()
    setSelectedWall(selectedWall === wall ? null : wall)
  }

  // TÄ±klanabilir gÃ¶rÃ¼nmez duvar seÃ§iciler (oda paneli aÃ§Ä±kken)
  const pickers: { wall: WallIndex; pos: [number, number, number]; size: [number, number, number] }[] = [
    { wall: 0, pos: [0, h / 2, -d / 2], size: [w, h, 0.08] },
    { wall: 2, pos: [0, h / 2, d / 2], size: [w, h, 0.08] },
    { wall: 3, pos: [-w / 2, h / 2, 0], size: [0.08, h, d] },
    { wall: 1, pos: [w / 2, h / 2, 0], size: [0.08, h, d] },
  ]

  return (
    <group position={[w / 2, 0, d / 2]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshLambertMaterial color={room.floorColor} />
      </mesh>
      {panels.map((p) => (
        <mesh key={p.key} position={p.position}>
          <boxGeometry args={p.size} />
          <meshLambertMaterial color={room.wallColor} />
        </mesh>
      ))}
      {extras.map((p) => (
        <mesh key={p.key} position={p.position}>
          <boxGeometry args={p.size} />
          <meshLambertMaterial color={room.wallColor} />
        </mesh>
      ))}
      {designOpen &&
        pickers.map((p) => (
          <mesh
            key={`pick-${p.wall}`}
            position={p.pos}
            onClick={(e) => pickWall(p.wall, e)}
          >
            <boxGeometry args={p.size} />
            <meshBasicMaterial
              color={selectedWall === p.wall ? '#c9854a' : '#ffffff'}
              transparent
              opacity={selectedWall === p.wall ? 0.22 : 0.01}
              depthWrite={false}
            />
          </mesh>
        ))}
    </group>
  )
}

function CameraConfine({ room }: { room: RoomDef }) {
  const locked = useAppStore((s) => s.roomLocked)
  const presentationMode = useAppStore((s) => s.presentationMode)
  const { camera } = useThree()

  useFrame(() => {
    // Duzenlemede dis kamera serbest; kilitleme sadece yururken WalkKeys'te.
    // Burada clamp etmek kamerayi duvara yapistirip gri/yesil ekran yapiyordu.
    if (presentationMode || !locked) return
    const { w, d } = roomSizeM(room)
    const outside =
      camera.position.x < -0.2 ||
      camera.position.x > w + 0.2 ||
      camera.position.z < -0.2 ||
      camera.position.z > d + 0.2
    if (outside) return
    const [x, y, z] = clampCameraInRoom(room, camera.position.x, camera.position.y, camera.position.z)
    camera.position.set(x, y, z)
  })

  return null
}

function Measures({ room }: { room: RoomDef }) {
  const show = useAppStore((s) => s.showMeasures)
  if (!show) return null
  const w = room.widthMm * MM
  const d = room.depthMm * MM
  const h = room.heightMm * MM
  return (
    <>
      <Html position={[w / 2, 0.08, 0.12]} center style={{ pointerEvents: 'none' }}>
        <div className="measure-tag">{room.widthMm} mm</div>
      </Html>
      <Html position={[0.12, 0.08, d / 2]} center style={{ pointerEvents: 'none' }}>
        <div className="measure-tag">{room.depthMm} mm</div>
      </Html>
      <Html position={[0.2, h / 2, 0.2]} center style={{ pointerEvents: 'none' }}>
        <div className="measure-tag">H {room.heightMm} mm</div>
      </Html>
    </>
  )
}

function BoxMesh({ catalog, selected }: { catalog: CatalogItem; selected: boolean }) {
  const w = catalog.widthMm * MM
  const d = catalog.depthMm * MM
  const h = (catalog.heightMm ?? 600) * MM
  return (
    <mesh position={[0, h / 2, 0]}>
      <boxGeometry args={[w, h, d]} />
      <meshLambertMaterial color={selected ? '#c9854a' : catalog.color} />
    </mesh>
  )
}

function GlbMesh({ url, catalog }: { url: string; catalog: CatalogItem }) {
  const root = useAlignedGlb(url)
  const updateUserAsset = useAppStore((s) => s.updateUserAsset)
  const synced = useRef(false)

  useLayoutEffect(() => {
    if (synced.current || !catalog.id.startsWith('user_')) return
    synced.current = true
    root.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(root)
    if (box.isEmpty()) return
    const size = box.getSize(new THREE.Vector3())
    const assetId = 'assetId' in catalog ? (catalog as { assetId: string }).assetId : catalog.id.slice(5)
    const widthMm = Math.max(1, Math.round(size.x * 1000))
    const depthMm = Math.max(1, Math.round(size.z * 1000))
    const heightMm = Math.max(1, Math.round(size.y * 1000))
    if (
      Math.abs(widthMm - catalog.widthMm) > 2 ||
      Math.abs(depthMm - catalog.depthMm) > 2 ||
      Math.abs(heightMm - (catalog.heightMm ?? 0)) > 2
    ) {
      updateUserAsset(assetId, { widthMm, depthMm, heightMm })
    }
  }, [root, catalog, updateUserAsset])

  return <primitive object={root} />
}

class GlbSafe extends Component<{ fallback: ReactNode; children: ReactNode }, { ok: boolean }> {
  state = { ok: true }
  static getDerivedStateFromError() {
    return { ok: false }
  }
  render() {
    return this.state.ok ? this.props.children : this.props.fallback
  }
}

function ItemVisual({ catalog, selected }: { catalog: CatalogItem; selected: boolean }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const raw = catalog.modelUrl
    if (!raw) {
      setUrl(null)
      return
    }
    // Sadece IndexedDB modelleri â€” eksik /models/*.glb sahneyi Ã§Ã¶kertmesin
    if (raw.startsWith('idb:')) {
      getAssetObjectUrl(raw.slice(4)).then((u) => {
        if (alive) setUrl(u)
      })
    } else if (raw.startsWith('blob:')) {
      setUrl(raw)
    } else {
      setUrl(null)
    }
    return () => {
      alive = false
    }
  }, [catalog.modelUrl])

  if (url) {
    return (
      <GlbSafe fallback={<BoxMesh catalog={catalog} selected={selected} />}>
        <Suspense fallback={<BoxMesh catalog={catalog} selected={selected} />}>
          <GlbMesh url={url} catalog={catalog} />
        </Suspense>
      </GlbSafe>
    )
  }
  return <BoxMesh catalog={catalog} selected={selected} />
}

function ItemBox({
  item,
  catalog,
  selected,
  onGroup,
}: {
  item: PlacedItem
  catalog: CatalogItem
  selected: boolean
  onGroup: (uid: string, el: THREE.Group | null) => void
}) {
  const select = useAppStore((s) => s.select)
  const pending = useAppStore((s) => s.pendingCatalogId)
  const showMeasures = useAppStore((s) => s.showMeasures)
  const presentationMode = useAppStore((s) => s.presentationMode)
  const setItemPose = useAppStore((s) => s.setItemPose)
  const setTransformDragging = useAppStore((s) => s.setTransformDragging)
  const room = useAppStore((s) => s.activeRoom())
  const { gl, camera } = useThree()
  const dragging = useRef(false)
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const hit = useMemo(() => new THREE.Vector3(), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])

  const w = catalog.widthMm * MM
  const d = catalog.depthMm * MM
  const h = (catalog.heightMm ?? 600) * MM
  const dims = {
    widthMm: catalog.widthMm,
    depthMm: catalog.depthMm,
    heightMm: catalog.heightMm ?? 600,
  }
  const clear = selected ? getItemClearances(room, dims, item) : null
  const { extentX, extentZ } = footprintExtents(dims.widthMm, dims.depthMm, item.rotation)

  useEffect(() => {
    const onMove = (ev: PointerEvent) => {
      if (!dragging.current) return
      const live = useAppStore.getState().items.find((i) => i.uid === item.uid)
      if (!live) return
      const rect = gl.domElement.getBoundingClientRect()
      ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
      ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(ndc, camera)
      plane.constant = -((live.elevMm ?? 0) * MM)
      if (!raycaster.ray.intersectPlane(plane, hit)) return
      setItemPose(
        item.uid,
        hit.x / MM - catalog.widthMm / 2,
        hit.z / MM - catalog.depthMm / 2,
        live.elevMm ?? 0,
        live.rotation,
        live.pitch ?? 0,
        live.roll ?? 0,
      )
    }
    const onUp = () => {
      if (!dragging.current) return
      dragging.current = false
      setTransformDragging(false)
      gl.domElement.style.cursor = ''
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [
    item.uid,
    catalog.widthMm,
    catalog.depthMm,
    gl,
    camera,
    setItemPose,
    setTransformDragging,
    raycaster,
    plane,
    hit,
    ndc,
  ])

  return (
    <group
      ref={(el) => onGroup(item.uid, el)}
      position={[item.xMm * MM + w / 2, (item.elevMm ?? 0) * MM, item.yMm * MM + d / 2]}
      rotation={[
        ((item.pitch ?? 0) * Math.PI) / 180,
        (-item.rotation * Math.PI) / 180,
        ((item.roll ?? 0) * Math.PI) / 180,
      ]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        if (presentationMode || pending) return
        select(item.uid)
      }}
      onPointerDown={(e) => {
        if (presentationMode || pending || item.locked) return
        e.stopPropagation()
        ;(e.nativeEvent as PointerEvent).stopImmediatePropagation?.()
        select(item.uid)
        dragging.current = true
        setTransformDragging(true)
        gl.domElement.style.cursor = 'grabbing'
      }}
    >
      <ItemVisual catalog={catalog} selected={selected} />
      {showMeasures && !selected && (
        <Html position={[0, h + 0.12, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="measure-tag">
            {catalog.widthMm}Ã—{catalog.depthMm}
          </div>
        </Html>
      )}
      {selected && clear && (
        <group rotation={[0, (item.rotation * Math.PI) / 180, 0]}>
          <Html position={[-(extentX * MM + 0.08), h * 0.45, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="measure-tag measure-clear">Sol {Math.round(clear.leftMm / 10)} cm</div>
          </Html>
          <Html position={[extentX * MM + 0.08, h * 0.45, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="measure-tag measure-clear">SaÄŸ {Math.round(clear.rightMm / 10)} cm</div>
          </Html>
          <Html position={[0, h * 0.45, -(extentZ * MM + 0.08)]} center style={{ pointerEvents: 'none' }}>
            <div className="measure-tag measure-clear">Arka {Math.round(clear.backMm / 10)} cm</div>
          </Html>
          <Html position={[0, h * 0.45, extentZ * MM + 0.08]} center style={{ pointerEvents: 'none' }}>
            <div className="measure-tag measure-clear">Ã–n {Math.round(clear.frontMm / 10)} cm</div>
          </Html>
          <Html position={[0, -0.1, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="measure-tag measure-clear">Yerden {Math.round(clear.floorMm / 10)} cm</div>
          </Html>
          <Html position={[0, h + 0.14, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="measure-tag measure-clear">Tavan {Math.round(clear.ceilingMm / 10)} cm</div>
          </Html>
        </group>
      )}
    </group>
  )
}

function FloorPlace() {
  const room = useAppStore((s) => s.activeRoom())
  const pendingId = useAppStore((s) => s.pendingCatalogId)
  const presentationMode = useAppStore((s) => s.presentationMode)
  const addItem = useAppStore((s) => s.addItem)
  const select = useAppStore((s) => s.select)
  const getCatalogById = useAppStore((s) => s.getCatalogById)
  const setTransformDragging = useAppStore((s) => s.setTransformDragging)
  const { gl, camera } = useThree()
  const placing = useRef(false)
  const ghostRef = useRef<{ xMm: number; yMm: number } | null>(null)
  const [ghost, setGhost] = useState<{ xMm: number; yMm: number } | null>(null)
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const hit = useMemo(() => new THREE.Vector3(), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])
  const w = room.widthMm * MM
  const d = room.depthMm * MM
  const catalog = pendingId ? getCatalogById(pendingId) : undefined

  const pointToPose = useMemo(() => {
    return (clientX: number, clientY: number) => {
      const cat = pendingId ? useAppStore.getState().getCatalogById(pendingId) : undefined
      if (!cat) return null
      const r = useAppStore.getState().activeRoom()
      const snap = useAppStore.getState().snapMm
      const rect = gl.domElement.getBoundingClientRect()
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(ndc, camera)
      if (!raycaster.ray.intersectPlane(plane, hit)) return null
      const sn = (v: number) => Math.round(v / snap) * snap
      return {
        xMm: sn(THREE.MathUtils.clamp(hit.x / MM - cat.widthMm / 2, 0, r.widthMm - cat.widthMm)),
        yMm: sn(THREE.MathUtils.clamp(hit.z / MM - cat.depthMm / 2, 0, r.depthMm - cat.depthMm)),
      }
    }
  }, [pendingId, gl, camera, raycaster, plane, hit, ndc])

  useEffect(() => {
    if (!pendingId || presentationMode) {
      placing.current = false
      ghostRef.current = null
      setGhost(null)
      return
    }
    const onMove = (ev: PointerEvent) => {
      if (!placing.current) return
      const pose = pointToPose(ev.clientX, ev.clientY)
      if (pose) {
        ghostRef.current = pose
        setGhost(pose)
      }
    }
    const onUp = (ev: PointerEvent) => {
      if (!placing.current) return
      const pid = useAppStore.getState().pendingCatalogId
      placing.current = false
      setTransformDragging(false)
      gl.domElement.style.cursor = pid ? 'crosshair' : ''
      if (!pid) {
        ghostRef.current = null
        setGhost(null)
        return
      }
      const pose = pointToPose(ev.clientX, ev.clientY) ?? ghostRef.current
      ghostRef.current = null
      setGhost(null)
      if (pose) addItem(pid, pose.xMm, pose.yMm)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [pendingId, presentationMode, pointToPose, addItem, setTransformDragging, gl])

  useEffect(() => {
    gl.domElement.style.cursor = pendingId && !presentationMode ? 'crosshair' : ''
    return () => {
      gl.domElement.style.cursor = ''
    }
  }, [pendingId, presentationMode, gl])

  if (presentationMode) return null

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[w / 2, 0.002, d / 2]}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          if (!pendingId || !catalog) {
            select(null)
            return
          }
          placing.current = true
          setTransformDragging(true)
          gl.domElement.style.cursor = 'grabbing'
          const pose = pointToPose(e.nativeEvent.clientX, e.nativeEvent.clientY)
          if (pose) {
            ghostRef.current = pose
            setGhost(pose)
          }
        }}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          if (!pendingId) select(null)
        }}
      >
        <planeGeometry args={[w, d]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {ghost && catalog && (
        <group
          position={[
            ghost.xMm * MM + (catalog.widthMm * MM) / 2,
            ((catalog.heightMm ?? 600) * MM) / 2,
            ghost.yMm * MM + (catalog.depthMm * MM) / 2,
          ]}
        >
          <mesh>
            <boxGeometry
              args={[catalog.widthMm * MM, (catalog.heightMm ?? 600) * MM, catalog.depthMm * MM]}
            />
            <meshBasicMaterial color={catalog.color} transparent opacity={0.4} depthWrite={false} />
          </mesh>
        </group>
      )}
    </>
  )
}

/** Duzenleme: odanin disindan 3/4 bakis. Gosterimde PresentCamera yazar. */
function CameraRig({
  room,
  orbitRef,
}: {
  room: RoomDef
  orbitRef: RefObject<OrbitControlsImpl | null>
}) {
  const { camera } = useThree()
  const presentationMode = useAppStore((s) => s.presentationMode)
  const { w, d, h } = roomSizeM(room)
  const applyUntil = useRef(0)

  const applyExterior = () => {
    const oc = orbitRef.current
    const tx = w * 0.5
    const ty = h * 0.28
    const tz = d * 0.5
    // Guvenli mesafe: odaya yapismasin (yesil/gri duvar ekrani)
    const dist = Math.max(4.5, Math.max(w, d) * 1.15)
    camera.position.set(tx + dist * 0.42, Math.max(h * 0.75, 2.2), tz + dist * 0.78)
    camera.up.set(0, 1, 0)
    const persp = camera as THREE.PerspectiveCamera
    if ('fov' in persp) {
      persp.fov = 50
      persp.near = 0.05
      persp.far = 120
      persp.updateProjectionMatrix()
    }
    if (oc) {
      oc.target.set(tx, ty, tz)
      oc.minDistance = Math.max(1.8, Math.min(w, d) * 0.35)
      oc.maxDistance = Math.max(28, dist * 3)
      oc.minPolarAngle = 0.25
      oc.maxPolarAngle = Math.PI * 0.48
      oc.enableZoom = true
      oc.enablePan = true
      oc.enableDamping = true
      oc.enabled = true
      oc.update()
    } else {
      camera.lookAt(tx, ty, tz)
    }
  }

  useLayoutEffect(() => {
    if (presentationMode) {
      applyUntil.current = 0
      return
    }
    applyExterior()
    // OrbitControls ilk karelerde kamerayi ezmesin
    applyUntil.current = performance.now() + 400
  }, [camera, w, d, h, room.id, presentationMode, orbitRef])

  useFrame(() => {
    if (presentationMode) return
    if (performance.now() > applyUntil.current) return
    applyExterior()
  })

  return null
}

function Scene() {
  const room = useAppStore((s) => s.activeRoom())
  const items = useRoomItems()
  const selectedUid = useAppStore((s) => s.selectedUid)
  const transformMode = useAppStore((s) => s.transformMode)
  const presentationMode = useAppStore((s) => s.presentationMode)
  const setItemPose = useAppStore((s) => s.setItemPose)
  const setTransformDragging = useAppStore((s) => s.setTransformDragging)
  const groups = useRef(new Map<string, THREE.Group>())
  const orbitRef = useRef<OrbitControlsImpl>(null)
  const [gizmoTarget, setGizmoTarget] = useState<THREE.Object3D | null>(null)

  const w = room.widthMm * MM
  const d = room.depthMm * MM
  const h = room.heightMm * MM

  useEffect(() => {
    if (!selectedUid) {
      setGizmoTarget(null)
      if (orbitRef.current && !presentationMode) orbitRef.current.enabled = true
      return
    }
    if (presentationMode) {
      setGizmoTarget(null)
      return
    }
    const t = requestAnimationFrame(() => {
      setGizmoTarget(groups.current.get(selectedUid) ?? null)
    })
    return () => cancelAnimationFrame(t)
  }, [selectedUid, items, presentationMode])

  const selectedItem = items.find((i) => i.uid === selectedUid)
  const selectedCatalog = selectedItem ? resolveItem(selectedItem) : null

  return (
    <>
      <color attach="background" args={['#2a3330']} />
      <ambientLight intensity={0.95} />
      <hemisphereLight args={['#f5f0e8', '#3a4538', 0.45]} />
      <directionalLight position={[5, 9, 4]} intensity={0.85} />
      <directionalLight position={[w / 2, 1.2, d / 2]} intensity={0.35} />
      <CameraRig room={room} orbitRef={orbitRef} />
      <CameraConfine room={room} />
      <PresentCamera room={room} orbitRef={orbitRef} />
      <RoomEnvironment room={room} />
      <Measures room={room} />
      {!presentationMode && <FloorPlace />}

      {items.map((p) => {
        const c = resolveItem(p)
        if (!c || (c.unit === 'm2' && (c.category === 'zemin' || c.category === 'duvar'))) return null
        return (
          <ItemBox
            key={p.uid}
            item={p}
            catalog={c}
            selected={selectedUid === p.uid}
            onGroup={(uid, el) => {
              if (el) groups.current.set(uid, el)
              else groups.current.delete(uid)
            }}
          />
        )
      })}

      {gizmoTarget &&
        selectedItem &&
        selectedCatalog &&
        !selectedItem.locked &&
        !presentationMode &&
        transformMode === 'rotate' && (
        <TransformControls
          object={gizmoTarget}
          mode="rotate"
          showX
          showY
          showZ
          rotationSnap={Math.PI / 36}
          onMouseDown={() => {
            setTransformDragging(true)
            if (orbitRef.current) orbitRef.current.enabled = false
          }}
          onObjectChange={() => {
            const g = gizmoTarget
            if (!g) return
            const rotY = THREE.MathUtils.radToDeg(-g.rotation.y)
            const pitch = THREE.MathUtils.radToDeg(g.rotation.x)
            const roll = THREE.MathUtils.radToDeg(g.rotation.z)
            setItemPose(
              selectedItem.uid,
              selectedItem.xMm,
              selectedItem.yMm,
              selectedItem.elevMm ?? 0,
              rotY,
              pitch,
              roll,
            )
            const clamped = useAppStore.getState().items.find((i) => i.uid === selectedItem.uid)
            if (!clamped) return
            g.rotation.x = ((clamped.pitch ?? 0) * Math.PI) / 180
            g.rotation.y = (-clamped.rotation * Math.PI) / 180
            g.rotation.z = ((clamped.roll ?? 0) * Math.PI) / 180
          }}
          onMouseUp={() => {
            setTransformDragging(false)
            if (orbitRef.current) orbitRef.current.enabled = true
          }}
        />
      )}

      <OrbitControls
        ref={orbitRef}
        makeDefault
        target={[w / 2, h * 0.28, d / 2]}
        maxPolarAngle={Math.PI * 0.48}
        minPolarAngle={0.25}
        minDistance={Math.max(1.8, Math.min(w, d) * 0.35)}
        maxDistance={Math.max(28, Math.max(w, d) * 3.5)}
        zoomSpeed={1.2}
        rotateSpeed={0.9}
        panSpeed={0.9}
        enableDamping={!presentationMode}
        dampingFactor={0.08}
        enableRotate={false}
        enablePan={!presentationMode}
        enableZoom={!presentationMode}
      />
      {!presentationMode && <OrbitDragAxes orbitRef={orbitRef} />}
      {!presentationMode && <FocusAim orbitRef={orbitRef} />}
      {!presentationMode && <ZoomKeys orbitRef={orbitRef} />}
      {!presentationMode && <WalkKeys orbitRef={orbitRef} />}
    </>
  )
}

/** SeÃ§im yokken / gÃ¶sterimde ok tuÅŸlarÄ±yla odada yÃ¼rÃ¼ */
function WalkKeys({ orbitRef }: { orbitRef: RefObject<OrbitControlsImpl | null> }) {
  const { camera } = useThree()
  const selectedUid = useAppStore((s) => s.selectedUid)
  const pendingId = useAppStore((s) => s.pendingCatalogId)
  const presentationMode = useAppStore((s) => s.presentationMode)
  const room = useAppStore((s) => s.activeRoom())
  const locked = useAppStore((s) => s.roomLocked)
  const forward = useMemo(() => new THREE.Vector3(), [])
  const right = useMemo(() => new THREE.Vector3(), [])
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return
      if (!presentationMode && (selectedUid || pendingId)) return
      const oc = orbitRef.current
      if (!presentationMode && !oc?.enabled) return

      const step = e.shiftKey ? 0.28 : presentationMode ? 0.16 : 0.12
      camera.getWorldDirection(forward)
      forward.y = 0
      if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1)
      else forward.normalize()
      right.crossVectors(forward, up).normalize()

      let moved = false
      const delta = new THREE.Vector3()
      if (e.key === 'ArrowUp' || (presentationMode && (e.key === 'w' || e.key === 'W'))) {
        e.preventDefault()
        delta.addScaledVector(forward, step)
        moved = true
      } else if (e.key === 'ArrowDown' || (presentationMode && (e.key === 's' || e.key === 'S'))) {
        e.preventDefault()
        delta.addScaledVector(forward, -step)
        moved = true
      } else if (e.key === 'ArrowLeft' || (presentationMode && (e.key === 'a' || e.key === 'A'))) {
        e.preventDefault()
        delta.addScaledVector(right, -step)
        moved = true
      } else if (e.key === 'ArrowRight' || (presentationMode && (e.key === 'd' || e.key === 'D'))) {
        e.preventDefault()
        delta.addScaledVector(right, step)
        moved = true
      }
      if (!moved) return

      if (presentationMode) {
        const nx = camera.position.x + delta.x
        const nz = camera.position.z + delta.z
        const [x, z] = clampStandingXZ(room, nx, nz)
        camera.position.set(x, STAND_EYE, z)
        return
      }

      camera.position.add(delta)
      if (oc) oc.target.add(delta)
      if (locked) {
        const [x, y, z] = clampCameraInRoom(room, camera.position.x, camera.position.y, camera.position.z)
        const ox = x - camera.position.x
        const oy = y - camera.position.y
        const oz = z - camera.position.z
        camera.position.set(x, y, z)
        if (oc) {
          oc.target.x += ox
          oc.target.y += oy
          oc.target.z += oz
          oc.update()
        }
      } else if (oc) {
        oc.update()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [camera, orbitRef, selectedUid, pendingId, presentationMode, room, locked, forward, right, up])

  return null
}

/**
 * Orbit sÃ¼rÃ¼kleme: yatay ters, dikey doÄŸal (dÃ¼zenleme modu)
 */
function OrbitDragAxes({ orbitRef }: { orbitRef: RefObject<OrbitControlsImpl | null> }) {
  const { gl, camera } = useThree()
  const dragging = useRef(false)
  const armed = useRef(false)
  const prev = useRef({ x: 0, y: 0 })
  const spherical = useMemo(() => new THREE.Spherical(), [])
  const offset = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    const el = gl.domElement
    const speed = 0.9

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      if (useAppStore.getState().transformDragging) return
      if (useAppStore.getState().presentationMode) return
      const oc = orbitRef.current
      if (!oc?.enabled) return
      armed.current = true
      dragging.current = false
      prev.current = { x: e.clientX, y: e.clientY }
    }
    const onUp = () => {
      armed.current = false
      dragging.current = false
    }
    const onMove = (e: PointerEvent) => {
      if (useAppStore.getState().presentationMode) return
      const oc = orbitRef.current
      if (!oc?.enabled) return
      if (useAppStore.getState().transformDragging) {
        armed.current = false
        dragging.current = false
        return
      }
      if (!armed.current && !dragging.current) return

      const dx = e.clientX - prev.current.x
      const dy = e.clientY - prev.current.y
      if (armed.current && !dragging.current) {
        if (Math.abs(dx) + Math.abs(dy) < 3) return
        dragging.current = true
        armed.current = false
      }
      if (!dragging.current) return

      prev.current = { x: e.clientX, y: e.clientY }
      const h = el.clientHeight || 1

      offset.copy(camera.position).sub(oc.target)
      spherical.setFromVector3(offset)
      spherical.theta += ((2 * Math.PI * dx) / h) * speed
      spherical.phi -= ((2 * Math.PI * dy) / h) * speed
      spherical.phi = Math.max(0.08, Math.min(Math.PI - 0.08, spherical.phi))
      offset.setFromSpherical(spherical)
      camera.position.copy(oc.target).add(offset)
      oc.update()
    }

    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointermove', onMove)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointermove', onMove)
    }
  }, [gl, camera, orbitRef, spherical, offset])

  return null
}

/** + / - ile yakÄ±nlaÅŸ-uzaklaÅŸ (tekerleÄŸe ek) */
function ZoomKeys({ orbitRef }: { orbitRef: RefObject<OrbitControlsImpl | null> }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return
      const oc = orbitRef.current
      if (!oc) return
      const zoomIn = e.key === '+' || e.key === '=' || e.code === 'NumpadAdd'
      const zoomOut = e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract'
      if (!zoomIn && !zoomOut) return
      e.preventDefault()
      if (zoomIn) oc.dollyOut(1.2)
      else oc.dollyIn(1.2)
      oc.update()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [orbitRef])
  return null
}

/** Ã‡ift tÄ±k / seÃ§imde orbit hedefini noktaya al â€” priz gibi ayrÄ±ntÄ±ya zoom iÃ§in */
function FocusAim({ orbitRef }: { orbitRef: RefObject<OrbitControlsImpl | null> }) {
  const { gl, camera, scene } = useThree()
  const selectedUid = useAppStore((s) => s.selectedUid)
  const items = useAppStore((s) => s.items)
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const pointer = useMemo(() => new THREE.Vector2(), [])

  // SeÃ§ilen nesneye odaklan
  useEffect(() => {
    if (useAppStore.getState().presentationMode) return
    if (!selectedUid || !orbitRef.current) return
    const item = items.find((i) => i.uid === selectedUid)
    const c = item ? resolveItem(item) : null
    if (!item || !c) return
    const tx = item.xMm * MM + (c.widthMm * MM) / 2
    const ty = (item.elevMm ?? 0) * MM + ((c.heightMm ?? 600) * MM) / 2
    const tz = item.yMm * MM + (c.depthMm * MM) / 2
    orbitRef.current.target.set(tx, ty, tz)
    orbitRef.current.update()
  }, [selectedUid, items, orbitRef])

  useEffect(() => {
    const el = gl.domElement
    const onDbl = (e: MouseEvent) => {
      if (!orbitRef.current) return
      if (useAppStore.getState().presentationMode) return
      const rect = el.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(scene.children, true)
      const hit = hits.find((h) => h.object.visible && h.distance > 0)
      if (!hit) return
      orbitRef.current.target.copy(hit.point)
      // KamerayÄ± biraz yaklaÅŸtÄ±r
      const dir = new THREE.Vector3().subVectors(camera.position, hit.point).normalize()
      const dist = Math.max(0.01, Math.min(1.2, camera.position.distanceTo(hit.point) * 0.25))
      camera.position.copy(hit.point).addScaledVector(dir, dist)
      orbitRef.current.update()
    }
    el.addEventListener('dblclick', onDbl)
    return () => el.removeEventListener('dblclick', onDbl)
  }, [gl, camera, scene, orbitRef, raycaster, pointer])

  return null
}

export function RoomCanvas() {
  const room = useAppStore((s) => s.activeRoom())
  const w = room.widthMm * MM
  const d = room.depthMm * MM
  const h = room.heightMm * MM
  const wrapRef = useRef<HTMLDivElement>(null)
  const dist = Math.max(4.5, Math.max(w, d) * 1.15)

  return (
    <div className="immer-canvas" ref={wrapRef}>
      <Canvas
        key={room.id}
        frameloop="always"
        dpr={[1, 1.5]}
        resize={{ scroll: false, debounce: { resize: 0, scroll: 0 } }}
        camera={{
          position: [w * 0.5 + dist * 0.42, Math.max(h * 0.75, 2.2), d * 0.5 + dist * 0.78],
          fov: 50,
          near: 0.05,
          far: 120,
        }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false }}
        onCreated={({ camera, gl }) => {
          camera.lookAt(w / 2, h * 0.28, d / 2)
          gl.setClearColor('#2a3330', 1)
        }}
      >
        <Scene />
      </Canvas>
    </div>
  )
}
