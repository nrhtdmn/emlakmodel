const fs = require('fs')
const p = 'src/data/catalog.ts'
let s = fs.readFileSync(p, 'utf8')
const map = {
  'lam-oak-8': 'Laminat',
  'parke-ceviz': 'Parke',
  'seramik-60': 'Seramik',
  'boya-sage': 'Boya',
  'boya-kirec': 'Boya',
  'panel-oak': 'Panel',
  'kapi-ic': 'İç Kapı',
  'kapi-dis': 'Dış Kapı',
  'pencere-pvc': 'PVC',
  'pencere-alum': 'Alüminyum',
  'avize-line': 'Avize',
  'spot-6': 'Spot',
  'priz-usb': 'Priz',
  'anahtar-dim': 'Anahtar',
  'koltuk-3': 'Koltuk',
  'masa-yemek': 'Masa',
  'yatak-160': 'Yatak',
  'mutfak-alt': 'Dolap',
  'tezga-kuvars': 'Tezgâh',
  'klima-9k': 'Klima',
  'radyator-600': 'Radyatör',
  'saat-duvar': 'Aksesuar',
  'perde-keten': 'Perde',
  'bitki-ficus': 'Bitki',
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
