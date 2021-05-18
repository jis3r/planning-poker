<script>
	import Router from 'svelte-spa-router';
	import { push } from 'svelte-spa-router';

	import Navbar from './Navbar.svelte';
	import routes from './routes.js';

	export let socket;

	socket.on('newRoom', (newRoom) => {
        push('/room/' + newRoom);
    });
</script>

<main>
	<Navbar/>
	<div class="container">
		<Router {routes}/>
	</div>
</main>

<style>
</style>