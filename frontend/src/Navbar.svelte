<script>
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    const setLanding = (e) => {
        dispatch("changepage", 0);
    }
</script>


<div id="header" class="header">
    <div class="container">
        <div class="row">
            <div class="three columns"><h6></h6></div>
            <div class="six columns">
                <div on:click={setLanding}>
                    <h2 class="header-title">Planning Poker</h2>
                </div>
            </div>
            <div class="two columns">
                <h6></h6>
            </div>
            <div class="one column" style="height: 100%; margin-bottom: 0%;">
                <div id="darkmodetrigger" class="darkmodetrigger u-pull-right">
                    <img id="themeIcon" src="img/moon.svg" alt="moon" onclick="toggleTheme('dark')" class="svgmoon">
                </div>
            </div>
        </div>
    </div>
</div>