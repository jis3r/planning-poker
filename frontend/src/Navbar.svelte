<script>
    import { createEventDispatcher, onMount } from "svelte";
    import { fade, fly } from "svelte/transition";
    import { changeThemeStyle, leaveRoom } from "./main.js";


    const dispatch = createEventDispatcher();
    let darktheme = true;

    const setLanding = (e) => {
        e.preventDefault();
        leaveRoom();
        dispatch("changepage", 0);
    }

    function toggleTheme() {
        darktheme = !darktheme;
        changeThemeStyle( darktheme );
    }

    onMount(() => {
        if(localStorage.getItem('theme') === 'css/light.css') {
            darktheme = false;
            changeThemeStyle( darktheme );
        }
	});
</script>


<div id="header" class="header">
    <div class="container">
        <div class="row">
            <div class="one column theme-column"><h6> </h6></div>
            <div class="ten columns title-column">
                <div on:click={setLanding}>
                    <h1 class="header-title">Planning Poker</h1>
                </div>
            </div>
            <div class="one column theme-column u-pull-right" style="height: 100%; margin-bottom: 0%;">
                <div id="darkmodetrigger" class="darkmodetrigger u-pull-right" on:click={toggleTheme}>
                    {#if darktheme}
                    <img id="themeIcon" src="img/sun.svg" alt="sun" class="svgsun" in:fly="{{ y: 50, duration: 2000 }}" out:fly="{{ y: -50, duration: 2000 }}">
                    {:else}
                    <img id="themeIcon" src="img/moon.svg" alt="moon" class="svgmoon" in:fly="{{ y: 50, duration: 2000 }}" out:fly="{{ y: -50, duration: 2000 }}">
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>