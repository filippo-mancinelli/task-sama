<script setup>
    import { useConnectionStore } from '../stores/useConnectionStore'
    import { computed } from '@vue/reactivity';
    import { ref, onMounted, watch, getCurrentInstance } from 'vue';
    import { UserIcon  } from '@heroicons/vue/24/solid';
    import { useTaskStore } from '../stores/useTaskStore';
    import { useVideoStore } from '../stores/useVideoStore';
    import { useArgStore } from '../stores/useArgStore';

    const argStore = useArgStore();
    const videoStore = useVideoStore();
    const taskStore = useTaskStore();
    const connectionStore = useConnectionStore();
    const isConnected = computed(() => { return connectionStore.isConnected});
    const avatarImgHtml1 = ref('');
    const avatarImgHtml2 = ref('');

    const showDropdown = ref(false);
    const showModal = ref(false);
    const changeButtonState = ref(false);

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
          won.value = videoStore.videoMetadata.filter(metadata => metadata.winner == connectionStore.walletAddress).length;

          listed.value = taskStore.tasksMetadata.filter(metadata => metadata.owner == connectionStore.walletAddress).length;

          participated.value = taskStore.tasksMetadata.filter(metadata => {
              const isParticipant = metadata.participants.some(participant => participant === connectionStore.walletAddress);
              return isParticipant;
          }).length;

          // ### CONNECTED ACCOUNTS LIST ### //
          filteredAccounts.value = connectionStore.accounts.filter(account => {
              return account.toLowerCase() !== connectionStore.walletAddress.toLowerCase();
          });
        }
      })
    }

    /* //#### ACCOUNT CHANGES FUNCTIONALITY ON HOLD, NOT POSSIBLE NOW FOR METAMASK ACCOUNT DESIGN ####//

    function openModal() {
      showModal.value = true;
    }

    function setChangeButtonState() {
      changeButtonState.value = argStore.getArguments.selector == 'Choose one of your accounts' ? false : true;
    }

    function changeAccount() {
      if(changeButtonState.value) {
        connectionStore.changeAccount(argStore.getArguments.selector).then(()=>{
          refreshUserData();
        });  
        showModal.value = false;
      }
    }

    function connectMoreAccounts() {
      connectionStore.connect().then(() => {
        refreshUserData();
      });
    }
    
    */
    onMounted(() => {
      watch([() => videoStore.isDataReady, () => connectionStore.triggerEvent], ([isDataReady, triggerEvent], [prevIsDataReady, prevTriggerEvent]) => {
        if (isDataReady || triggerEvent !== prevTriggerEvent) {
          refreshUserData();
        }
      });

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
            <p>Tasks listed: {{ listed }}</p>
            <p>Tasks participated: {{ participated }}</p>
            <p>Tasks won: {{ won }}</p>


          <div class="flex flex-col">
              <!--
              <button @click="openModal" class="btn btn-warning flex-grow px-2 mt-1 text-white"> 
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
                  Change Account
              </button>
              -->
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
    </div>

    <!-- NOT POSSIBLE BECAUSE OF METAMASK ACCOUNTS DESIGN  -->

    <!-- MODAL - CHANGE ACCOUNT 
    <Modal @close-modal="showModal = false" :showModal="showModal" :modalType="''">
      <template v-slot:title>Change your account</template>

      <template v-slot:content>
        <div class="mb-2">
          <span class="text-lg italic">👤Current account: </span>
          <span class="text-sm italic"> {{ connectionStore.walletAddress }} </span> 
        </div>
        <div class="flex flex-col gap-1 mb-2">
          <span class="text-lg italic">🔂 Change to: </span>
          <Selector :optionsArray="filteredAccounts" :defaultText="'Choose one of your accounts'" @selection-changed="setChangeButtonState()" />
        </div>
        <div class="flex gap-4 items-end">
          <label @click="changeAccount" class="btn btn-primary pr-1 pl-4 w-25 text-white bg-orange-400 border-1 border-black hover:bg-orange-600 hover:border-black" :class="{'bg-orange-600 cursor-default': !changeButtonState}">
                Change
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
          </label>
          <label @click="connectMoreAccounts" class="btn btn-primary pr-1 pl-4 w-25 text-white bg-orange-400 border-1 border-black hover:bg-orange-600 hover:border-black">
                Connect more accounts
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
          </label>
        </div>
      </template>
    </Modal>
    -->
</template>

<style scoped>
</style>