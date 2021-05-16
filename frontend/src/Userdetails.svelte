<script>
    export let name;
    export let id;
    export let estimation;
    export let isReady;

</script>

<tr>
    <td>{name}</td>
    {#if isReady}
        <td class="estimation">
            <img src="/img/check.svg" alt="ready" style="vertical-align: middle;">
        </td>
    {:else}
        <td class="estimation" id="{id}">{estimation}</td>
    {/if}
</tr>