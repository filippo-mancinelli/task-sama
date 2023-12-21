<script setup>
    import { useConnectionStore } from '../stores/useConnectionStore'
    import { useUsersStore } from '../stores/useUsersStore';
    import { computed } from '@vue/reactivity';
    import { ref, onMounted, watch, getCurrentInstance } from 'vue';
    import { UserIcon  } from '@heroicons/vue/24/solid';
    import { useTaskStore } from '../stores/useTaskStore';
    import { useVideoStore } from '../stores/useVideoStore';
    import { PencilIcon } from '@heroicons/vue/24/solid';

    const videoStore = useVideoStore();
    const taskStore = useTaskStore();
    const connectionStore = useConnectionStore();
    const usersStore = useUsersStore();
    const isConnected = computed(() => { return connectionStore.isConnected});
    const avatarImgHtml1 = ref('');
    const avatarImgHtml2 = ref('');

    const showDropdown = ref(false);

    const listed = ref('');
    const participated = ref('');
    const won = ref('');
    const filteredAccounts = ref([]);

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

    function refreshUserData() {
      taskStore.fetchTasksMetadata().then(() => {
        if(videoStore.videoMetadata != null && videoStore.videoMetadata != undefined && taskStore.tasksMetadata != null && taskStore.tasksMetadata != undefined && connectionStore.walletAddress) {
          // ### TASKS OVERVIEW ### //
          won.value = videoStore.videoMetadata.filter(metadata => metadata.winner.toLowerCase() == connectionStore.walletAddress).length;

          listed.value = taskStore.tasksMetadata.filter(metadata => metadata.owner.toLowerCase() == connectionStore.walletAddress).length;

          participated.value = taskStore.tasksMetadata.filter(metadata => {
              const isParticipant = metadata.participants.some(participant => participant.toLowerCase() === connectionStore.walletAddress);
              return isParticipant;
          }).length;

          // ### CONNECTED ACCOUNTS LIST ### //
          filteredAccounts.value = connectionStore.accounts.filter(account => {
              return account.toLowerCase() !== connectionStore.walletAddress.toLowerCase();
          });
        }
      })
    }
    
    onMounted(() => {
      watch([() => videoStore.isDataReady, () => connectionStore.isAllSetUp, () => connectionStore.triggerEvent], ([isDataReady, isAllSetUp, triggerEvent], [prevIsDataReady, prevIsAllSetUp, prevTriggerEvent]) => {
          refreshUserData();
      });

      watch([() => connectionStore.isAllSetUp, () => usersStore.seed], ([isAllSetUp, isAllSetUpOld], [seed, seedOld]) => {
        if(isAllSetUp == true || seed !== 0) {
          avatarImgHtml1.value = connectionStore.getAvatarImg(60, usersStore.seed); 
          avatarImgHtml2.value = connectionStore.getAvatarImg(25, usersStore.seed);
          
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
        <div class="card-body p-2">

          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <div class="rounded-full ring ring-primary ring-offset-base-100 avatar">
                <div v-html="avatarImgHtml2" class=""></div>
              </div>
              <div class="flex flex-col">
                <h5 class="card-title text-sm mb-0">{{ connectionStore.walletAddress }}</h5>
                <h5 class="card-title text-sm mb-0">{{ usersStore.username }}</h5>
              </div>
            </div>
            <p>Tasks listed: {{ listed }}</p>
            <p>Tasks participated: {{ participated }}</p>
            <p>Tasks won: {{ won }}</p>

            <!--PROFILE ACTIONS-->
            <div class="flex flex-col gap-2">
              <router-link to="/profile" @click="toggleDropdown" class="btn btn-warning text-white"> 
                <UserIcon class="h-5 w-5 mr-1" /> Profile
              </router-link>
              <button @click="connectionStore.setAuthToken" class="btn btn-warning text-white" :class="{'cursor-auto bg-orange-300': connectionStore.authToken !== 'null'}"> 
                <PencilIcon tabindex="0" class="h-5 w-5 mr-1 cursor-pointer text-white" />
                {{ connectionStore.authToken == 'null' ? 'Sign in' : 'Signed in'}}
              </button>
              <button @click="connectionStore.disconnect" class="btn btn-warning text-white"> 
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 mr-1"><path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" clip-rule="evenodd" /></svg>
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