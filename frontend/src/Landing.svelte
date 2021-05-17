<script>
    import { createEventDispatcher, beforeUpdate } from "svelte";
    import { fade } from "svelte/transition";
    
    export const onload = null;

    const dispatch = createEventDispatcher();
    
    const setStart = (e) => {
        dispatch("changepage", 1);
    }    
    const setJoin = (e) => {
        dispatch("changepage", 2);
    }
</script>


<div class="row" style="margin-top: 15%; margin-bottom: 5%;" in:fade>
    <div class="nine columns" style="margin-bottom: 10%;">
        <h3>A simple, online planning poker tool.</h3>
        <span style="font-size: 15px">Just host a session or join an existing one to start estimating your user stories.</span>        
    </div>
    <div class="three columns indexbuttons" style="margin-bottom: 10%;">
        <button class="button-primary-start u-full-width" on:click={setStart}>Start</button>
        <button class="button-primary-join u-full-width" on:click={setJoin}>Join</button>
    </div>
</div>