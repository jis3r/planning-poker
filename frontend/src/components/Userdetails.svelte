<script>
    export let name;
    export let id;
    export let estimation;
    export let isReady = false;
    export let socketid;

</script>

<tr>
    {#if id === socketid}
        <td id="{id}" style="color: #33C3F0">{name}</td>
    {:else}
        <td id="{id}">{name}</td>
    {/if}
    {#if estimation !== 'spectator'}
        {#if isReady && estimation !== ''}
            <td class="estimation">
                <img src="/img/check.svg" alt="ready" style="vertical-align: middle;">
            </td>
        {:else}
            <td class="estimation">{estimation}</td>
        {/if}
    {/if}
</tr>