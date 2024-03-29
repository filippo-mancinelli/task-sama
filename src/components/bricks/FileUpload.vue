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

function pushArgument(key, value) {
  argStore.pushArg({
    key: key,
    value: {
      value
    }
  })
}

function onFileChange(event) {
  const file = event.target.files[0];
  pushArgument('fileData', file);
  
  if(props.uploadType == 'image') {
    if (file && (file.type == 'image/jpeg' || file.type == 'image/png')) {
      if(file.size > 2 * 1024 * 1024) {
        errorMessage.value = 'File size must be under 2 MB.';
        showError.value = true;
        pushArgument('error', true); // This is used to inform that external components that the user entered an invalid file and he cannot proceed
      } else {
        uploadedFile.value.name = file.name
        uploadedFile.value.size = file.size
        uploadedFile.value.date = new Date()
        showError.value = false;
        pushArgument('error', false); 
      }
    } else if(file.type !== 'image/jpeg' && file.type !== 'image/png') {
        errorMessage.value = 'File format must be jpeg or png.';
        showError.value = true; 
        pushArgument('error', true); 
    }
  } else if(props.uploadType == 'video') {
    if (file && (file.type == 'video/mp4' || file.type == 'video/webm')) {
      if(file.size > 15000000) {
        errorMessage.value = 'Video size must be under 15 MB.';
        showError.value = true;
        pushArgument('error', true); 
      } else {
        uploadedFile.value.name = file.name
        uploadedFile.value.size = file.size
        uploadedFile.value.date = new Date()
        showError.value = false;
        pushArgument('error', false); 
      }
    } else {
      errorMessage.value = 'Video format must be mp4 or webm.';
      showError.value = true;
      pushArgument('error', true); 
    }
  }

  }

function deleteFile() {
  uploadedFile.value = {
    name: '',
    size: 0,
    date: new Date()
  }
  document.getElementById("myForm").reset();
}

watchEffect(() => {
    argStore.pushArg({ 
      key: 'file', 
      value: {
        fileName: uploadedFile.value.name,
        size: uploadedFile.value.size,
        date: uploadedFile.value.date
      }
    });

});

</script>

<template> 
    <div class="py-2">
      <span class="label-text text-lg text-black">Upload {{ props.uploadType == 'image' ? 'an image:' : 'a video' }}  </span>
        <form id="myForm" class="flex ">
          <input type="file" class="file-input  border-orange-400 w-full mt-2 bg-white text-black" @change="onFileChange">
          <Transition name="trash">
            <TrashIcon v-if="uploadedFile.size > 0" @click="deleteFile" class="h-10 w-10 mt-3 ml-2 text-stone-600 hover:cursor-pointer"/>
          </Transition>
        </form>
        <Error :showError="showError" class="px-0"> <template v-slot:error> {{ errorMessage }} </template> </Error>
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