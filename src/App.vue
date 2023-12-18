<script setup>
import { useConnectionStore } from './stores/useConnectionStore';
import { useBackgroundStore } from './stores/useBackgroundStore';
import { onMounted, watch, ref } from 'vue';
import Navbar from './components/Navbar.vue';
import Popup from './components/widgets/Popup.vue';
import Modal from './components/widgets/Modal.vue';

const connectionStore = useConnectionStore();
const backgroundStore = useBackgroundStore();

// Modal
const showModal = ref(false);
const modalType = ref('');
const message = ref('');
const isLoading = ref(false);
const showButton = ref(true);

function Signin() {
    isLoading.value = true;
    connectionStore.setAuthToken()
        .then(response => {
            modalType.value = 'success';
            message.value = 'You are now signed in!';
            isLoading.value = false;
            showButton.value = false;
        })
        .catch(error => {
            modalType.value = 'danger';
            message.value = 'Something went wrong, please try again.';
            isLoading.value = false;
            showButton.value = false;
        });
}

watch(() => connectionStore.isConnected, (isConnected) => {
    if (isConnected && connectionStore.authToken == null) {
        message.value = 'If you want to access your account and use all of the functionalities like comments and participating tasks, you need to sign a message with your wallet. If you do not want to sign anything, you can ignore this message. If you want to sign in later, you can do it in the profile menu by clicking on the avatar on the top right corner.';
        showModal.value = true;
    }
});

onMounted(() => {
      connectionStore.initConnectionWatcher();
      connectionStore.checkConnection();
});

</script>

<template>
  <div id="app" class="z-10" :class="backgroundStore.backgroundClass">
    <Navbar />
    <Popup />

    <Modal @close-modal="showModal = false" :showModal="showModal" :modalType="modalType">
      <template v-slot:title>Sign in your account</template>
      <template v-slot:content>
        <div class="flex flex-col">
          <span>{{ message }}</span>
          <div class="flex gap-4">
            <button v-if="showButton" @click="createTask" class="btn mt-2 w-40 bg-orange-400 text-white">
              <span v-if="!isLoading" @click="Signin">Sign message</span>
              <span v-else class="flex items-center gap-3">Signing...<span class="loading loading-ring loading-md -translate-x-1"></span> </span>
            </button>
            <button v-if="showButton" @click="showModal = false" class="btn mt-2 w-40 bg-orange-400 text-white">Ignore</button>  
          </div>

        </div>

      </template>
    </Modal>

    <router-view></router-view>
  </div>
</template>


<style scoped>

</style>
