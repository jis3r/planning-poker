<script>
    import { fade } from 'svelte/transition';
    import { push } from 'svelte-spa-router';
    
    export const onload = null;

    
    const setStart = () => {
        push('/start');
    }    
    const setJoin = () => {
        push('/join');
    }
</script>


<div class="row" style="margin-top: 15%; margin-bottom: 5%;" in:fade>
    <div class="nine columns" style="margin-bottom: 10%;">
        <h3>A simple, online planning poker tool.</h3>
        <span style="font-size: 15px">Just start a session or join an existing one to estimate your user stories.</span>        
    </div>
    <div class="three columns indexbuttons" style="margin-bottom: 10%;">
        <button class="button-primary-start u-full-width" on:click={setStart}>Start</button>
        <button class="button-primary-join u-full-width" on:click={setJoin}>Join</button>
    </div>
</div>