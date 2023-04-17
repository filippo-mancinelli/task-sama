<script setup>
</script>

<template>
    <div class="alert alert-error shadow-lg form-control w-60 py-1 " style="font-size: 0.8rem;">
        <div>
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span><slot name="error">Error! something went wrong.</slot></span>
        </div>
    </div>
</template>