# EmlakVR — Gör, Yerleştir, Fiyatla, Kanıtla

**Hayalindeki evi bitmeden yaşa. Bittikten sonra da aynı evi kanıt olarak gez.**

EmlakVR; emlakçı, müteahhit, dekoratör ve ev sahibi/alıcıyı tek bir dijital mekânda buluşturan, milimetrik hassasiyetli, fiyat şeffaf, VR/AR destekli bir mülk deneyimi platformudur. Boş bir planı veya mevcut bir evi tarayıp 3B’ye çevirir; kullanıcı kapısından prizine, laminatından alçıpanına kadar her şeyi sürükle-bırak ile yerleştirir; her ürünün fiyatını ve teknik özelliklerini anlık görür; iş bitince de “vaat edilen” ile “teslim edilen”i aynı sanal mekânda yan yana gezebilir.

---

## 1. Kim için?

| Rol | Ne yapar? |
|-----|-----------|
| **Emlakçı** | Müşteriye evi satmadan önce “içinde dolaşılabilen” bir vitrin sunar. Dekore edilmiş alternatif versiyonlarla satış hızlanır. |
| **Müteahhit / İnşaat firması** | Proje bitmeden müşteriye bitmiş daireyi gösterir; seçilen malzeme ve işçilikle sözleşme bağlar. |
| **Dekoratör / İç mimar** | Müşteriyle aynı VR odasında çalışır; kararlar anlık fiyatlanır, revizyon trafiği azalır. |
| **Ev alan / satan kişi** | “Eşim beğenir mi?”, “Bu koltuk sığar mı?”, “Laminat mı parke mi?” sorularını tahminle değil, mekânda cevaplar. |
| **Tedarikçi / Showroom** | Katalog ürünlerini platforma basar; her sürükle-bırakta gerçek stok ve fiyat görünür. |

---

## 2. Temel deneyim akışı

### A. Mülkü içeri al
- **Lidar / fotogrametri / 360° tarama** ile mevcut evi dakikalar içinde 3B modele çevir.
- Veya **mimari plan / DWG / IFC** yükle; duvar, kolon, kiriş, pencere boşlukları otomatik oluşsun.
- **Kat planı fotoğrafı** yükle → AI ile yaklaşık 3B iskelet üret (sonra milimetrik düzelt).

### B. Gözlük veya ekrandan gir
- **VR gözlük** (Meta Quest, Apple Vision Pro, PICO vb.) ile gerçek ölçekte yürü.
- **Telefon / tablet / bilgisayar** ile dokunmatik veya fare ile gezi; aynı sahne, aynı fiyat motoru.
- **AR modu**: Fiziksel odada telefonu tut, sanal koltuğu gerçek zemine oturt; “sığar mı?” anında belli olur.

### C. Sürükle-bırak ile her şeyi yerleştir
Hazır, ölçülü, fiyatlı kataloglardan:
- Kapı, pencere, cam tipi, korkuluk
- Priz, anahtar, aydınlatma, avize, LED şerit
- Laminat, parke, seramik, epoksi, halı
- Boya rengi / dokusu, duvar kâğıdı, alçıpan niş / asma tavan
- Mutfak dolabı, tezgâh, evye, ankastre
- Mobilya, perde, saat, tablo, bitki
- Klima, radyatör, şofben, ıslak hacim seramikleri

Her nesne **gerçek SKU**’ya bağlıdır: marka, model, ölçü (mm), malzeme, enerji sınıfı, garanti, stok, teslimat süresi, birim fiyat.

### D. Milimetrik yerleştirme
- Snap-to-grid, duvar hizalama, açı kilidi, mesafe cetveli (mm).
- Çarpışma ve geçiş kontrolü: kapı açılma yayı, dolap derinliği, merdiven başı netlik.
- “İnsan silüeti” ve “mobilya ayak izi” katmanları ile yaşam alanı testi.
- Katlar arası yükseklik, asma tavan düşürme, şap kalınlığı gibi **inşaat katmanları**.

### E. Anlık fiyat ve özellik
- Seçilen her ürünün kartı: fiyat, KDV, işçilik opsiyonu, alternatifler.
- Sol panelde **canlı sepet**: malzeme + işçilik + nakliye + montaj.
- Senaryolar: “Ekonomik / Standart / Premium” tek tıkla karşılaştır.
- Müteahhit veya dekoratör için **teklif PDF / sözleşme taslağı** üret.

### F. Bitmiş hali gez — sonra kanıtla
- İnşaat veya dekorasyon bittikten sonra yeniden tara veya fotoğraf/video ile **as-built** modeli oluştur.
- **Önce / Sonra / Vaat** üçlü görünüm: vaat edilen sahne ile teslim edilen sahneyi aynı rotada gez.
- Fark haritası: yanlış renk, eksik priz, ölçü sapması (ör. 12 mm kayma) otomatik işaretlensin.
- Bu kayıt, müşteri-müteahhit anlaşmazlıklarında **dijital kanıt** olur.

---

## 3. Platformun gelişmiş katmanları (eksik kalanları tamamlayan fikirler)

### 3.1 Gerçek ışık ve malzeme fiziği
- Gün boyu güneş yolu simülasyonu (konum + cephe + mevsim).
- Cam geçirgenliği, perde kumaşı, mat/parlak boya yansıması.
- “Akşam 21:00, sıcak ışık” preset’i ile satış sunumu.

### 3.2 Akustik ve konfor
- Oda akustiği tahmini (açık mutfak gürültüsü, komşu duvar).
- Isı köprüsü / yalıtım önerisi (pencere U değeri, dış cephe).
- “Bu odada çalışılır mı / uyku kalitesi?” skorları.

### 3.3 Yapısal ve tesisat farkındalığı
- Kolon-kirişe mobilya çakışması uyarısı.
- Priz hattı / su tesisatı / elektrik panosu katmanları (izin verilen yerleştirme).
- Yangın yönetmeliği, kaçış mesafesi, balkon yükü gibi **basit uyumluluk checklist’i**.

### 3.4 Çoklu kullanıcı — aynı evde birlikte karar
- Emlakçı + alıcı + eş + dekoratör aynı anda VR/ekranda.
- Avatar + sesli sohbet + işaretçi lazeri.
- “Beğen / Beğenme / Kararsız” oyları nesne üzerinde.

### 3.5 AI asistan
- “Bu salon için 80.000 TL bütçeyle modern-minimal set öner.”
- “3+1’i 2 çocuğa göre yeniden planla.”
- Mevcut fotoğraftan stil transferi: Pinterest/Instagram görseli → mekâna uygula (fiyatlı ürünlerle).

### 3.6 Finans ve satın alma köprüsü
- Toplam maliyeti kredi / peşinat senaryosuna çevir.
- Sepetten **doğrudan sipariş** (tedarikçi API) veya “teklif iste”.
- Müteahhit için hakediş / aşama bazlı ödeme planı görünümü.

### 3.7 Zaman çizelgesi (4D)
- İnşaat aşamaları: kaba yapı → ince iş → mobilya.
- “3 ay sonra teslim” animasyonu; müşteri ilerlemeyi sanal olarak izler.
- Gecikme veya malzeme değişiminde sahne + fiyat otomatik güncellenir.

### 3.8 Portföy ve vitrin
- Emlakçı: 50 ilanı VR vitrininde yayınla; müşteri randevusuz gezer.
- “İlanı VR’da gezdim” analytics → ciddi alıcı sinyali.
- Kısa reel / walkthrough videosu otomatik üret (sosyal medya).

### 3.9 Erişilebilirlik ve güvenlik
- Engelli erişim simülasyonu (kapı genişliği, eşik, asansör).
- Çocuk güvenliği: balkon korkuluk yüksekliği, priz koruması önerileri.
- Deprem bölgesi için sabit mobilya / ankraj noktaları önerisi.

### 3.10 Marka ve white-label
- Müteahhit kendi logo, renk, katalog setiyle “FirmaVR” olarak sunar.
- Showroom’lar kendi mağaza stokunu canlı bağlar.

---

## 4. Ürün ekranları (özet)

1. **Proje hub’ı** — mülkler, roller, davetler  
2. **Sahne editörü** — sürükle-bırak + mm cetvel + katmanlar  
3. **Katalog** — filtre: fiyat, stil, ölçü, stok, sürdürülebilirlik  
4. **Fiyat panosu** — canlı toplam, senaryo A/B, teklif çıktısı  
5. **Tur modu** — VR / masaüstü / mobil / AR  
6. **Kanıt stüdyosu** — vaat vs teslim, fark raporu, imzalı PDF  
7. **İşbirliği** — canlı oturum, yorumlar, onay akışı  

---

## 5. Değer vaadi (tek cümleler)

- Emlakçıya: *“Alıcı evi satmadan önce yaşasın.”*  
- Müteahhite: *“Sözleşme, gezilen ve fiyatlanan sahnenin kendisi olsun.”*  
- Alıcıya: *“Bitmeden tadını çıkar; bitince de vaadi kanıtla.”*  
- Dekoratöre: *“Revizyon toplantısı = ortak VR oturumu.”*  
- Tedarikçiye: *“Her yerleştirme bir satış fırsatı.”*

---

## 6. Teknik iskelet (yüksek seviye)

- **3B motor**: WebGPU / Unity / Unreal tabanlı cross-platform sahne  
- **Varlık formatı**: glTF + PBR malzemeler + gerçek ölçü metadata  
- **Tarama**: LiDAR (mobil), fotogrametri pipeline, plan→BIM yarı otomatik  
- **Fiyat motoru**: bölgesel fiyat listesi, KDV, işçilik katsayısı, döviz  
- **İşbirliği**: WebRTC + senkron sahne state  
- **Kanıt**: hash’lenmiş sahne snapshot + zaman damgası + isteğe bağlı e-imza  
- **Cihazlar**: VR headset, iOS/Android, tablet, masaüstü tarayıcı  

---

## 7. Güven ve şeffaflık

- Katalog fiyatları “tahmini” veya “garanti” olarak etiketlenir.  
- Stok yoksa alternatif otomatik önerilir; müşteri sürpriz yaşamaz.  
- Vaat sahnesi kilitlenince (sözleşme anı) değişiklikler versiyonlanır.  
- Kişisel tarama verisi KVKK uyumlu; mülk sahibi onayı olmadan paylaşılmaz.

---

## 8. Yol haritası (öneri)

| Faz | Odak |
|-----|------|
| **MVP** | Plan/tarama → 3B gezi → mobilya+zemin+boya sürükle-bırak → canlı fiyat |
| **v1** | VR + çoklu kullanıcı + teklif PDF + tedarikçi katalog API |
| **v2** | AR yerleştirme + as-built kanıt + fark raporu |
| **v3** | AI stil/asistan + 4D inşaat zaman çizelgesi + white-label |

---

## 9. Slogan seçenekleri

- **Gör. Yerleştir. Fiyatla. Kanıtla.**  
- **Evin bitmiş hali, daha inşa edilmeden.**  
- **Satmadan önce yaşat. Teslimden sonra kanıtla.**  
- **Milimetre milimetre senin evin.**

---

*EmlakVR; emlak, inşaat ve dekorasyonu “hayal → karar → sözleşme → teslim → kanıt” zincirine bağlayan bir deneyim işletim sistemidir. Müşteri artık katalogdan değil, kendi gelecekteki evinin içinden alışveriş yapar.*
