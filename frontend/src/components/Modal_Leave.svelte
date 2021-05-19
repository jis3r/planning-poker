<script>
    import { createEventDispatcher } from "svelte";
    import { fade } from "svelte/transition";

    const dispatch = createEventDispatcher();

    const stay = () => {
        dispatch("leave", false)
    }

    const leave = () => {
        dispatch("leave", true);
    }
</script>
<div class="modal" id="modal" transition:fade>
    <div class="container">
        <div class="row">
            <div class="twelve columns" style="margin-bottom: 15%; margin-top: 10%; text-align: center">Do you really want to leave this lobby?</div>
        </div>
        <div class="row" style="margin-bottom: 10%;">
            <div class="six columns">
                <button class="button-primary-join u-full-width" on:click={stay}>stay</button>
            </div>
            <div class="six columns">
                <button class="button-primary-negative u-full-width" on:click={leave}>leave</button>
            </div>
        </div>
    </div>
</div>