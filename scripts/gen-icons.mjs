/* Minimal PNG encoder for PWA icons — run: node scripts/gen-icons.mjs */
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dir, '..', 'public')

function crcTable() {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
}
const CRC = crcTable()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type)
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcBuf = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(crcBuf))
  return Buffer.concat([len, typeBuf, data, crc])
}

function png(size, paint) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1)
    raw[row] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b, a = 255] = paint(x, y, size)
      const i = row + 1 + x * 4
      raw[i] = r
      raw[i + 1] = g
      raw[i + 2] = b
      raw[i + 3] = a
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function iconPaint(x, y, size) {
  const s = size / 64
  const bg = [26, 46, 36]
  // rounded-ish by ignoring corners
  const m = size * 0.08
  if (x < m && y < m && (m - x) ** 2 + (m - y) ** 2 > m * m) return [0, 0, 0, 0]
  if (x > size - m && y < m && (x - (size - m)) ** 2 + (m - y) ** 2 > m * m) return [0, 0, 0, 0]
  if (x < m && y > size - m && (m - x) ** 2 + (y - (size - m)) ** 2 > m * m) return [0, 0, 0, 0]
  if (x > size - m && y > size - m && (x - (size - m)) ** 2 + (y - (size - m)) ** 2 > m * m)
    return [0, 0, 0, 0]

  // house roof triangle
  const roof = y > 18 * s && y < 28 * s && Math.abs(x - size / 2) < (28 * s - y) * 1.2
  if (roof) return [201, 133, 74]
  // house body
  if (x > 18 * s && x < 46 * s && y > 28 * s && y < 48 * s) return [33, 54, 44]
  // door
  if (x > 28 * s && x < 36 * s && y > 36 * s && y < 48 * s) return [224, 166, 109]
  return bg
}

for (const size of [192, 512]) {
  writeFileSync(join(publicDir, `pwa-${size}.png`), png(size, iconPaint))
}
writeFileSync(join(publicDir, 'apple-touch-icon.png'), png(180, iconPaint))
console.log('icons written')
