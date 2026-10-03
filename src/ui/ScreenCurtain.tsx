/** Solo los botones de portada despliegan dos crestas que se desplazan. */
export function ScreenCurtain({ phase }: { phase: 'idle' | 'cover' | 'reveal' }) {
  if (phase === 'idle') return null;
  return (
    <div className={`curtain-shield ${phase}`} aria-hidden="true">
      <div className="wave-transition">
        <div className="wave-crest">
          <svg className="wave-back" viewBox="0 0 2880 260" preserveAspectRatio="none">
            <path d="M0 115C180 15 300 205 480 115S790 10 960 115S1270 205 1440 115S1750 10 1920 115S2230 205 2400 115S2710 10 2880 115V260H0Z" />
          </svg>
          <svg className="wave-front" viewBox="0 0 2880 260" preserveAspectRatio="none">
            <path d="M0 172C190 72 290 245 480 155S790 60 960 165S1270 235 1440 155S1750 60 1920 165S2230 235 2400 155S2710 65 2880 172V260H0Z" />
          </svg>
        </div>
        <div className="wave-fill" />
      </div>
    </div>
  );
}
