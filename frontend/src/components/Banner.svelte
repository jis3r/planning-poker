<script>
    import { fade } from "svelte/transition";
    export let msg;
    export let transition;

</script>

{#if transition}
    <h4 style="text-align: center;" out:fade>{msg}</h4>
{:else}
    <h4 style="visibility: hidden;">{msg}</h4>
{/if}