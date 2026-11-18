import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ArrowRight, BarChart3, Check, Clock, Database, Globe, PackageX, Search, Server, ShieldCheck, Target, Cpu } from 'lucide-react';
import type { ModuleType } from '../types';
import Configurator from './Configurator';
import CaseVideoPlayer from './videos/CaseVideoPlayer';
import VideoThumb from './videos/VideoThumb';
import { CASE_VIDEOS } from './videos';
import { BLOCKS, CASES, CONTACT_EMAIL, SECTORS } from './content';
import './landing.css';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const LOGO = `${BASE}/assets/images/nexus-logo.png`;

interface Props {
  version: string;
  onOpenDemo: (id: ModuleType) => void;
  onShowChangelog: () => void;
}

const MAILTO_BODY = [
  'Merhaba,',
  '',
  'Industrial AI Nexus için bir saha keşfi planlamak istiyoruz.',
  '',
  'Firma / tesis:',
  'Saha / hat:',
  'Kronik sorun:',
  'Elimizdeki veri (sensör, PLC, kamera, MES/ERP…):',
  'Uygun görüşme zamanı:',
].join('\n');
const MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Industrial AI Nexus — saha keşfi talebi')}&body=${encodeURIComponent(MAILTO_BODY)}`;

export default function Landing({ version, onOpenDemo, onShowChangelog }: Props) {
  const [videoId, setVideoId] = useState<string | null>(null);
  const video = videoId ? CASE_VIDEOS[videoId] : null;

  useEffect(() => {
    document.body.style.overflow = video ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [video]);

  return (
    <div className="nx">
      <AnimatePresence>
        {video && <CaseVideoPlayer key={video.id} video={video} onClose={() => setVideoId(null)} />}
      </AnimatePresence>
      <div className="nx-wrap">
        {/* ---------- NAV ---------- */}
        <header className="nx-nav">
          <a href="#top" className="nx-logo" aria-label="Industrial AI Nexus — başa dön">
            <img src={LOGO} alt="Industrial AI Nexus" />
          </a>
          <nav className="nx-nav-links" aria-label="Bölümler">
            <a href="#yaklasim">Yaklaşım</a>
            <a href="#yontem">Yöntem</a>
            <a href="#konfigurator">Konfigüratör</a>
            <a href="#bloklar">Çözüm Blokları</a>
            <a href="#uygulamalar">Uygulamalar</a>
          </nav>
          <a href="#konfigurator" className="nx-btn nx-btn-dark">Sorununuzu tanımlayın</a>
        </header>

        {/* ---------- HERO ---------- */}
        <section id="top" className="nx-hero">
          <div className="nx-hero-copy">
            <div className="nx-eyebrow">TAILORED INDUSTRIAL AI — SOLUTIONS &amp; APPLICATIONS</div>
            <h1 className="nx-h1">
              Fabrikalar parmak izi gibidir.<br />
              <span className="nx-accent-text">Sorunlar şablonlarla çözülmez.</span>
            </h1>
            <p className="nx-lead">
              Industrial AI Nexus, endüstriyel problemler için etkileşimli bir AI platformu ve bir çalışma biçimidir.
              Her çözüm; sahadan toplanan gerçek veri, yerinde darboğaz analizi ve o use case'e özel kurulan
              bir model mimarisiyle başlar.
            </p>
            <div className="nx-cta-row">
              <a href="#konfigurator" className="nx-btn nx-btn-accent">Çözüm taslağınızı oluşturun</a>
              <a href="#bloklar" className="nx-btn nx-btn-outline">7 demo senaryosunu gezin</a>
            </div>
          </div>

          <div className="nx-spec nx-spec-hero" aria-label="Örnek çözüm şartnamesi">
            <div className="nx-spec-head">
              <span>ÇÖZÜM ŞARTNAMESİ · ÖRNEK</span>
              <span className="nx-accent-text">TAILORED</span>
            </div>
            <dl className="nx-spec-grid">
              <dt>PROBLEM</dt>
              <dd className="nx-strong">Sahadaki traktörlerde plansız arızalar</dd>
              <dt>SAHA VERİSİ</dt>
              <dd className="nx-tags">
                <span>CAN-Bus telemetri</span><span>6 aylık filo verisi</span><span>Düşük gecikmeli akış</span>
              </dd>
              <dt>YAKLAŞIM</dt>
              <dd>5 kritik arıza tipine özel eğitilmiş anomali modelleri</dd>
              <dt>KURULUM</dt>
              <dd>On-premise; veri tesis dışına çıkmaz</dd>
              <dt>ÇIKTI</dt>
              <dd>Kritik arızalarda ≥3 gün önceden kestirimci uyarı</dd>
            </dl>
            <div className="nx-spec-foot nx-spec-note">
              <ArrowRight size={18} aria-hidden="true" className="nx-accent-text" />
              <span>Her proje böyle bir şartnameyle başlar; şablon değil, sahaya göre yazılır.</span>
            </div>
          </div>
        </section>
      </div>

      {/* ---------- YAKLAŞIM: Hazır vs Use-case ---------- */}
      <section id="yaklasim" className="nx-band">
        <div className="nx-wrap nx-compare">
          <div className="nx-compare-card nx-compare-off">
            <div className="nx-compare-icon"><PackageX size={22} aria-hidden="true" /></div>
            <h2 className="nx-h3">Hazır çözümler</h2>
            <p>Standart paketler; sizin eşsiz darboğazlarınızı, makine yaşlarınızı ve saha dinamiklerinizi <strong>görmezden gelir</strong>.</p>
            <ul className="nx-list nx-list-muted">
              <li>Standart modül, sahaya uydurulur</li>
              <li>Genel veriyle eğitilmiş model</li>
              <li>Başarı: "sistem kuruldu"</li>
            </ul>
          </div>
          <div className="nx-compare-card nx-compare-on">
            <div className="nx-compare-icon nx-compare-icon-on"><Cpu size={22} aria-hidden="true" /></div>
            <h2 className="nx-h3">Use-case odaklı AI</h2>
            <p>İhtiyacınız olan şey moda kelimeler değil; <strong>sadece sizin verinizle eğitilmiş</strong>, noktasal problemlere odaklanan özelleştirilmiş yapay zekâ entegrasyonlarıdır.</p>
            <ul className="nx-list">
              <li><Check size={16} aria-hidden="true" /> Çözüm, sahadaki soruna göre kurulur</li>
              <li><Check size={16} aria-hidden="true" /> Hattınızın verisiyle eğitilen model</li>
              <li><Check size={16} aria-hidden="true" /> Başarı: ilk gün yazılan ölçüt</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="nx-wrap">
        {/* ---------- YÖNTEM ---------- */}
        <section id="yontem" className="nx-section">
          <div className="nx-section-head">
            <h2 className="nx-h2">Veriden değere yolculuk</h2>
            <p className="nx-muted">Üç adım, her birinin somut bir çıktısı var. Hangi adımda olduğumuzu her zaman bilirsiniz.</p>
          </div>
          <ol className="nx-steps">
            <li className="nx-step">
              <span className="nx-step-num">01</span>
              <Database size={22} aria-hidden="true" />
              <h3 className="nx-h4">Sahadan veri toplama</h3>
              <p>Sensör, PLC, MES ve operatör bilgisi gibi farklı kaynaklardaki veriyi toplar, sisteme aktarırız.</p>
              <span className="nx-step-out">ÇIKTI → Veri envanteri</span>
            </li>
            <li className="nx-step">
              <span className="nx-step-num">02</span>
              <Search size={22} aria-hidden="true" />
              <h3 className="nx-h4">Darboğaz analizi</h3>
              <p>Veriyi analiz ederek darboğazları tespit eder, etkisine göre önceliklendiririz.</p>
              <span className="nx-step-out">ÇIKTI → Çözüm şartnamesi</span>
            </li>
            <li className="nx-step nx-step-dark">
              <span className="nx-step-num">03</span>
              <Cpu size={22} aria-hidden="true" />
              <h3 className="nx-h4">Özelleştirilmiş AI çözümü</h3>
              <p>İhtiyacınıza özel AI uygulamasını kurar, mevcut sistemlerinize entegre eder ve etkisini ölçeriz.</p>
              <span className="nx-step-out">ÇIKTI → Çalışan uygulama + etki raporu</span>
            </li>
          </ol>
          <div className="nx-benefits">
            <div><Target size={20} aria-hidden="true" /><strong>Daha doğru karar</strong><span>Veriye dayalı, isabetli içgörüler</span></div>
            <div><Clock size={20} aria-hidden="true" /><strong>Zaman ve kaynak tasarrufu</strong><span>Süreç optimizasyonuyla verimlilik</span></div>
            <div><BarChart3 size={20} aria-hidden="true" /><strong>Performans artışı</strong><span>Darboğazlar ortadan kalkar</span></div>
            <div><ShieldCheck size={20} aria-hidden="true" /><strong>Rekabet avantajı</strong><span>Size özel çözümle fark</span></div>
          </div>
        </section>

        {/* ---------- KONFİGÜRATÖR ---------- */}
        <section id="konfigurator" className="nx-section">
          <div className="nx-section-head">
            <div>
              <div className="nx-eyebrow">USE CASE KONFİGÜRATÖRÜ</div>
              <h2 className="nx-h2">Sorununuzu seçin, size özel çözüm taslağını görün.</h2>
            </div>
            <p className="nx-muted">Üç seçim yeterli. Taslak, saha keşfi görüşmesinin başlangıç noktası olur.</p>
          </div>
          <Configurator onOpenDemo={onOpenDemo} />
        </section>

        {/* ---------- ÇÖZÜM BLOKLARI ---------- */}
        <section id="bloklar" className="nx-section">
          <div className="nx-section-head">
            <div>
              <div className="nx-eyebrow">ÇÖZÜM BLOKLARI · CANLI DEMO</div>
              <h2 className="nx-h2">Kanıtlanmış bloklar, size özel birleşim</h2>
            </div>
            <p className="nx-muted">
              Bu yedi blok, sahada tekrar tekrar karşılaştığımız problem tiplerinden doğdu. Her biri tarayıcıda
              simüle veriyle çalışır; gerçek projede aynı blok sizin verinizle yeniden kurulur.
            </p>
          </div>
          <div className="nx-blocks">
            {BLOCKS.map(b => (
              <button key={b.id} type="button" className="nx-block" onClick={() => onOpenDemo(b.id)}>
                <span className="nx-block-meta"><span>{b.code}</span><span>{b.scope}</span></span>
                <span className="nx-block-title">{b.title}</span>
                <span className="nx-block-desc">{b.description}</span>
                <span className="nx-block-cta">Demoyu aç <ArrowRight size={14} aria-hidden="true" /></span>
              </button>
            ))}
            <a href="#konfigurator" className="nx-block nx-block-new">
              <span className="nx-block-meta"><span>B-0?</span><span>SİZİN SORUNUNUZ</span></span>
              <span className="nx-block-title">Yeni bir blok</span>
              <span className="nx-block-desc">Listede olmayan kronik bir sorun mu var? Bir sonraki blok oradan doğar.</span>
            </a>
          </div>
        </section>

        {/* ---------- UYGULAMALAR ---------- */}
        <section id="uygulamalar" className="nx-section">
          <div className="nx-section-head">
            <div>
              <div className="nx-eyebrow">SAHADAN UYGULAMALAR</div>
              <h2 className="nx-h2">Aynı mantalite, farklı sahalar</h2>
            </div>
            <p className="nx-muted">Her biri kendi sahasının verisiyle, kendi problemine göre kuruldu.</p>
          </div>
          <div className="nx-cases">
            {CASES.map(c => (
              <article key={c.name} className="nx-case">
                <div className="nx-case-head">
                  <div className="nx-case-title">
                    <div className="nx-case-sector">{c.sector}</div>
                    <h3 className="nx-h4">{c.name}</h3>
                  </div>
                  {CASE_VIDEOS[c.videoId] && (
                    <VideoThumb
                      video={CASE_VIDEOS[c.videoId]}
                      active={videoId === c.videoId}
                      onOpen={() => setVideoId(c.videoId)}
                    />
                  )}
                </div>
                <p className="nx-case-problem"><span className="nx-mono-label">Problem</span>{c.problem}</p>
                <div className="nx-case-io">
                  <div>
                    <span className="nx-mono-label">Girdi</span>
                    <ul>{c.inputs.map(i => <li key={i}>{i}</li>)}</ul>
                  </div>
                  <div>
                    <span className="nx-mono-label">Çıktı</span>
                    <ul>{c.outputs.map(o => <li key={o}>{o}</li>)}</ul>
                  </div>
                </div>
                <p className="nx-case-summary">{c.summary}</p>
              </article>
            ))}
          </div>
          <div className="nx-sectors">
            <span className="nx-mono-label">Farklı sektörler, tek yaklaşım</span>
            <div className="nx-chip-row">
              {SECTORS.map(s => <span key={s.id} className="nx-sector-tag">{s.label}</span>)}
            </div>
          </div>
        </section>

        {/* ---------- POC → ON-PREM ---------- */}
        <section id="entegrasyon" className="nx-section">
          <div className="nx-section-head">
            <h2 className="nx-h2">Tarayıcıdan fabrika zeminine</h2>
          </div>
          <div className="nx-compare nx-compare-tight">
            <div className="nx-compare-card">
              <div className="nx-compare-icon"><Globe size={22} aria-hidden="true" /></div>
              <h3 className="nx-h3">Sanal PoC — bu site</h3>
              <ul className="nx-list">
                <li><Check size={16} aria-hidden="true" /> Sunucu gerektirmez, tarayıcı tabanlıdır</li>
                <li><Check size={16} aria-hidden="true" /> Standart demo senaryoları ve simüle veri içerir</li>
                <li><Check size={16} aria-hidden="true" /> "Ne mümkün?" sorusuna ilham verir</li>
              </ul>
            </div>
            <div className="nx-compare-card nx-compare-on">
              <div className="nx-compare-icon nx-compare-icon-on"><Server size={22} aria-hidden="true" /></div>
              <h3 className="nx-h3">Sizin gerçekliğiniz — on-premise</h3>
              <ul className="nx-list">
                <li><Check size={16} aria-hidden="true" /> Tesisinize yerel ve güvenli kurulum</li>
                <li><Check size={16} aria-hidden="true" /> Verileriniz fabrikanızın dışına çıkmaz</li>
                <li><Check size={16} aria-hidden="true" /> Gerçek saha sensörlerinizle beslenir, asıl ROI metriklerini üretir</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="nx-final">
          <div>
            <div className="nx-eyebrow nx-eyebrow-light">SİMÜLASYON BİTTİ</div>
            <h2 className="nx-h2">Şimdi sizin verilerinizle, sizin gerçekliğinizi inşa etme zamanı.</h2>
            <p className="nx-final-mail">
              Saha keşfi talepleri için: <a href={MAILTO}>{CONTACT_EMAIL}</a>
            </p>
          </div>
          <div className="nx-cta-row">
            <a href={MAILTO} className="nx-btn nx-btn-accent">Saha keşfi planlayın</a>
            <a href="#konfigurator" className="nx-btn nx-btn-ghost">Önce taslak oluşturun</a>
          </div>
        </section>

        <footer className="nx-footer">
          <span>Industrial AI Nexus · Tailored industrial AI solutions &amp; applications · ACD · <a href={MAILTO} className="nx-footer-mail">{CONTACT_EMAIL}</a></span>
          <button type="button" className="nx-version" onClick={onShowChangelog}>
            <span className="nx-version-dot" aria-hidden="true" /> v{version} · Sürüm notları
          </button>
        </footer>
      </div>
    </div>
  );
}
