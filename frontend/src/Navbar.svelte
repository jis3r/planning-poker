<script>
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();
    let darktheme = true;

    const setLanding = (e) => {
        e.preventDefault();
        dispatch("changepage", 0);
    }

    function toggleTheme() {
        darktheme = !darktheme;
        changeThemeStyle();
    }

    function changeThemeStyle() {
        let themeStyle = document.getElementById('themeStyle');
        if( localStorage.getItem('theme') === undefined ) {
            localStorage.setItem('theme', 'css/light.css');
        }
        if( darktheme ) {
            themeStyle.setAttribute('href', 'css/dark.css');
            localStorage.setItem('theme', 'css/dark.css');
        } else {
            themeStyle.setAttribute('href', 'css/light.css')
            localStorage.setItem('theme', 'css/light.css');
        }
    }
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