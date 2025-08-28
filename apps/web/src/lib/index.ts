// place files you want to import through the `$lib` alias in this folder.

export type SpeciesItem = {
  id: number;
  name: string;
  preferredCommonName: string | null;
  iconicTaxonName: string | null;
  photoUrl: string | null;
  count: number;
};

export type SpeciesQuery = {
  lat: number;
  lng: number;
  radiusKm?: number;
  month?: number;
  topN?: number;
};

export async function fetchSpecies(
  baseUrl: string,
  query: SpeciesQuery
): Promise<SpeciesItem[]> {
  const params = new URLSearchParams({
    lat: String(query.lat),
    lng: String(query.lng)
  });
  if (query.radiusKm) params.set('radius', String(query.radiusKm));
  if (query.topN) params.set('n', String(query.topN));

  const res = await fetch(`${baseUrl}/api/species?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch species');
  const data = await res.json();
  return (data.items ?? []) as SpeciesItem[];
}

export type BoardTile = {
  id: number;
  label: string;
  image?: string | null;
  checked: boolean;
  isFree?: boolean;
};

export type Board = {
  size: number;
  tiles: BoardTile[];
  seed?: string;
};

export function createBoard(species: SpeciesItem[], size = 5, seed?: string): Board {
  const items = seed ? shuffleWithSeed(species, seed) : [...species].sort(() => Math.random() - 0.5);
  const needed = size * size;
  const selected = items.slice(0, needed);
  const tiles: BoardTile[] = selected.map((s) => ({
    id: s.id,
    label: s.preferredCommonName || s.name,
    image: s.photoUrl,
    checked: false
  }));
  if (size % 2 === 1 && tiles.length === needed) {
    const center = Math.floor(needed / 2);
    tiles[center] = {
      id: -1,
      label: 'Human',
      image: '/human.svg',
      checked: true,
      isFree: true
    };
  }
  return { size, tiles, seed };
}

export function saveBoard(key: string, board: Board) {
  localStorage.setItem(key, JSON.stringify(board));
}

export function loadBoard(key: string): Board | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Board;
  } catch {
    return null;
  }
}

export function clearBoard(key: string) {
  localStorage.removeItem(key);
}

export function hasBingo(board: Board): boolean {
  const n = board.size;
  const t = board.tiles;
  // rows
  for (let r = 0; r < n; r++) {
    let all = true;
    for (let c = 0; c < n; c++) if (!t[r * n + c]?.checked) { all = false; break; }
    if (all) return true;
  }
  // cols
  for (let c = 0; c < n; c++) {
    let all = true;
    for (let r = 0; r < n; r++) if (!t[r * n + c]?.checked) { all = false; break; }
    if (all) return true;
  }
  // main diag
  {
    let all = true;
    for (let i = 0; i < n; i++) if (!t[i * (n + 1)]?.checked) { all = false; break; }
    if (all) return true;
  }
  // anti diag
  {
    let all = true;
    for (let i = 1; i <= n; i++) if (!t[i * (n - 1)]?.checked) { all = false; break; }
    if (all) return true;
  }
  return false;
}

// Deterministic shuffle utilities
export function shuffleWithSeed<T>(array: T[], seedText: string): T[] {
  const seed = fnv1a(seedText);
  const rng = mulberry32(seed);
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

export function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
