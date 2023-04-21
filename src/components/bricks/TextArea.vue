<script setup>
</script>

<template>
    <div class="flex form-control py-2">
        <label class="label">
            <span class="label-text text-lg"><slot name="text-area">Default text-area</slot></span>
        </label>
        <textarea class="textarea textarea-warning border-orange-400 outline-orange-400 w-full" placeholder="Tell participants what to do..."> </textarea>
    </div>
</template>