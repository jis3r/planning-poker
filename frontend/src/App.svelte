<script>
	import Router from 'svelte-spa-router';
	import { push } from 'svelte-spa-router';

	import Navbar from './Navbar.svelte';
	import routes from './routes.js';


	socket.on('newRoom', (newRoom) => {
        push('/room/' + newRoom);
    });
</script>

<main>
	<Navbar/>
	<div class="container" style="margin-top: 80px">
		<Router {routes}/>
	</div>
</main>