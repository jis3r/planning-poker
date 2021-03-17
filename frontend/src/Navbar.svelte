<script>
    import { createEventDispatcher, onMount } from "svelte";
    import { changeThemeStyle } from "./main.js";


    const dispatch = createEventDispatcher();
    let darktheme = true;

    const setLanding = (e) => {
        e.preventDefault();
        dispatch("changepage", 0);
    }

    function toggleTheme() {
        darktheme = !darktheme;
        changeThemeStyle( datktheme );
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
            <div class="three columns"><h6> </h6></div>
            <div class="six columns">
                <div on:click={setLanding}>
                    <h2 class="header-title">Planning Poker</h2>
                </div>
            </div>
            <div class="two columns">
                <h6> </h6>
            </div>
            <div class="one column" style="height: 100%; margin-bottom: 0%;">
                <div id="darkmodetrigger" class="darkmodetrigger u-pull-right" on:click={toggleTheme}>
                    {#if darktheme}
                    <img id="themeIcon" src="img/sun.svg" alt="sun" class="svgsun">
                    {:else}
                    <img id="themeIcon" src="img/moon.svg" alt="moon" class="svgmoon">
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>