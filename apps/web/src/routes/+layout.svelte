<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { loadBoard } from '$lib';

	const BOARD_KEY = 'bimpo-board';
	let hasBoard = $state(false);

	$effect(() => {
		hasBoard = !!loadBoard(BOARD_KEY);
	});

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class={hasBoard ? 'min-h-dvh' : ''}>
	{@render children?.()}
</div>
