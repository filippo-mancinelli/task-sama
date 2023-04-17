<script setup>
</script>

<template>
    <div class="form-control py-2">
        <label class="label">
            <span class="label-text text-lg "><slot name="text-input">Default title</slot></span>
        </label>

        <input type="text" placeholder="Type here" class="input input-bordered w-full border-orange-400 outline-orange-400" />
    </div>
</template>

<style>

</style>
