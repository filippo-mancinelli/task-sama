<script setup>
import Error from './Error.vue';
import { useArgStore } from '../../stores/useArgStore'
import { watchEffect, ref, defineProps } from 'vue';
import { TrashIcon } from "@heroicons/vue/24/solid"

const argStore = useArgStore();
const props = defineProps(['uploadType']);

const uploadedFile = ref({
  name: '',
  size: 0,
  file: null,
  date: new Date()
});

const showError = ref(false);
const errorMessage = ref('');

function onFileChange(event) {
  const file = event.target.files[0];

  if(props.uploadType == 'image') {
    if (file && (file.type == 'image/jpeg' || file.type == 'image/png')) {
      uploadedFile.value.name = file.name
      uploadedFile.value.size = file.size
      uploadedFile.value.file = file
      uploadedFile.value.date = new Date()
      showError.value = false;
    } else {
      if(file.type !== 'image/jpeg' && file.type !== 'image/png'){
        errorMessage.value = 'File format must be jpeg or png.';
      }
      if(file.size > 2000000) {
        errorMessage.value = 'File size must be under 2 MB.';
      }
      showError.value = true;
    }
  } else if(props.uploadType == 'video') {
    if (file && (file.type == 'video/mp4' || file.type == 'video/webm')) {
      uploadedFile.value.name = file.name
      uploadedFile.value.size = file.size
      uploadedFile.value.file = file
      uploadedFile.value.date = new Date()
      showError.value = false;
    } else {
      if(file.type !== 'video/mp4'){
        errorMessage.value = 'File format must be mp4 or mkv.';
      }
      if(file.size > 15000000) {
        errorMessage.value = 'File size must be under 10 MB.';
      }
      showError.value = true;
    }
  }

  }

function deleteFile() {
  uploadedFile.value = {
    name: '',
    size: 0,
    file: null,
    date: new Date()
  }
  document.getElementById("myForm").reset();
}

function formatDate() {

}

watchEffect(() => {
    argStore.pushArg({ 
      key: 'file', 
      value: {
        fileName: uploadedFile.value.name,
        size: uploadedFile.value.size,
        file: uploadedFile.value.file,
        date: uploadedFile.value.date
      }
    });
});

</script>

<template>
    <div class="py-2">
      <span class="label-text text-lg ">Upload {{ props.uploadType == 'image' ? 'an image:' : 'a video' }}  </span>
        <form id="myForm" class="flex">
          <input type="file" class="file-input file-input-bordered w-full mt-2" @change="onFileChange">
          <Transition name="trash">
            <TrashIcon v-if="uploadedFile.size > 0" @click="deleteFile" class="h-10 w-10 mt-3 ml-2 text-stone-600"/>
          </Transition>
        </form>
        <Error :showError="showError"> <template v-slot:error> {{ errorMessage }} </template> </Error>
    </div>
      
    <!--
    <div v-if="uploadedFile.file">
      <p>Selected file: {{ uploadedFile.name }}</p>
      <p>File size: {{ uploadedFile.size }} bytes</p>
      <p>File: {{ uploadedFile.file }}</p>
      <p>upload date: {{ uploadedFile.date }}</p>
    </div>
    -->
</template>

<style scoped>
.file-input::file-selector-button {
    background-color: rgb(251 146 60);
}

.trash-enter-active,
.trash-leave-active {
  transition: opacity 0.3s;
}

.trash-enter-from,
.trash-leave-to {
  opacity: 0;
}

</style>