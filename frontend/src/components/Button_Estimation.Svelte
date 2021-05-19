<script>
    import { createEventDispatcher } from "svelte";
    export let value;

    const dispatch = createEventDispatcher();

    const estimate = () => {
        toggleButton(value);
        dispatch("setEstimation", value);
    }

    function toggleButton(id) {
        let el = document.getElementsByClassName('button-primary-positive');
        if(el.length !== 0) {
            el[0].classList.toggle('button-primary-positive');
        }
        el = document.getElementById(id);
        el.classList.toggle('button-primary-positive');
    }
</script>

<div class="two columns">
    <button id={value} class="u-full-width" on:click={estimate} onclick="this.blur();">{value}</button>
</div>