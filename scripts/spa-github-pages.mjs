import { copyFileSync, existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dist = join(process.cwd(), 'dist')
const index = join(dist, 'index.html')
if (existsSync(index)) {
  copyFileSync(index, join(dist, '404.html'))
  writeFileSync(join(dist, '.nojekyll'), '')
  console.log('Copied index.html → 404.html (GitHub Pages SPA fallback)')
}
