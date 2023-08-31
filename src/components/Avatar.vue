<script setup>
    import { useConnectionStore } from '../stores/useConnectionStore'
    import { computed } from '@vue/reactivity';
    import { ref, onMounted, onUnmounted, watch, getCurrentInstance } from 'vue';
    import { UserIcon  } from '@heroicons/vue/24/solid';

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
          
          //needed to check if user closed the dropdown by clicking outside the dropdown
          document.addEventListener('click', handleDropdownOutsideClick);
        } else {
          showDropdown.value = false;
          document.removeEventListener('click', handleDropdownOutsideClick);
        }
      });

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
      <div tabindex="0" class="dropdown-content z-[1] top-15 card card-compact p-2 shadow drop-shadow-xl text-white bg-orange-500 -right-3" >
        <div class="card-body p-2 ">

          <div class="flex flex-col gap-1">
            <div class="flex items-start gap-1">
              <div v-html="avatarImgHtml2" class=""></div>
              <h5 class="card-title text-sm mb-0">{{ connectionStore.walletAddress }}</h5>
            </div>
            <p>Tasks listed:</p>
            <p>Tasks participated: </p>
            <p>Tasks won:</p>
            <div class="flex gap-2">
              <router-link to="/profile" @click="toggleDropdown" class="btn btn-warning flex-grow mt-1 text-white"> <UserIcon class="h-6 w-6" /> Profile</router-link>
              <button @click="connectionStore.disconnect" class="btn btn-warning flex-grow px-2 mt-1 text-white"> 
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" clip-rule="evenodd" /></svg>
                Disconnect
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
</template>

<style scoped>
</style>