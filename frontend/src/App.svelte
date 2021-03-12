<script>
	import Navbar from './Navbar.svelte';
	import Landing from './Landing.svelte';
	import Start from './Start.svelte';
	import Join from './Join.svelte';
	import Lobby from './Lobby.svelte';

	var currentPage = 0;

	const setPage = (e) => {
		currentPage = e.detail;
	}

</script>

<main>
	<Navbar on:changepage={setPage}/>
	<div class="container">
		{#if currentPage === 0}
		<Landing on:changepage={setPage}/>
		{:else if currentPage === 1}
		<Start on:changepage={setPage}/>
		{:else if currentPage === 2}
		<Join on:changepage={setPage}/>
		{:else if currentPage === 3}
		<Lobby />
		{:else}
		<Landing />
		{/if}	
	</div>
</main>

<style>
</style>