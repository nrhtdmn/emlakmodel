const fs = require('fs')
const p = 'src/data/catalog.ts'
let s = fs.readFileSync(p, 'utf8')
const map = {
  'panel-oak': 'Panel',
  'kapi-ic-90': 'İç Kapı',
  'kapi-camli': 'Pivot',
  'pencere-cift': 'Çift Cam',
  'pencere-surme': 'Sürme',
}
let n = 0
for (const [id, sub] of Object.entries(map)) {
  const re = new RegExp(`(id: '${id}',[\\s\\S]*?category: '[^']+',)`)
  const next = s.replace(re, (m) => {
    if (m.includes('subcategory')) return m
    n++
    return `${m}\n    subcategory: '${sub}',`
  })
  s = next
}
fs.writeFileSync(p, s)
console.log('patched', n)
