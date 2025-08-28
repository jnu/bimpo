<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  // Make tiles clickable instead of using a checkbox
  import { Label } from '$lib/components/ui/label';
  import Check from '@lucide/svelte/icons/check';
  import type { Board, BoardTile } from '$lib';
  import { createBoard, fetchSpecies, loadBoard, saveBoard } from '$lib';

  const BOARD_KEY = 'bimpo-board';
  let board = $state<Board | null>(null);
  let lat = $state(37.7749);
  let lng = $state(-122.4194);
  let topN = $state(25);
  let size = $state(5);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let showBingo = $state(false);
  let gameOver = $state(false);

  onMount(() => {
    const existing = loadBoard(BOARD_KEY);
    if (existing) {
      board = existing;
      if (board && hasBingo(board)) {
        gameOver = true;
      }
    }
  });

  async function useGeolocation() {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000
        });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {}
  }

  async function generate() {
    loading = true;
    error = null;
    try {
      gameOver = false;
      showBingo = false;
      const species = await fetchSpecies('http://localhost:8787', { lat, lng, topN });
      board = createBoard(species, size);
    } catch (e) {
      error = 'Failed to generate board';
    } finally {
      loading = false;
    }
  }

  function toggle(tile: BoardTile) {
    if (!board || gameOver) return;
    if (tile.isFree) return;
    tile.checked = !tile.checked;
    board = { ...board };
    if (hasBingo(board)) {
      gameOver = true;
      showBingo = true;
      setTimeout(() => (showBingo = false), 2200);
    }
  }

  function hasBingo(b: Board): boolean {
    const n = b.size;
    const t = b.tiles;
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

  $effect(() => {
    document.title = 'BIMPO';
  });

  $effect(() => {
    if (board) saveBoard(BOARD_KEY, board);
  });
</script>
{#if showBingo}
  <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-4 py-2 rounded shadow-lg">
    BIMPO! You got a bingo 🎉
  </div>
{/if}

<div class="mx-auto max-w-5xl p-4 space-y-6">
  <h1 class="text-3xl font-bold tracking-tight">BIMPO</h1>

  <Card>
    <CardHeader>
      <CardTitle>Generate a board</CardTitle>
    </CardHeader>
    <CardContent class="space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1">
          <Label for="lat">Latitude</Label>
          <input id="lat" class="border rounded px-2 py-1 w-full" bind:value={lat} type="number" step="any" />
        </div>
        <div class="space-y-1">
          <Label for="lng">Longitude</Label>
          <input id="lng" class="border rounded px-2 py-1 w-full" bind:value={lng} type="number" step="any" />
        </div>
        <div class="space-y-1">
          <Label for="topN">Pool size (top N)</Label>
          <input id="topN" class="border rounded px-2 py-1 w-full" bind:value={topN} type="number" min="5" max="100" />
        </div>
        <div class="space-y-1">
          <Label for="size">Board size</Label>
          <input id="size" class="border rounded px-2 py-1 w-full" bind:value={size} type="number" min="3" max="6" />
        </div>
      </div>
      <div class="flex gap-2">
        <Button variant="secondary" onclick={useGeolocation}>Use my location</Button>
        <Button onclick={generate} disabled={loading}>{loading ? 'Generating...' : 'Generate Board'}</Button>
      </div>
      {#if error}
        <p class="text-red-600 text-sm">{error}</p>
      {/if}
    </CardContent>
  </Card>

  {#if board}
    <div class="grid gap-[2px] bg-border rounded-md overflow-hidden outline outline-2 outline-border" style={`grid-template-columns: repeat(${board.size}, minmax(0, 1fr));`}>
      {#each board.tiles as tile}
        <div
          role="button"
          tabindex={gameOver ? -1 : 0}
          aria-pressed={tile.checked}
          aria-disabled={gameOver}
          onclick={() => toggle(tile)}
          onkeydown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(tile); } }}
          class={`relative p-2 flex flex-col items-center justify-between select-none transition-all ${gameOver || tile.isFree ? 'cursor-default' : 'cursor-pointer hover:bg-accent'} ${tile.checked ? 'bg-primary/15 ring-2 ring-primary/50' : 'bg-background'}`}
        >
          <div class={`text-center text-sm font-medium ${tile.checked && !tile.isFree ? 'line-through text-muted-foreground' : ''}`}>{tile.label}</div>
          {#if tile.image}
            <img src={tile.image} alt={tile.label} class={`w-full h-28 object-cover my-2 ${tile.checked ? 'opacity-60 grayscale' : ''}`} />
          {/if}
          {#if tile.checked}
            <div class="absolute inset-0 grid place-items-center pointer-events-none">
              <Check class="size-16 text-primary/70" />
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
