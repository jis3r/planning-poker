<script>
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    const setLobby = (e) => {
        dispatch("changepage", 3);
    }
</script>

<div class="row" style="margin-top: 15%;">
    <form id="form" on:submit={setLobby} onsubmit="return checkRooms(document.getElementById('roomIDInput').value);" autocomplete="off">
        <div class="five columns">
            <input class="u-full-width" type="text" placeholder="Username" name="username" id="usernameInput" minlength="3" maxlength="20" required>
            <label for="usernameInput">Please enter your username.</label>
        </div>
        <div class="four columns">
            <input class="u-full-width" type="text" placeholder="12345" name="room" id="roomIDInput" minlength="5" maxlength="5" required>
            <label for="roomIdInput">Please enter the room-id.</label>
        </div>
        <div class="three columns">
            <button class="button-primary button-submit u-full-width" type="submit">submit input</button>
        </div>
    </form>
</div>