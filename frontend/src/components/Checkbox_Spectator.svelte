<script>
    import { createEventDispatcher } from "svelte";
    import { fade } from 'svelte/transition';

    export let isSpectator = false;

    const dispatch = createEventDispatcher();


    const toggleSpectator = () => {
        isSpectator = !isSpectator;
        dispatch("setRole", isSpectator);
    }
</script>

<div style="vertical-align: middle;" on:click={toggleSpectator}>
    {#if isSpectator}
    <img style="vertical-align: middle;" src="img/eye.svg" alt="checked" in:fade>
    {:else}
    <img style="vertical-align: middle;" src="img/eye-off.svg" alt="unchecked" in:fade>
    {/if}
    <span style="vertical-align: middle;">Join as spectator</span>
</div>