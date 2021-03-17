<script>
    import { createEventDispatcher, beforeUpdate } from "svelte";
    import { changeThemeStyle } from "./main.js";

    
    export const onload = null;

    const dispatch = createEventDispatcher();
    
    const setStart = (e) => {
        dispatch("changepage", 1);
    }    
    const setJoin = (e) => {
        dispatch("changepage", 2);
    }

    beforeUpdate(() => {
        changeThemeStyle();
    });


</script>


<div class="row" style="margin-top: 15%; margin-bottom: 5%;">
    <div class="nine columns" style="margin-bottom: 10%;">
        This is a simple, online planning poker tool.<br>
        Just host a new sessions and invite your teammates to start estimating your user stories<br>
        or join an existing session.
    </div>
    <div class="three columns indexbuttons" style="margin-bottom: 10%;">
        <button class="button-primary-start u-full-width" on:click={setStart}>Start new session</button>
        <button class="button-primary-join u-full-width" on:click={setJoin}>Join a session</button>
    </div>
</div>