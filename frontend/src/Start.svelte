<script>
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    const setLobby = (e) => {
        dispatch("changepage", 3);
    }
</script>


<div class="row" style="margin-top: 15%;">
    <form on:submit={setLobby} autocomplete="off">
        <div class="nine columns">
            <input class="u-full-width" type="text" placeholder="Username" name="username" id="usernameInput" minlength="3" maxlength="20" required>
            <label for="usernameInput">Please enter your username.</label>
            <input type="hidden" name="room" id="roomIDInput" value="">
        </div>
        <div class="three columns">
            <button class="button-primary button-submit u-full-width" type="submit">submit</button>
        </div>
    </form>
</div>