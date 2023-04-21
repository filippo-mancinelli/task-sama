<script setup>
import NumberInput from './NumberInput.vue';

</script>

<template>
<!--stuff TODO-->
<NumberInput> <template v-slot:title><slot name="title">Default tokenAmount title</slot></template> </NumberInput>
</template>