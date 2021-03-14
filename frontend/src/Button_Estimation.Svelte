<script>
    import {    toggleButton, 
                setEstimation       } from "./main.js";
    export let value;

    const estimate = () => {
        toggleButton(value);
        setEstimation(value);
    }
</script>

<div class="two columns">
    <button id={value} class="u-full-width" on:click={estimate}>{value}</button>
</div>