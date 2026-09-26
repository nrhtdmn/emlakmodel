/** Ev / oda geometrisi — santim hassasiyetinde duvar, girinti, çıkıntı, kapı */

export interface Niche {
  id: string
  /** wall: 0=back(-Z), 1=right(+X), 2=front(+Z), 3=left(-X) */
  wall: 0 | 1 | 2 | 3
  /** offset along wall from left/start (mm) */
  offsetMm: number
  widthMm: number
  depthMm: number
  heightMm: number
  /** girinti = içeri oyuk, çıkıntı = kolon / çıkma */
  kind: 'recess' | 'protrusion'
}

/** Duvar boşluğu — açık kapı / pencere (kilitliyken çıkış kapıdan) */
export interface WallOpening {
  id: string
  wall: 0 | 1 | 2 | 3
  offsetMm: number
  widthMm: number
  heightMm: number
  /** eşik yüksekliği (mm) — kapıda genelde 0 */
  sillMm: number
  kind: 'door' | 'window'
}

export type WallIndex = 0 | 1 | 2 | 3

export const WALL_LABELS: Record<WallIndex, string> = {
  0: 'Arka',
  1: 'Sağ',
  2: 'Ön',
  3: 'Sol',
}

export interface RoomDef {
  id: string
  name: string
  widthMm: number
  depthMm: number
  heightMm: number
  wallColor: string
  floorColor: string
  ceilingColor?: string
  hiddenWalls?: WallIndex[]
  ceilingVisible?: boolean
  originXMm: number
  originZMm: number
  niches: Niche[]
  openings?: WallOpening[]
  sceneModelUrl?: string
  ceilingModelUrl?: string
}

export interface HouseDef {
  id: string
  name: string
  rooms: RoomDef[]
}

export function isWallHidden(room: RoomDef, wall: WallIndex) {
  return (room.hiddenWalls ?? []).includes(wall)
}

export function isCeilingVisible(room: RoomDef) {
  return room.ceilingVisible !== false
}

export const DEMO_HOUSE: HouseDef = {
  id: 'demo-1',
  name: 'Demo Daire',
  rooms: [
    {
      id: 'salon',
      name: 'Salon',
      widthMm: 5200,
      depthMm: 4200,
      heightMm: 2700,
      wallColor: '#e8ebe4',
      floorColor: '#c4a574',
      ceilingColor: '#f0ece4',
      ceilingVisible: true,
      hiddenWalls: [],
      originXMm: 0,
      originZMm: 0,
      niches: [
        {
          id: 'n1',
          wall: 0,
          offsetMm: 800,
          widthMm: 1600,
          depthMm: 350,
          heightMm: 2200,
          kind: 'recess',
        },
      ],
      openings: [
        {
          id: 'o1',
          wall: 2,
          offsetMm: 1800,
          widthMm: 900,
          heightMm: 2100,
          sillMm: 0,
          kind: 'door',
        },
      ],
    },
    {
      id: 'mutfak',
      name: 'Mutfak',
      widthMm: 3200,
      depthMm: 2800,
      heightMm: 2600,
      wallColor: '#f0ebe3',
      floorColor: '#d8d2c8',
      ceilingColor: '#f0ece4',
      ceilingVisible: true,
      hiddenWalls: [],
      originXMm: 5200,
      originZMm: 0,
      niches: [],
      openings: [],
    },
    {
      id: 'yatak',
      name: 'Yatak Odası',
      widthMm: 3800,
      depthMm: 3600,
      heightMm: 2650,
      wallColor: '#f2efe8',
      floorColor: '#5c3d2e',
      ceilingColor: '#f0ece4',
      ceilingVisible: true,
      hiddenWalls: [],
      originXMm: 0,
      originZMm: 4200,
      niches: [
        {
          id: 'n2',
          wall: 1,
          offsetMm: 600,
          widthMm: 400,
          depthMm: 400,
          heightMm: 2400,
          kind: 'protrusion',
        },
      ],
      openings: [],
    },
    {
      id: 'banyo',
      name: 'Banyo',
      widthMm: 2200,
      depthMm: 2000,
      heightMm: 2500,
      wallColor: '#e6eef2',
      floorColor: '#c5cdd3',
      ceilingColor: '#eef2f4',
      ceilingVisible: true,
      hiddenWalls: [],
      originXMm: 3800,
      originZMm: 4200,
      niches: [],
      openings: [],
    },
  ],
}

export function nicheUid() {
  return `n_${Math.random().toString(36).slice(2, 8)}`
}

export function openingUid() {
  return `o_${Math.random().toString(36).slice(2, 8)}`
}

export function roomUid() {
  return `r_${Math.random().toString(36).slice(2, 8)}`
}
