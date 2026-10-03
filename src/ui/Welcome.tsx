import { useEffect, useState, type CSSProperties } from 'react';
import { Icon } from './Icon';

const points = [
  [105, 220],
  [280, 85],
  [455, 150],
  [540, 350],
  [345, 440],
  [160, 400],
];
const links = [
  [0, 1],
  [0, 5],
  [1, 2],
  [1, 4],
  [2, 3],
  [2, 4],
  [3, 4],
  [4, 5],
  [5, 1],
];

export function LivingNetwork() {
  const [paused, setPaused] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  );
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const change = () => setPaused(media?.matches ?? false);
    media?.addEventListener('change', change);
    return () => media?.removeEventListener('change', change);
  }, []);
  return (
    <div className={`living-network ${paused ? 'motion-paused' : ''}`}>
      <svg viewBox="0 0 650 530" fill="none" aria-hidden="true">
        <defs>
          <pattern id="network-dots" width="25" height="25" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" className="network-dot" />
          </pattern>
        </defs>
        <rect width="650" height="530" fill="url(#network-dots)" />
        <circle className="network-orbit" cx="325" cy="270" r="210" />
        <circle className="network-orbit inner" cx="325" cy="270" r="135" />
        {links.map(([a, b], i) => (
          <g key={`${a}-${b}`}>
            <path className="network-line" d={`M${points[a].join(',')} L${points[b].join(',')}`} />
            {!paused && (
              <circle className="network-signal" r="4">
                <animateMotion
                  dur={`${4 + (i % 3)}s`}
                  begin={`${i * -0.8}s`}
                  repeatCount="indefinite"
                  path={`M${points[a].join(',')} L${points[b].join(',')}`}
                />
              </circle>
            )}
          </g>
        ))}
        {points.map(([x, y], i) => (
          <g
            key={i}
            className={`network-point point-${i}`}
            style={{ transformOrigin: `${x}px ${y}px` }}
          >
            <circle className="point-halo" cx={x} cy={y} r="43" />
            <circle className="point-fill" cx={x} cy={y} r="30" />
            <text x={x} y={y + 6} textAnchor="middle">
              {i + 1}
            </text>
          </g>
        ))}
        <g className="network-label">
          <rect x="390" y="43" width="180" height="44" rx="22" />
          <circle cx="415" cy="65" r="5" className="network-signal" />
          <text x="432" y="70">
            Todo está conectado
          </text>
        </g>
      </svg>
      <div className="network-note" aria-hidden="true">
        <span className="mini-icon">
          <Icon name="connect" />
        </span>
        <div>
          <strong>Una idea. Muchas conexiones.</strong>
          <span>Explora lo que las une.</span>
        </div>
      </div>
      <button
        className="network-motion icon-button"
        aria-label={paused ? 'Reanudar animación de portada' : 'Pausar animación de portada'}
        title={paused ? 'Reanudar animación' : 'Pausar animación'}
        onClick={() => setPaused(!paused)}
      >
        <Icon name={paused ? 'play' : 'pause'} size={16} />
      </button>
    </div>
  );
}

export function Welcome({ onStart, onTutorial }: { onStart: () => void; onTutorial: () => void }) {
  return (
    <main className="welcome" id="main-content">
      <div className="welcome-copy">
        <span className="overline">
          <span className="live-dot" /> Tu espacio para explorar grafos
        </span>
        <h1 tabIndex={-1}>
          Entre puntos,
          <br />
          <span>hay caminos.</span>
        </h1>
        <p>Unos puntos, unas flechas y una nueva forma de entender cómo se relacionan.</p>
        <div className="hero-actions">
          <button className="button primary large" onClick={onStart}>
            Empezar a explorar <Icon name="arrow" />
          </button>
          <button className="button light large" onClick={onTutorial}>
            <Icon name="play" size={17} /> Cómo funciona
          </button>
        </div>
        <div className="welcome-features">
          <span>
            <Icon name="move" size={16} /> Arrastra y conecta
          </span>
          <span>
            <Icon name="grid" size={16} /> Descubre paso a paso
          </span>
        </div>
      </div>
      <LivingNetwork />
      <div className="welcome-bottom">
        <span>MATEMÁTICA COMPUTACIONAL</span>
        <span>
          Un pequeño laboratorio de grandes conexiones <Icon name="spark" size={16} />
        </span>
        <span>PROYECTO D</span>
      </div>
    </main>
  );
}

export function LearnPage({ onTry }: { onTry: () => void }) {
  return (
    <main className="info-page" id="main-content">
      <span className="section-kicker">Una vuelta por Conexa</span>
      <h1 tabIndex={-1}>Aprende haciendo.</h1>
      <p className="page-subtitle">
        Tres ideas para empezar. El resto, lo descubrirás en el lienzo.
      </p>
      <div className="learn-grid">
        <article className="learn-card">
          <div className="lesson-art lesson-connect">
            <span>1</span>
            <i />
            <span>2</span>
          </div>
          <span className="lesson-number">01 / CONECTA</span>
          <h2>Dale forma a tu red</h2>
          <p>Toca un origen y un destino. Arrastra los vértices para acomodarlos.</p>
        </article>
        <article className="learn-card">
          <div className="lesson-art lesson-matrix">
            {[1, 0, 1, 0, 1, 1, 0, 0, 1].map((v, i) => (
              <span className={v ? 'lit' : ''} key={i}>
                {v}
              </span>
            ))}
          </div>
          <span className="lesson-number">02 / OBSERVA</span>
          <h2>Sigue cada cambio</h2>
          <p>Las conexiones se vuelven números. Recorre la matriz a tu ritmo.</p>
        </article>
        <article className="learn-card">
          <div className="lesson-art lesson-groups">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
          </div>
          <span className="lesson-number">03 / DESCUBRE</span>
          <h2>Encuentra los grupos</h2>
          <p>Dos vértices están juntos cuando puedes ir de uno al otro y regresar.</p>
        </article>
      </div>
      <div className="learn-cta">
        <span>
          <Icon name="bulb" /> El foquito te guía en cada pantalla.
        </span>
        <button className="button primary" onClick={onTry}>
          Probar con guía <Icon name="arrow" />
        </button>
      </div>
    </main>
  );
}

export function CreditsPage() {
  const [active, setActive] = useState(0);
  const members = [
    { name: 'Kenneth Anthony Cortez Pantaleon', initials: 'KC' },
    { name: 'Enrique Lopez Loyola', initials: 'EL' },
    { name: 'Alexander Edilberto Liñan Lezama', initials: 'AL' },
    { name: 'Jean Andre Contreras Perea', initials: 'JC' },
    { name: 'Johan Joel Rojas Valero', initials: 'JR' },
  ];
  const teamPoints = [
    [180, 52],
    [314, 148],
    [263, 302],
    [97, 302],
    [46, 148],
  ];
  return (
    <main className="info-page credits-page" id="main-content">
      <span className="section-kicker">Detrás de las conexiones</span>
      <h1 tabIndex={-1}>
        Cinco personas. <em>Una misma idea.</em>
      </h1>
      <p className="page-subtitle">Conexa · Proyecto D de Matemática Computacional.</p>
      <div className="credits-grid">
        <article className="credit-feature">
          <div className="team-network" aria-hidden="true">
            <svg viewBox="0 0 360 350">
              {teamPoints.map(([x, y], i) => (
                <g key={i} className={active === i ? 'team-point active' : 'team-point'}>
                  <path d={`M180 178 L${x} ${y}`} />
                  <circle cx={x} cy={y} r="29" />
                  <text x={x} y={y + 5} textAnchor="middle">
                    {members[i].initials}
                  </text>
                </g>
              ))}
              <circle className="team-center" cx="180" cy="178" r="52" />
              <text className="team-brand" x="180" y="186" textAnchor="middle">
                conexa.
              </text>
            </svg>
            <span className="team-network-caption" key={active}>
              Conexión 0{active + 1} / 05
            </span>
          </div>
          <div className="university">
            <img src="/upc-logo.png" alt="Logo UPC" width="55" height="55" />
            <span>Universidad Peruana de Ciencias Aplicadas</span>
          </div>
        </article>
        <div className="credit-details">
          <article className="card">
            <span className="section-kicker">El equipo</span>
            <h2>
              Las ideas se conectan.
              <br />
              Las personas también.
            </h2>
            <ul className="team-list">
              {members.map(({ name, initials }, i) => (
                <li key={name} style={{ '--member-index': i } as CSSProperties}>
                  <button
                    className={active === i ? 'team-member selected' : 'team-member'}
                    aria-pressed={active === i}
                    onClick={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onPointerEnter={() => setActive(i)}
                  >
                    <span className="member-avatar">{initials}</span>
                    <span className="member-name">
                      {name}
                      <small>Integrante del equipo</small>
                    </span>
                    <span className="member-number">0{i + 1}</span>
                  </button>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </main>
  );
}
