<script setup>
    import { useConnectionStore } from '../stores/useConnectionStore'
    import { computed } from '@vue/reactivity';
    import { ref, onMounted, onUnmounted, watch, getCurrentInstance } from 'vue';

    const { ctx } = getCurrentInstance();
    const connectionStore = useConnectionStore();
    const isConnected = computed(() => { return connectionStore.isConnected});
    const avatarImgHtml1 = ref('');
    const avatarImgHtml2 = ref('');
    const showDropdown = ref(false);

    function toggleDropdown() {
      if (showDropdown.value) {
        //we need to close the dropdown with blur() because of DaisyUI CSS behaviour with :focus status
        showDropdown.value = false;
        document.activeElement.blur();
      } else {
        // Open the dropdown 
        showDropdown.value = true;
      }
    }

      function handleDropdownOutsideClick(event) {
        const dropdownElement = document.querySelector('.dropdown');
        const targetElement = event.target;

        if (!dropdownElement.contains(targetElement)) {
          showDropdown.value = false;
        } else {
          document.activeElement.focus();
        }
      }

    onMounted(() => {
      watch(() => connectionStore.isAllSetUp, (newValue, oldValue) => {
        if(newValue == true) {
          const seed = Math.round(Math.random() * 10000000);
          avatarImgHtml1.value = connectionStore.getAvatarImg(60, seed); 
          avatarImgHtml2.value = connectionStore.getAvatarImg(20, seed);
        }
      });

      //needed to check if user closed the dropdown by clicking outside the dropdown
      document.addEventListener('click', handleDropdownOutsideClick);
    });

    onUnmounted(() => {
      document.removeEventListener('click', handleDropdownOutsideClick);
    });

</script>

<template>
    <div v-if="isConnected" class="dropdown ">
      <label tabindex="0" @click="toggleDropdown" ref="dropdown" class="m-1 avatar drop-shadow-xl hover:cursor-pointer">
        <!--AVATAR-->
        <div class="rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
          <div v-html="avatarImgHtml1" class=""></div>
        </div>
      </label>

      <!--DROPDOWN CONTENT-->
      <div tabindex="0" class="dropdown-content z-[1] top-15 card card-compact p-2 shadow drop-shadow-xl bg-orange-500 text-primary-content" style="right: -9rem;">
        <div class="card-body p-2 ">

          <div class="flex flex-col gap-1">
            <div class="flex items-start gap-1">
              <div v-html="avatarImgHtml2" class=""></div>
              <h5 class="card-title text-sm mb-0">{{ connectionStore.walletAddress }}</h5>
            </div>
            <p>Tasks listed:</p>
            <p>Tasks participated:</p>
            <p>Tasks won:</p>
            <button @click="connectionStore.disconnect" class="btn btn-warning mt-1 text-white">Disconnect</button>
          </div>

        </div>
      </div>
    </div>
</template>

<style scoped>
</style>