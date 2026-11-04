export default function Seal() {
  return (
    <div className="ed-seal" aria-hidden="true">
      <svg viewBox="0 0 120 120">
        <defs>
          <path id="ed-seal-circle" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" fill="none" />
        </defs>
        <text>
          <textPath href="#ed-seal-circle" textLength="276" lengthAdjust="spacingAndGlyphs">
            SkinCheck laporan kulit
          </textPath>
        </text>
      </svg>
      <span className="ed-seal-center">S</span>
    </div>
  );
}
