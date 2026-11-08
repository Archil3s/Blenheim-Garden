export const seedContainers = [
  { name: "Six-cell tray", columns: 3, rows: 2, caption: "6 individual cells" },
  { name: "12-cell tray", columns: 4, rows: 3, caption: "12 individual cells" },
  { name: "24-cell tray", columns: 6, rows: 4, caption: "24 individual cells" },
  { name: "72-cell plug tray", columns: 12, rows: 6, caption: "72 small plugs" },
  { name: "Open seed tray", columns: 0, rows: 0, caption: "Undivided sowing flat" },
  { name: "Nursery pots", columns: 0, rows: 0, caption: "Individual pots" },
  { name: "Direct in bed", columns: 0, rows: 0, caption: "Sown straight into soil" },
] as const;

export function SeedContainerArt({ name }: { name: string }) {
  const tray = seedContainers.find(item => item.name === name);
  return <svg viewBox="0 0 104 68" aria-hidden="true" focusable="false" className="seed-container-art">
    {name === "Nursery pots" ? [33, 70].map((x, i) => <g key={x} transform={`translate(${x} ${i === 0 ? 0 : 6})`}>
      <path d="m-15 22 4 30q11 6 22 0l4-30" fill={i === 0 ? "#626763" : "#424b45"} stroke="#29332d" />
      <ellipse cy="22" rx="16" ry="7" fill="#79817b" stroke="#29332d" />
      <ellipse cy="22" rx="12" ry="4.5" fill="#6a4b36" />
    </g>) : name === "Direct in bed" ? <g>
      <path d="m18 20 68 0 10 36H8Z" fill="#8c674c" stroke="#5e4331" />
      {[26, 37, 48].map(y => <path key={y} d={`M20 ${y}Q50 ${y - 5} 84 ${y}`} fill="none" stroke="#c7a47d" strokeWidth="3" />)}
    </g> : <g>
      <path d="M10 16h84l-4 41q0 4-5 4H19q-5 0-5-4Z" fill="#343c36" stroke="#26302a" />
      <rect x="7" y="9" width="90" height="45" rx="5" fill="#6b756d" stroke="#29332d" strokeWidth="2" />
      {tray && tray.rows > 0 ? Array.from({ length: tray.rows * tray.columns }, (_, index) => {
        const width = 80 / tray.columns;
        const height = 35 / tray.rows;
        return <rect key={index} x={12 + index % tray.columns * width} y={14 + Math.floor(index / tray.columns) * height}
          width={width - 1.1} height={height - 1.1} rx={Math.min(3, width / 4)}
          fill="#594131" stroke="#29332d" strokeWidth=".8" />;
      }) : <rect x="13" y="15" width="78" height="33" rx="3" fill="#6a4b36" stroke="#29332d" />}
    </g>}
  </svg>;
}

export function SeedContainerPicker({ value, onChange, disabled = false }: { value: string; onChange: (name: string) => void; disabled?: boolean }) {
  return <fieldset className="seed-container-picker" disabled={disabled}>
    <legend>Tray or container</legend>
    <div className="seed-container-options">{seedContainers.map(item => <label key={item.name} className="seed-container-option">
      <input type="radio" name="seed-container-preset" checked={value === item.name} onChange={() => onChange(item.name)} />
      <SeedContainerArt name={item.name} />
      <strong>{item.name}</strong><small>{item.caption}</small>
    </label>)}</div>
    <label className="seed-container-name">Container name or custom setup
      <input value={value} onChange={event => onChange(event.target.value)} />
    </label>
  </fieldset>;
}
