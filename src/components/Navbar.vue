<script>
export default {
  data() {
    return {
      isConnected: false,
    };
  },
  computed: {
    buttonText() {
      return this.isConnected? 'Connected' : 'Connect';
    }
  }
};
</script>

<template>
  <div class="navbar sticky bg-base-100">
  <div class="flex-1 border-solid border-2 border-black rounded-full bg-orange-100">
    <a class="btn btn-ghost normal-case text-2xl">Task Sama</a>
    <ul class="menu menu-horizontal px-1">
      <li><a class=" hover:bg-orange-300 text-xl">Home</a></li>
      <li><a class="hover:bg-orange-300 text-xl">Tasks</a></li>
    </ul>
  </div>
  <div class="flex-none">

    <li><button class="btn bg-orange-500" @click="connect">{{buttonText}}</button></li>

  </div>
</div>

</template>

<style scoped>

</style>
