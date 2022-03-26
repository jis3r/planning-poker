<script>
    import { createEventDispatcher } from "svelte";
    import { fade } from "svelte/transition";

    const dispatch = createEventDispatcher();
    let clicked = false;

    const stay = () => {
        dispatch("leave", false)
    }

    const leave = () => {
        dispatch("leave", true);
    }
    const close = () => {
        if( clicked ) stay();
        clicked = true
    }
</script>
<div class="modal" id="modal" transition:fade on:click|stopPropagation>
    <div class="container">
        <div class="row">
            <div class="twelve columns" style="margin-bottom: 15%; margin-top: 10%; text-align: center">Do you really want to leave the lobby?</div>
        </div>
        <div class="row" style="margin-bottom: 10%;">
            <div class="six columns">
                <button class="button-primary-join u-full-width" on:click={stay} onclick="this.blur();">stay</button>
            </div>
            <div class="six columns">
                <button class="button-primary-negative u-full-width" on:click={leave} onclick="this.blur();">leave</button>
            </div>
        </div>
    </div>
</div>
<div class="underlay"></div>
<svelte:window on:click={close}/>