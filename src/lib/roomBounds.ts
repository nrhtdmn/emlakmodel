import type { RoomDef } from '../data/house'

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

/** Döndürülmüş taban izinin oda eksenlerindeki yarı genişliği (mm) */
export function footprintExtents(widthMm: number, depthMm: number, rotationDeg: number) {
  const rad = (rotationDeg * Math.PI) / 180
  const c = Math.abs(Math.cos(rad))
  const s = Math.abs(Math.sin(rad))
  const halfW = widthMm / 2
  const halfD = depthMm / 2
  return {
    extentX: halfW * c + halfD * s,
    extentZ: halfW * s + halfD * c,
  }
}

export type ItemClearances = {
  leftMm: number
  rightMm: number
  backMm: number
  frontMm: number
  floorMm: number
  ceilingMm: number
}

export type ClearanceKey = keyof ItemClearances

/** Duvar / zemin / tavan boşlukları (döndürülmüş AABB kenarına göre) */
export function getItemClearances(
  room: Pick<RoomDef, 'widthMm' | 'depthMm' | 'heightMm'>,
  dims: { widthMm: number; depthMm: number; heightMm: number },
  pose: {
    xMm: number
    yMm: number
    elevMm: number
    rotation: number
    pitch?: number
    roll?: number
  },
): ItemClearances {
  const { extentX, extentZ } = footprintExtents(dims.widthMm, dims.depthMm, pose.rotation)
  const cx = pose.xMm + dims.widthMm / 2
  const cz = pose.yMm + dims.depthMm / 2
  return {
    leftMm: Math.round((cx - extentX) / 10) * 10,
    rightMm: Math.round((room.widthMm - (cx + extentX)) / 10) * 10,
    backMm: Math.round((cz - extentZ) / 10) * 10,
    frontMm: Math.round((room.depthMm - (cz + extentZ)) / 10) * 10,
    floorMm: Math.round(pose.elevMm / 10) * 10,
    ceilingMm: Math.round((room.heightMm - pose.elevMm - dims.heightMm) / 10) * 10,
  }
}

/** Belirli bir kenar mesafesinden pozisyon üret */
export function poseFromClearance(
  room: Pick<RoomDef, 'widthMm' | 'depthMm' | 'heightMm'>,
  dims: { widthMm: number; depthMm: number; heightMm: number },
  pose: {
    xMm: number
    yMm: number
    elevMm: number
    rotation: number
    pitch?: number
    roll?: number
  },
  key: ClearanceKey,
  valueMm: number,
) {
  const { extentX, extentZ } = footprintExtents(dims.widthMm, dims.depthMm, pose.rotation)
  const v = Math.max(0, valueMm)
  let { xMm, yMm, elevMm, rotation, pitch, roll } = pose
  const w = dims.widthMm
  const d = dims.depthMm

  if (key === 'leftMm') {
    xMm = v + extentX - w / 2
  } else if (key === 'rightMm') {
    xMm = room.widthMm - v - extentX - w / 2
  } else if (key === 'backMm') {
    yMm = v + extentZ - d / 2
  } else if (key === 'frontMm') {
    yMm = room.depthMm - v - extentZ - d / 2
  } else if (key === 'floorMm') {
    elevMm = v
  } else if (key === 'ceilingMm') {
    elevMm = room.heightMm - dims.heightMm - v
  }

  return clampItemInRoom(room, dims, { xMm, yMm, elevMm, rotation, pitch, roll }, 0)
}

/** Nesneyi oda sınırları içinde tut — duvardan geçmesin (dönüş dahil) */
export function clampItemInRoom(
  room: Pick<RoomDef, 'widthMm' | 'depthMm' | 'heightMm'>,
  dims: { widthMm: number; depthMm: number; heightMm: number },
  pose: {
    xMm: number
    yMm: number
    elevMm: number
    rotation: number
    pitch?: number
    roll?: number
  },
  marginMm = 0,
) {
  const { extentX, extentZ } = footprintExtents(dims.widthMm, dims.depthMm, pose.rotation)
  const cx = pose.xMm + dims.widthMm / 2
  const cz = pose.yMm + dims.depthMm / 2

  const minCx = marginMm + extentX
  const maxCx = room.widthMm - marginMm - extentX
  const minCz = marginMm + extentZ
  const maxCz = room.depthMm - marginMm - extentZ

  const ncx = maxCx >= minCx ? clamp(cx, minCx, maxCx) : room.widthMm / 2
  const ncz = maxCz >= minCz ? clamp(cz, minCz, maxCz) : room.depthMm / 2
  const maxElev = Math.max(0, room.heightMm - dims.heightMm - marginMm)
  const norm = (deg: number) => ((deg % 360) + 360) % 360

  return {
    xMm: ncx - dims.widthMm / 2,
    yMm: ncz - dims.depthMm / 2,
    elevMm: clamp(pose.elevMm, 0, maxElev),
    rotation: norm(pose.rotation),
    pitch: norm(pose.pitch ?? 0),
    roll: norm(pose.roll ?? 0),
  }
}
