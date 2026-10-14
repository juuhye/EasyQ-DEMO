// 데모용 QR 모양 그림. 실제로 스캔되지는 않는다.

function seeded(code: string) {
  let h = 2166136261;
  for (const c of code) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 1000) / 1000;
  };
}

const N = 25;

function inFinder(x: number, y: number) {
  const zones = [
    [0, 0],
    [N - 7, 0],
    [0, N - 7],
  ];
  return zones.some(([zx, zy]) => x >= zx - 1 && x <= zx + 7 && y >= zy - 1 && y <= zy + 7);
}

export function FakeQR({ code, size = 180, dim = false }: { code: string; size?: number; dim?: boolean }) {
  const rand = seeded(code);
  const cells: [number, number][] = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!inFinder(x, y) && rand() > 0.52) cells.push([x, y]);

  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x + 0.5} y={y + 0.5} width={6} height={6} rx={1.6} fill="none" stroke="#121212" strokeWidth={1} />
      <rect x={x + 2} y={y + 2} width={3} height={3} rx={0.9} fill="#f4625a" />
    </g>
  );

  return (
    <svg viewBox={`-1 -1 ${N + 2} ${N + 2}`} width={size} height={size} className={dim ? "opacity-25 grayscale" : ""} role="img" aria-label={`입장 QR (${code})`}>
      <rect x={-1} y={-1} width={N + 2} height={N + 2} rx={2} fill="#fff" />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x + 0.08} y={y + 0.08} width={0.84} height={0.84} rx={0.28} fill="#121212" />
      ))}
      {finder(0, 0)}
      {finder(N - 7, 0)}
      {finder(0, N - 7)}
    </svg>
  );
}
