<script>
    import { createEventDispatcher } from "svelte";

    export let id;

    const dispatch = createEventDispatcher();

    const copy = () => {
        dispatch("copy");
    }
</script>

<div>
    <h4 class="u-pull-left" style="vertical-align: middle;">
        room-id: 
        <span id="roomID" class="readycolor">{id}</span>                        
    </h4>
    <div class="u-pull-left icon-basic copyicon">
        <img src="/img/copy.svg" style="cursor: pointer; vertical-align: middle;" alt="share" on:click={copy}>
    </div>
</div>