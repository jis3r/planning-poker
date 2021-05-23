<script>
    import { onMount } from "svelte";
    import { fly } from "svelte/transition";
    import { replace } from 'svelte-spa-router';


    let darktheme = true;

    const setLanding = (e) => {
        e.preventDefault();
        replace('/');
    }

    function toggleTheme() {
        darktheme = !darktheme;
        changeThemeStyle( darktheme );
        //localStorage.removeItem('username');
    }

    onMount(() => {
        if(localStorage.getItem('theme') === 'css/light.css') {
            darktheme = false;
            changeThemeStyle( darktheme );
        }
	});

    function changeThemeStyle(darktheme) {
        let themeStyle = document.getElementById('themeStyle');
        if( localStorage.getItem('theme') === undefined ) {
            localStorage.setItem('theme', 'css/dark.css');
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

<div class="content">
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
                        <img id="themeIcon" src="img/sun.svg" alt="sun" in:fly="{{ y: 50, duration: 500 }}">
                        {:else}
                        <img id="themeIcon" src="img/moon.svg" alt="moon" in:fly="{{ y: 50, duration: 500 }}">
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>