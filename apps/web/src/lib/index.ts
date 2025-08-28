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
};

export function createBoard(species: SpeciesItem[], size = 5): Board {
  const items = [...species];
  items.sort(() => Math.random() - 0.5);
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
      label: 'Grass',
      image: '/grass.svg',
      checked: true,
      isFree: true
    };
  }
  return { size, tiles };
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
