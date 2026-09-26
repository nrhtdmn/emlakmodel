# EmlakVR

**Gör. Yerleştir. Fiyatla. Kanıtla.** — Emlak, müteahhit ve dekorasyon için PWA demo.

Milimetrik oda editörü, sürükle-bırak katalog, canlı fiyat (malzeme + işçilik + nakliye + KDV), gezi modu (gün ışığı) ve vaat / teslim / fark kanıt stüdyosu.

## Geliştirme

```bash
npm install
npm run dev
```

## GitHub Pages’e yayınla

1. Bu repoyu GitHub’a push et (repo adı örn. `emlakvr`).
2. **Settings → Pages → Source:** GitHub Actions.
3. Aşağıdaki workflow otomatik build & deploy eder.
4. Site adresi: `https://<kullanıcı>.github.io/emlakvr/`

Proje sitesi için base path `vite.config` içinde `VITE_BASE` ile ayarlanır. Workflow varsayılan olarak `/<repo-adı>/` kullanır.

Elle deploy (opsiyonel):

```bash
# Windows PowerShell
$env:VITE_BASE="/emlakvr/"; npm run build
npx gh-pages -d dist
```

## PWA

- `vite-plugin-pwa` + service worker (autoUpdate)
- Manifest, offline cache, “Ana ekrana ekle” istemi
- HTTPS üzerinde (GitHub Pages) installable

## Sayfalar

| Rota | İçerik |
|------|--------|
| `/` | Landing |
| `/studio` | Katalog + oda + fiyat |
| `/proof` | Kanıt stüdyosu girişi |

## Lisans

Demo / özel kullanım.
