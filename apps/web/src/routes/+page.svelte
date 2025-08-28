<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  // Make tiles clickable instead of using a checkbox
  import { Label } from '$lib/components/ui/label';
  import Check from '@lucide/svelte/icons/check';
  import type { Board, BoardTile } from '$lib';
  import { createBoard, fetchSpecies, loadBoard, saveBoard, clearBoard, hasBingo as checkBingo } from '$lib';

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
  let confetti = $state<Array<{ left: number; size: number; delay: number; duration: number; color: string; rotate: number }>>([]);
  let seed = $state<string>('');

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
      confetti = [];
      const species = await fetchSpecies('http://localhost:8787', { lat, lng, topN });
      board = createBoard(species, size, seed || undefined);
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
      launchBingo();
    }
  }

  const hasBingo = (b: Board) => checkBingo(b);

  function launchBingo() {
    const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6'];
    const pieces: Array<{ left: number; size: number; delay: number; duration: number; color: string; rotate: number }> = [];
    for (let i = 0; i < 140; i++) {
      pieces.push({
        left: Math.random() * 100,
        size: 6 + Math.random() * 10,
        delay: Math.random() * 600,
        duration: 2600 + Math.random() * 1600,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotate: Math.floor(Math.random() * 360)
      });
    }
    confetti = pieces;
    showBingo = true;
    setTimeout(() => (showBingo = false), 4200);
  }

  $effect(() => {
    document.title = 'BIMPO';
  });

  $effect(() => {
    if (board) saveBoard(BOARD_KEY, board);
  });

  function resetBoard() {
    clearBoard(BOARD_KEY);
    board = null;
    gameOver = false;
    showBingo = false;
    confetti = [];
  }
</script>
{#if showBingo}
  <div class="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm">
    <div class="absolute inset-0 overflow-hidden">
      {#each confetti as p}
        <span
          class="absolute will-change-transform rounded-sm"
          style={`left:${p.left}%; top:-10vh; width:${p.size}px; height:${p.size * 0.4}px; background:${p.color}; animation: fall ${p.duration}ms ease-out ${p.delay}ms forwards, spin ${Math.max(800, p.duration * 0.5)}ms linear ${p.delay}ms infinite; transform: rotate(${p.rotate}deg);`}
        ></span>
      {/each}
    </div>
    <div class="relative text-center select-none">
      <div class="text-6xl md:text-8xl font-extrabold text-white drop-shadow-[0_8px_12px_rgba(0,0,0,.45)] animate-pop">BIMPO!</div>
      <div class="mt-3 text-white/95 text-xl md:text-2xl animate-fade-up">You win! 🎉</div>
    </div>
  </div>
{/if}

{#if !board}
  <div class="mx-auto max-w-3xl p-4 space-y-6 min-h-dvh grid content-start">
    <h1 class="text-3xl font-bold tracking-tight">BIMPO</h1>
    <Card>
      <CardHeader>
        <CardTitle>Create a board</CardTitle>
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
          <div class="space-y-1 col-span-2">
            <Label for="seed">Seed (same seed reproduces board)</Label>
            <div class="flex gap-2">
              <input id="seed" class="border rounded px-2 py-1 w-full" bind:value={seed} placeholder="optional" />
              <Button type="button" variant="outline" onclick={() => seed = crypto.getRandomValues(new Uint32Array(1))[0].toString(16)}>Randomize</Button>
            </div>
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
  </div>
{:else}
  <div class="min-h-dvh grid content-start p-2 md:p-4">
    <div class="flex items-center justify-between mb-2">
      <h1 class="text-2xl font-bold tracking-tight">BIMPO</h1>
      <Button variant="outline" onclick={resetBoard}>Clear board</Button>
    </div>
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
  </div>
{/if}

<style>
  @keyframes fall {
    from { top: -10vh; }
    to { top: 110vh; }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes pop {
    0% { transform: scale(0.6); opacity: 0; }
    40% { transform: scale(1.1); opacity: 1; }
    60% { transform: scale(0.98); }
    100% { transform: scale(1); }
  }
  @keyframes fade-up {
    0% { opacity: 0; transform: translateY(12px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .animate-pop { animation: pop 600ms cubic-bezier(.2,.9,.2,1) forwards; }
  .animate-fade-up { animation: fade-up 700ms 120ms cubic-bezier(.2,.9,.2,1) forwards; }
</style>
