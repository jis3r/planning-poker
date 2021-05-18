import Landing from './routes/Landing.svelte';
import Start from './routes/Start.svelte';
import Join from './routes/Join.svelte';
import Lobby from './routes/Lobby.svelte';
import NotFound from './routes/NotFound.svelte';

export default {
    '/': Landing,
    '/start': Start,
    '/join/:id?': Join,
    '/room/:id': Lobby,
    '*': NotFound
}