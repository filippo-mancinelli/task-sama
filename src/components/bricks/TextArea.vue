<script setup>
</script>

<template>
    <div class="form-control w-full max-w-xs py-2">
        <label class="label">
            <span class="label-text text-lg"><slot name="input-title">Default title</slot></span>
        </label>

        <input type="text" placeholder="Type here" class="input input-bordered w-full max-w-xs border-orange-400" />
    </div>
</template>

<style>
.input:focus {
    outline: 2px solid hsla(var(--bc) / 0.2);
    outline-offset: 2px;
    outline-color: orange;
}
</style>
