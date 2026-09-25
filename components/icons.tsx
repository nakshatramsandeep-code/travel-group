type IconProps = { className?: string };

/** Each string is one pixel row; each character indexes into `palette`. '.' is transparent. */
type Grid = string[];

function PixelIcon({
  grid,
  palette,
  className,
}: {
  grid: Grid;
  palette: Record<string, string>;
  className?: string;
}) {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  const cells: { x: number; y: number; fill: string }[] = [];
  grid.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === "." || !palette[ch]) return;
      cells.push({ x, y, fill: palette[ch] });
    });
  });

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {cells.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width={1} height={1} fill={c.fill} />
      ))}
    </svg>
  );
}

const grassGrid: Grid = [
  "gggggggg",
  "ggGgggGg",
  "bdbbdbbd",
  "bbbdbbbd",
  "bdbbbdbb",
  "bbbdbbdb",
  "bdbbdbbb",
  "bbbdbbbd",
];
const grassPalette = { g: "#6cad3f", G: "#7fc24f", b: "#8b5a2b", d: "#6b4423" };

export function GrassBlockIcon({ className }: IconProps) {
  return <PixelIcon grid={grassGrid} palette={grassPalette} className={className} />;
}

const chestGrid: Grid = [
  "........",
  ".wwwwww.",
  ".wkkkkw.",
  ".wkGGkw.",
  ".wkkkkw.",
  ".wwwwww.",
  ".wwwwww.",
  "........",
];
const chestPalette = { w: "#8b5a2b", k: "#4a3018", G: "#ffd700" };

export function ChestIcon({ className }: IconProps) {
  return <PixelIcon grid={chestGrid} palette={chestPalette} className={className} />;
}

const clockGrid: Grid = [
  "..kkkk..",
  ".kwwwwk.",
  "kwwwwwwk",
  "kwwGwwwk",
  "kwwGGwwk",
  "kwwwwwwk",
  ".kwwwwk.",
  "..kkkk..",
];
const clockPalette = { k: "#4a3018", w: "#e8d9b0", G: "#202020" };

export function ClockIcon({ className }: IconProps) {
  return <PixelIcon grid={clockGrid} palette={clockPalette} className={className} />;
}

const heartFullGrid: Grid = [
  "........",
  ".rr..rr.",
  "rrrrrrrr",
  "rrrrrrrr",
  ".rrrrrr.",
  "..rrrr..",
  "...rr...",
  "........",
];
const heartEmptyGrid: Grid = [
  "........",
  ".gg..gg.",
  "g......g",
  "g......g",
  ".g....g.",
  "..g..g..",
  "...gg...",
  "........",
];
const heartPalette = { r: "#e53935", g: "#5b5b5b" };

export function HeartIcon({
  className,
  filled = true,
}: IconProps & { filled?: boolean }) {
  return (
    <PixelIcon
      grid={filled ? heartFullGrid : heartEmptyGrid}
      palette={heartPalette}
      className={className}
    />
  );
}

const compassGrid: Grid = [
  "..kkkk..",
  ".kwwwwk.",
  "kwwwwwwk",
  "kwwrwwwk",
  "kwwwWwwk",
  "kwwwwwwk",
  ".kwwwwk.",
  "..kkkk..",
];
const compassPalette = { k: "#4a3018", w: "#c6c6c6", r: "#e53935", W: "#ffffff" };

export function CompassIcon({ className }: IconProps) {
  return <PixelIcon grid={compassGrid} palette={compassPalette} className={className} />;
}

const tntGrid: Grid = [
  "wwwwwwww",
  "wrrrrrrw",
  "wrWWWWrw",
  "wrrrrrrw",
  "wrWWWWrw",
  "wrrrrrrw",
  "wwwwwwww",
  "........",
];
const tntPalette = { w: "#e0e0e0", r: "#c62828", W: "#202020" };

export function TntIcon({ className }: IconProps) {
  return <PixelIcon grid={tntGrid} palette={tntPalette} className={className} />;
}

const mapGrid: Grid = [
  "kkkkkkkk",
  "kppppppk",
  "kpXppXpk",
  "kppppppk",
  "kpXppppk",
  "kppppXpk",
  "kppppppk",
  "kkkkkkkk",
];
const mapPalette = { k: "#4a3018", p: "#e8d9b0", X: "#a0714b" };

export function MapIcon({ className }: IconProps) {
  return <PixelIcon grid={mapGrid} palette={mapPalette} className={className} />;
}

const xpOrbGrid: Grid = [
  "..g..g..",
  ".g.gg.g.",
  "g.gggg.g",
  ".gggggg.",
  "g.gggg.g",
  ".g.gg.g.",
  "..g..g..",
  "........",
];
const xpOrbPalette = { g: "#7fd93f" };

export function XpOrbIcon({ className }: IconProps) {
  return <PixelIcon grid={xpOrbGrid} palette={xpOrbPalette} className={className} />;
}

const skinTones = ["#f0c090", "#c98d5f", "#8a5a3c", "#e8b07a"];
const hairTones = ["#4a2c17", "#1a1a1a", "#8b5a2b", "#2b2b2b"];

export function PlayerHeadIcon({
  className,
  seed = 0,
}: IconProps & { seed?: number }) {
  const skin = skinTones[seed % skinTones.length];
  const hair = hairTones[seed % hairTones.length];
  const grid: Grid = [
    "hhhhhhhh",
    "hssssssh",
    "sssEssEs",
    "ssssssss",
    "ssssssss",
    "ssmmmmss",
    "ssssssss",
    "........",
  ];
  const palette = { h: hair, s: skin, E: "#202020", m: "#a05a3c" };
  return <PixelIcon grid={grid} palette={palette} className={className} />;
}

export function CheckIcon({ className }: IconProps) {
  const grid: Grid = [
    "........",
    ".......c",
    "......cc",
    ".c...cc.",
    ".cc.cc..",
    "..ccc...",
    "...c....",
    "........",
  ];
  return <PixelIcon grid={grid} palette={{ c: "#7fd93f" }} className={className} />;
}
