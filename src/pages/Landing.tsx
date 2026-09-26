import { Link } from 'react-router-dom'

export function Landing() {
  return (
    <>
      <section className="hero">
        <div className="hero-bg" aria-hidden />
        <div className="hero-content">
          <p className="hero-brand">
            Emlak<i>VR</i>
          </p>
          <h1>Bitmeden yaşa. Teslimden sonra kanıtla.</h1>
          <p>
            Eve içeriden gir. Sol üstten kategori seç, elinle yerleştir. Odaları tek tek gez; ölçüleri
            aç-kapa; Blender GLB modellerini kullan; evi kendi ölçülerinle tasarla.
          </p>
          <div className="hero-actions">
            <Link to="/studio" className="btn btn-primary">
              Stüdyoyu aç
            </Link>
            <Link to="/proof" className="btn btn-ghost">
              Vaat / kanıt turu
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Kimler için?</h2>
        <p className="lead">Emlak, inşaat ve dekorasyon kararını aynı sanal mekânda birleştirir.</p>
        <div className="roles">
          <article className="role">
            <h3>Emlakçı</h3>
            <p>Alıcı evi satmadan önce içinde dolaşır; dekore edilmiş vitrin satış hızlandırır.</p>
          </article>
          <article className="role">
            <h3>Müteahhit</h3>
            <p>Proje bitmeden bitmiş daireyi gösterir; seçilen malzeme ile sözleşme bağlanır.</p>
          </article>
          <article className="role">
            <h3>Dekoratör</h3>
            <p>Müşteriyle aynı odada çalışır; her revizyon anlık fiyatlanır.</p>
          </article>
          <article className="role">
            <h3>Alıcı / Satıcı</h3>
            <p>“Sığar mı?” ve “Kaça mal olur?” sorularını tahminle değil, mekânda cevaplar.</p>
          </article>
        </div>
      </section>

      <section className="section">
        <h2>Nasıl çalışır?</h2>
        <p className="lead">Demo stüdyoda hazır daireyi aç, katalogdan sürükle, toplamı gör.</p>
        <div className="steps">
          <div className="step">
            <div>
              <h3>Mülkü aç</h3>
              <p>Hazır salon veya yatak odası preset’i ile saniyeler içinde sahneye gir.</p>
            </div>
          </div>
          <div className="step">
            <div>
              <h3>Sürükle-bırak yerleştir</h3>
              <p>50 mm ızgara ile milimetrik hizala; boya ve zemin odaya anında uygulanır.</p>
            </div>
          </div>
          <div className="step">
            <div>
              <h3>Fiyatı ve özellikleri gör</h3>
              <p>Malzeme, işçilik, nakliye ve KDV ile canlı sepet; ürün kartında stok ve teslimat.</p>
            </div>
          </div>
          <div className="step">
            <div>
              <h3>Vaat’i kilitle, kanıtla</h3>
              <p>Sözleşme anını kaydet; teslim sonrası fark haritası ile gezilebilir kanıt üret.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="cta-band">
          <div>
            <h2 style={{ margin: 0 }}>Telefon, tablet, bilgisayar — PWA</h2>
            <p className="lead" style={{ margin: '0.5rem 0 0' }}>
              Ana ekrana ekle, çevrimdışı stüdyoya dön. GitHub Pages üzerinde çalışır.
            </p>
          </div>
          <Link to="/studio" className="btn btn-primary">
            Hemen dene
          </Link>
        </div>
      </section>

      <footer className="footer">
        <span>EmlakVR — Gör. Yerleştir. Fiyatla. Kanıtla.</span>
        <span>Demo PWA · GitHub Pages</span>
      </footer>
    </>
  )
}
