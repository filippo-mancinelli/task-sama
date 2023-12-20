<script setup>
import Modal from './widgets/Modal.vue';
import TextInput from './bricks/TextInput.vue';
import TextArea from './bricks/TextArea.vue';
import FileUpload from './bricks/FileUpload.vue';
import TokenAmount from './bricks/TokenAmount.vue';
import { ref, watchEffect, onMounted } from 'vue';
import { useConnectionStore } from '../stores/useConnectionStore';
import { usePopupStore } from '../stores/usePopupStore';
import { useArgStore } from '../stores/useArgStore';
import { useTaskStore } from '../stores/useTaskStore';

const connectionStore = useConnectionStore();
const argStore = useArgStore();
const taskStore = useTaskStore();

const maximumChars = 200;
const showModal = ref(false);
const showModalResult = ref(false);
const modalType = ref('');
const message = ref('');
const isLoading = ref(false);
const showAreaError = ref(false);
const showInputError = ref(false);
const showTokenError = ref(false);
const showSecondTyper = ref(false);
const availableChars = ref(maximumChars);

function openModal() {
  showModal.value = true;
}

function closeModalEvent() {
  showModal.value = false;
  showAreaError.value = false;
  showInputError.value = false;
  showTokenError.value = false;
  argStore.resetArgs();
}

function createTask() {
  if(argStore.getArguments.textArea == '' || argStore.getArguments.textInput == '' || argStore.getArguments.numberInput == '' || argStore.getArguments.error.value == true) {
    if(argStore.getArguments.textArea == '') 
      showAreaError.value = true;
    
    if(argStore.getArguments.textInput == '') 
      showInputError.value = true;
    
    if(argStore.getArguments.numberInput == '' || argStore.getArguments.numberInput < 10) 
      showTokenError.value = true;

  } else if(connectionStore.isConnected) {
     isLoading.value = true;
     const { numberInput: _reward, textInput: _title, textArea: _description } = argStore.getArguments;

     connectionStore.callContractFunction('Tasks', 'createTask', 'payable', [_title,  _description], _reward.toString())
      .then(response => {
        modalType.value = 'success';
        message.value = 'Task created successfully!';
        showModalResult.value = true;
        showModal.value = false;
        isLoading.value = false;
        connectionStore.triggerEvent = !connectionStore.triggerEvent;

        // After the task NFT is created and if the user uploaded an image, we upload it to our DB for moderation reasons
        if(argStore.getArguments.file != undefined) {
          if(argStore.getArguments.file.size > 0) {
            const taskId = parseInt(response.transactionReceipt.events[1].args.taskId);
            taskStore.uploadImageToDB(argStore.arguments.fileData.value, taskId);
          }
        }
      })
      .catch(error => {
        modalType.value = 'danger';
        message.value = 'Error creating task: ' + error.code;
        showModalResult.value = true;
        isLoading.value = false;
        console.log("errore Nella creazione del task: ", error.code)
      } );
  } else {
    usePopupStore().setPopup(true, 'alert', 'You need to connect your wallet before creating the task', 'noModal')
  }
}

watchEffect(() => {
  argStore.arguments.textArea != undefined ? availableChars.value = maximumChars - argStore.arguments.textArea.length : 'doNothing';
  argStore.arguments.textArea !== '' ? showAreaError.value = false : 'doNothing';
  argStore.arguments.textInput !== '' ? showInputError.value = false : 'doNothing';
  argStore.arguments.numberInput > 10 ? showTokenError.value = false : 'doNothing';
});

//Typing animation
onMounted(() => {
  const firstTyper = document.getElementById('first-typer');
  if (firstTyper !== null) {
    firstTyper.addEventListener('animationend', () => {
      showSecondTyper.value = true;
    });
  }
});


</script>

<template>
<Modal @close-modal="closeModalEvent" :showModal="showModal" :modalType="''">
  <template v-slot:title> Create a new Task </template>
  <template v-slot:content>
    <TextInput :showError="showInputError" :errorMessage="'Title cannot be empty.'" :maxLength=50><template v-slot:text-input>Task title:</template></TextInput>
    <TextArea :showError="showAreaError" :errorMessage="textAreaErrorMessage" :maxLength="maximumChars">
      <template v-slot:text-area>
        <div class="flex flex-col"> 
          <span>Task description:</span>
          <span class="text-sm">Characters available: {{ availableChars }}</span>
        </div>
      </template>
    </TextArea>
    <FileUpload :uploadType="'image'" />
    <div class="flex flex-nowrap just">
      <div class="w-1/3">
        <TokenAmount :showError="showTokenError" :errorMessage="'Minimum reward is 10 GLMR.'"><template v-slot:title>Reward amount:</template></TokenAmount> 
      </div>
    </div>

    <div class="flex justify-center">
      <button @click="createTask" class="btn mt-2 w-40 bg-orange-400 text-white">
        <span v-if="!isLoading">Create</span>
        <span v-else class="flex items-center gap-3">Create <span class="loading loading-ring loading-md -translate-x-1"></span> </span>
      </button>

    </div>
  </template>
</Modal>

<Modal @close-modal="showModalResult = false" :showModal="showModalResult" :modalType="modalType">
  <template v-slot:title></template>
  <template v-slot:content>{{ message }}</template>
</Modal>

<div id="home" class="hero mb-10 mt-4">
  <div class="hero-content text-center">
    <div class="max-w-md">
      <h1 class="text-5xl sm:text-7xl font-bold drop-shadow-lg">Welcome</h1>
      <div class="py-6 my-4">
        <p class="text-lg sm:text-xl typewriter" id="first-typer">Create your task and offer a reward for users</p>
        <p class="text-lg sm:text-xl typewriter inline-block second-typer" style="max-width: 23rem;" v-if="showSecondTyper"> to incentivize them solving your task.</p>
      </div>
      <label @click="openModal" class="btn btn-primary text-white bg-orange-400 border-orange-400 hover:bg-orange-600 hover:border-black">Create your task</label>
    </div>
  </div>
</div>

</template>

<style>
/* Set the value of the --border-right variable for each p element */
p:first-child {
  --border-right: 0px;
  --border-right-width: 0px;
}

p:last-child {
  --border-right: 2px;
  --border-right-width: 2px;
}

.typewriter {
    display: inline-block;
    white-space: nowrap;
  	overflow: hidden;
  	letter-spacing: 1px;
 	  animation: typing 3s steps(30, end) forwards, blink .75s step-end infinite;
    box-sizing: border-box;
}

@keyframes typing {
    from { 
        width: 0%;
        border-right-width: 2px;
        border-right: 2px solid;
    }
    to { 
        width: 100%;
        border-right-width: 2px;
        border-right: 600px solid;
    }
    99.9% {
        border-right-width: 0px;
        border-right: 2px solid;
    }
    100% {
        border-right-width: var(--border-right-width);
        border-right: var(--border-right) solid;
    }
}

@keyframes blink {
    from, to { 
        border-color: transparent 
    }
    50% { 
        border-color: black; 
    }
  }

/* this causes the smooth shifting when the second paragraph is rendered */
.second-typer {
  transition: opacity 0.3s ease-in-out;
}

  
</style>