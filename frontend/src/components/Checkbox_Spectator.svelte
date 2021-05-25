<script>
    import { createEventDispatcher, onMount } from "svelte";
    import { fade } from 'svelte/transition';

    export let isSpectator = false;

    const dispatch = createEventDispatcher();

    onMount(() => {
        toggleSpectator();
        toggleSpectator();
	});


    const toggleSpectator = () => {
        isSpectator = !isSpectator;
        dispatch("setRole", isSpectator);
    }
</script>

<div style="cursor: pointer;" on:click={toggleSpectator}>
    <div class="checkboxContainer">
        {#if isSpectator}
        <img style="vertical-align: middle;" src="img/eye.svg" alt="checked" in:fade>
        {:else}
        <img style="vertical-align: middle;" src="img/eye-off.svg" alt="unchecked" in:fade>
        {/if}
    </div>
    <span style="padding-top: 1px; float: left;">Join as spectator</span>
</div>