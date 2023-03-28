<script setup>
</script>

<template>
    <div class="form-control w-full max-w-xs py-2">
        <label class="label">
            <span class="label-text"><slot name="input-title">Default title</slot></span>
        </label>

        <input type="text" placeholder="Type here" class="input input-bordered w-full max-w-xs" />
    </div>
</template>