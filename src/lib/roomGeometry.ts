import type { Niche, RoomDef, WallIndex, WallOpening } from '../data/house'

const MM = 0.001
const WALL_T = 0.06

type Seg = { start: number; end: number }

/** Duvar üzerindeki boşluk/girinti aralıklarını birleştirip kalan panelleri döndür */
function solidSegments(wallLenMm: number, cuts: { offsetMm: number; widthMm: number }[]): Seg[] {
  const sorted = [...cuts]
    .map((c) => ({
      a: Math.max(0, c.offsetMm),
      b: Math.min(wallLenMm, c.offsetMm + c.widthMm),
    }))
    .filter((c) => c.b > c.a)
    .sort((x, y) => x.a - y.a)

  const segs: Seg[] = []
  let cursor = 0
  for (const c of sorted) {
    if (c.a > cursor) segs.push({ start: cursor, end: c.a })
    cursor = Math.max(cursor, c.b)
  }
  if (cursor < wallLenMm) segs.push({ start: cursor, end: wallLenMm })
  return segs
}

function wallLen(room: RoomDef, wall: WallIndex) {
  return wall === 0 || wall === 2 ? room.widthMm : room.depthMm
}

/** Niche / opening geometrisi — RoomBox içinde kullanılır (metre, oda merkez orijinli) */
export function buildWallMeshes(room: RoomDef) {
  const w = room.widthMm * MM
  const d = room.depthMm * MM
  const h = room.heightMm * MM
  const niches = room.niches ?? []
  const openings = room.openings ?? []

  type Panel = {
    key: string
    position: [number, number, number]
    size: [number, number, number]
  }
  const panels: Panel[] = []
  const extras: Panel[] = []

  const walls: WallIndex[] = [0, 1, 2, 3]
  for (const wall of walls) {
    if ((room.hiddenWalls ?? []).includes(wall)) continue
    const len = wallLen(room, wall)
    const cuts = [
      ...openings.filter((o) => o.wall === wall).map((o) => ({ offsetMm: o.offsetMm, widthMm: o.widthMm })),
      ...niches
        .filter((n) => n.wall === wall && n.kind === 'recess')
        .map((n) => ({ offsetMm: n.offsetMm, widthMm: n.widthMm })),
    ]
    const segs = solidSegments(len, cuts)

    for (const [i, seg] of segs.entries()) {
      const mid = ((seg.start + seg.end) / 2) * MM
      const segW = (seg.end - seg.start) * MM
      if (segW < 0.001) continue
      if (wall === 0) {
        panels.push({
          key: `w0-${i}`,
          position: [-w / 2 + mid, h / 2, -d / 2],
          size: [segW, h, WALL_T],
        })
      } else if (wall === 2) {
        panels.push({
          key: `w2-${i}`,
          position: [-w / 2 + mid, h / 2, d / 2],
          size: [segW, h, WALL_T],
        })
      } else if (wall === 3) {
        panels.push({
          key: `w3-${i}`,
          position: [-w / 2, h / 2, -d / 2 + mid],
          size: [WALL_T, h, segW],
        })
      } else {
        panels.push({
          key: `w1-${i}`,
          position: [w / 2, h / 2, -d / 2 + mid],
          size: [WALL_T, h, segW],
        })
      }
    }

    // Girinti yan/arka yüzeyleri
    for (const n of niches.filter((x) => x.wall === wall && x.kind === 'recess')) {
      const depth = n.depthMm * MM
      const nw = n.widthMm * MM
      const nh = Math.min(n.heightMm, room.heightMm) * MM
      const mid = (n.offsetMm + n.widthMm / 2) * MM
      const y = nh / 2
      if (wall === 0) {
        const x = -w / 2 + mid
        const z = -d / 2 - depth / 2
        extras.push({ key: `${n.id}-back`, position: [x, y, -d / 2 - depth], size: [nw, nh, WALL_T] })
        extras.push({ key: `${n.id}-l`, position: [x - nw / 2, y, z], size: [WALL_T, nh, depth] })
        extras.push({ key: `${n.id}-r`, position: [x + nw / 2, y, z], size: [WALL_T, nh, depth] })
      } else if (wall === 2) {
        const x = -w / 2 + mid
        const z = d / 2 + depth / 2
        extras.push({ key: `${n.id}-back`, position: [x, y, d / 2 + depth], size: [nw, nh, WALL_T] })
        extras.push({ key: `${n.id}-l`, position: [x - nw / 2, y, z], size: [WALL_T, nh, depth] })
        extras.push({ key: `${n.id}-r`, position: [x + nw / 2, y, z], size: [WALL_T, nh, depth] })
      } else if (wall === 3) {
        const z = -d / 2 + mid
        const x = -w / 2 - depth / 2
        extras.push({ key: `${n.id}-back`, position: [-w / 2 - depth, y, z], size: [WALL_T, nh, nw] })
        extras.push({ key: `${n.id}-l`, position: [x, y, z - nw / 2], size: [depth, nh, WALL_T] })
        extras.push({ key: `${n.id}-r`, position: [x, y, z + nw / 2], size: [depth, nh, WALL_T] })
      } else {
        const z = -d / 2 + mid
        const x = w / 2 + depth / 2
        extras.push({ key: `${n.id}-back`, position: [w / 2 + depth, y, z], size: [WALL_T, nh, nw] })
        extras.push({ key: `${n.id}-l`, position: [x, y, z - nw / 2], size: [depth, nh, WALL_T] })
        extras.push({ key: `${n.id}-r`, position: [x, y, z + nw / 2], size: [depth, nh, WALL_T] })
      }
    }

    // Çıkıntı / kolon
    for (const n of niches.filter((x) => x.wall === wall && x.kind === 'protrusion')) {
      const depth = n.depthMm * MM
      const nw = n.widthMm * MM
      const nh = Math.min(n.heightMm, room.heightMm) * MM
      const mid = (n.offsetMm + n.widthMm / 2) * MM
      const y = nh / 2
      if (wall === 0) {
        extras.push({
          key: n.id,
          position: [-w / 2 + mid, y, -d / 2 + depth / 2],
          size: [nw, nh, depth],
        })
      } else if (wall === 2) {
        extras.push({
          key: n.id,
          position: [-w / 2 + mid, y, d / 2 - depth / 2],
          size: [nw, nh, depth],
        })
      } else if (wall === 3) {
        extras.push({
          key: n.id,
          position: [-w / 2 + depth / 2, y, -d / 2 + mid],
          size: [depth, nh, nw],
        })
      } else {
        extras.push({
          key: n.id,
          position: [w / 2 - depth / 2, y, -d / 2 + mid],
          size: [depth, nh, nw],
        })
      }
    }
  }

  return { panels, extras, w, d, h }
}

export function isCameraNearOpenDoor(
  room: RoomDef,
  camX: number,
  camZ: number,
  eyeH: number,
): boolean {
  const openings = (room.openings ?? []).filter((o) => o.kind === 'door')
  if (!openings.length) return false
  const w = room.widthMm * MM
  const d = room.depthMm * MM
  const margin = 0.45

  for (const o of openings) {
    if (eyeH < o.sillMm * MM || eyeH > (o.sillMm + o.heightMm) * MM) continue
    const a = o.offsetMm * MM
    const b = (o.offsetMm + o.widthMm) * MM
    if (o.wall === 0) {
      // arka
      if (camZ < margin && camX >= a && camX <= b) return true
    } else if (o.wall === 2) {
      if (camZ > d - margin && camX >= a && camX <= b) return true
    } else if (o.wall === 3) {
      if (camX < margin && camZ >= a && camZ <= b) return true
    } else if (o.wall === 1) {
      if (camX > w - margin && camZ >= a && camZ <= b) return true
    }
  }
  return false
}

export function clampCameraInRoom(
  room: RoomDef,
  x: number,
  y: number,
  z: number,
  eyeMargin = 0.25,
): [number, number, number] {
  const w = room.widthMm * MM
  const d = room.depthMm * MM
  const h = room.heightMm * MM
  const nearDoor = isCameraNearOpenDoor(room, x, z, y)
  let nx = x
  let nz = z
  if (!nearDoor) {
    nx = Math.max(eyeMargin, Math.min(w - eyeMargin, x))
    nz = Math.max(eyeMargin, Math.min(d - eyeMargin, z))
  } else {
    // Kapıdan biraz dışarı izin ver
    nx = Math.max(-1.2, Math.min(w + 1.2, x))
    nz = Math.max(-1.2, Math.min(d + 1.2, z))
  }
  const ny = Math.max(0.4, Math.min(h - 0.2, y))
  return [nx, ny, nz]
}

export type { Niche, WallOpening }
