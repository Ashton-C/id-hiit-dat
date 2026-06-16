/**
 * Offline PWA icon generator. Rasterizes the "I'd HIIT Dat" pulse-wave mark and
 * encodes PNGs using ONLY Node built-ins (node:zlib) — no native deps, no network.
 * The generated PNGs are committed to public/, so `npm ci && npm run build` needs
 * no image tooling. Re-run manually (`npm run gen:icons`) only when the art changes.
 */

import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC = join(ROOT, 'public')
const ICONS = join(PUBLIC, 'icons')

const BG = [21, 23, 28] //   #15171c
const ACCENT = [255, 92, 114] // #ff5c72

// Classic single-spike pulse waveform, normalized to the content box [0..1].
const PULSE = [
  [0.06, 0.55],
  [0.34, 0.55],
  [0.44, 0.55],
  [0.5, 0.18],
  [0.57, 0.86],
  [0.64, 0.42],
  [0.72, 0.55],
  [0.94, 0.55],
]

// ---- CRC32 (for PNG chunks) ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

/** Encode an RGBA pixel buffer (Uint8Array, w*h*4) into a PNG Buffer. */
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 //  bit depth
  ihdr[9] = 6 //  color type RGBA
  // 10,11,12 = compression/filter/interlace = 0

  // Raw image: each row prefixed with filter byte 0.
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    rgba.subarray(y * stride, (y + 1) * stride).forEach((v, i) => {
      raw[y * (stride + 1) + 1 + i] = v
    })
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---- rasterizer ----
function makeCanvas(size) {
  const px = new Uint8Array(size * size * 4)
  for (let i = 0; i < size * size; i++) {
    px[i * 4] = BG[0]
    px[i * 4 + 1] = BG[1]
    px[i * 4 + 2] = BG[2]
    px[i * 4 + 3] = 255
  }
  return px
}

function stampDisc(px, size, cx, cy, r, color) {
  const r2 = r * r
  const x0 = Math.max(0, Math.floor(cx - r))
  const x1 = Math.min(size - 1, Math.ceil(cx + r))
  const y0 = Math.max(0, Math.floor(cy - r))
  const y1 = Math.min(size - 1, Math.ceil(cy + r))
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy <= r2) {
        const i = (y * size + x) * 4
        px[i] = color[0]
        px[i + 1] = color[1]
        px[i + 2] = color[2]
        px[i + 3] = 255
      }
    }
  }
}

function drawPolyline(px, size, points, thickness, color) {
  const r = thickness / 2
  for (let s = 0; s < points.length - 1; s++) {
    const [ax, ay] = points[s]
    const [bx, by] = points[s + 1]
    const dist = Math.hypot(bx - ax, by - ay)
    const steps = Math.max(1, Math.ceil(dist))
    for (let t = 0; t <= steps; t++) {
      const f = t / steps
      stampDisc(px, size, ax + (bx - ax) * f, ay + (by - ay) * f, r, color)
    }
  }
}

function renderIcon(size, { maskable }) {
  const px = makeCanvas(size)
  // Maskable icons must keep content within the inner 80% safe zone.
  const inset = maskable ? size * 0.2 : size * 0.16
  const box = size - inset * 2
  const pts = PULSE.map(([nx, ny]) => [inset + nx * box, inset + ny * box])
  drawPolyline(px, size, pts, size * 0.07, ACCENT)
  return encodePNG(size, size, px)
}

mkdirSync(ICONS, { recursive: true })

const outputs = [
  [join(ICONS, 'pwa-192.png'), renderIcon(192, { maskable: false })],
  [join(ICONS, 'pwa-512.png'), renderIcon(512, { maskable: false })],
  [join(ICONS, 'pwa-maskable-512.png'), renderIcon(512, { maskable: true })],
  [join(PUBLIC, 'apple-touch-icon-180.png'), renderIcon(180, { maskable: false })],
]

for (const [path, buf] of outputs) {
  writeFileSync(path, buf)
  console.log(`wrote ${path} (${buf.length} bytes)`)
}
