import { useMemo, useState } from 'react';
import type { ModuleType } from '../types';
import { CONTACT_EMAIL, DATA_SOURCES, PROBLEMS, SECTORS, type DataSourceId } from './content';

interface Props {
  onOpenDemo: (id: ModuleType) => void;
}

export default function Configurator({ onOpenDemo }: Props) {
  const [sectorId, setSectorId] = useState(SECTORS[0].id);
  const [problemId, setProblemId] = useState(PROBLEMS[0].id);
  const [data, setData] = useState<Set<DataSourceId>>(() => new Set<DataSourceId>(['sensor', 'plc']));

  const sector = SECTORS.find(s => s.id === sectorId)!;
  const problem = PROBLEMS.find(p => p.id === problemId)!;

  const gaps = useMemo(
    () => problem.required.filter(r => !data.has(r)).map(r => DATA_SOURCES.find(d => d.id === r)!.label),
    [problem, data],
  );

  const code = `NX-${sectorId.slice(0, 3).toUpperCase()}-${problemId.toUpperCase()}`;

  const toggle = (id: DataSourceId) =>
    setData(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const mailto = useMemo(() => {
    const selected = DATA_SOURCES.filter(d => data.has(d.id)).map(d => d.label).join(', ') || '—';
    const body = [
      `Çözüm taslağı: ${code}`,
      `Sektör: ${sector.label}`,
      `Sorun: ${problem.label}`,
      `Mevcut veri: ${selected}`,
      `Önerilen bloklar: ${problem.blocks.join(' + ')}`,
      `Başarı ölçütü: ${problem.metric}`,
      '',
      'Sahamızdaki durumu kısaca anlatmak isterim:',
    ].join('\n');
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Saha keşfi talebi — ${code}`)}&body=${encodeURIComponent(body)}`;
  }, [code, sector, problem, data]);

  return (
    <div className="nx-config">
      <div className="nx-config-form">
        <fieldset className="nx-fieldset">
          <legend className="nx-mono-label">1 · Sektör</legend>
          <div className="nx-chip-row">
            {SECTORS.map(s => (
              <button
                key={s.id}
                type="button"
                className={`nx-chip${s.id === sectorId ? ' is-on' : ''}`}
                aria-pressed={s.id === sectorId}
                onClick={() => setSectorId(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="nx-fieldset">
          <legend className="nx-mono-label">2 · Sahadaki kronik sorun</legend>
          <div className="nx-chip-grid">
            {PROBLEMS.map(p => (
              <button
                key={p.id}
                type="button"
                className={`nx-chip${p.id === problemId ? ' is-on' : ''}`}
                aria-pressed={p.id === problemId}
                onClick={() => setProblemId(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="nx-fieldset">
          <legend className="nx-mono-label">3 · Elinizdeki veri (çoklu seçim)</legend>
          <div className="nx-chip-row">
            {DATA_SOURCES.map(d => {
              const on = data.has(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  className={`nx-chip nx-chip-data${on ? ' is-on' : ''}`}
                  aria-pressed={on}
                  onClick={() => toggle(d.id)}
                >
                  <span aria-hidden="true">{on ? '✓' : '+'}</span> {d.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      <div className="nx-spec nx-config-result" aria-live="polite">
        <div className="nx-spec-head">
          <span>ÇÖZÜM TASLAĞI · {code}</span>
          <span className="nx-accent-text">TAILORED</span>
        </div>

        <div className="nx-result-block">
          <div className="nx-mono-label">Problem</div>
          <div className="nx-result-title">{problem.label} · {sector.label}</div>
          <p className="nx-result-note">{sector.note}</p>
        </div>

        <div className="nx-result-block">
          <div className="nx-mono-label">Önerilen blok kombinasyonu</div>
          <div className="nx-chip-row">
            {problem.blocks.map(b => <span key={b} className="nx-block-pill">{b}</span>)}
          </div>
        </div>

        <div className="nx-result-block">
          <div className="nx-mono-label">Veri durumu</div>
          {gaps.length > 0 ? (
            <div className="nx-gap nx-gap-warn">
              <strong>Keşifte ölçüm planı gerekecek:</strong>
              {gaps.map(g => <span key={g}>— {g}</span>)}
            </div>
          ) : (
            <div className="nx-gap nx-gap-ok">Temel veri mevcut görünüyor; pilot hızlı başlayabilir.</div>
          )}
        </div>

        <div className="nx-result-kpis">
          <div className="nx-kpi">
            <span className="nx-mono-label">Başarı ölçütü</span>
            <strong>{problem.metric}</strong>
          </div>
          <div className="nx-kpi">
            <span className="nx-mono-label">İlk adım</span>
            <strong>{problem.firstStep}</strong>
          </div>
        </div>

        <div className="nx-spec-foot">
          <a className="nx-btn nx-btn-accent" href={mailto}>Bu taslakla saha keşfi iste</a>
          <button type="button" className="nx-btn nx-btn-outline" onClick={() => onOpenDemo(problem.demo)}>
            İlgili demoyu aç
          </button>
        </div>
      </div>
    </div>
  );
}
