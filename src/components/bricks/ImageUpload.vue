<script setup>
import { ref } from 'vue';
import Error from './Error.vue';

const uploadedFile = ref({
  name: '',
  size: 0,
  file: null,
  date: new Date()
});

const showError = ref(false);

function onFileChange(event) {
  const file = event.target.files[0];
  console.log("file",file.type == 'image/jpeg')

  if (file && file.type == 'image/jpeg') {
      uploadedFile.value.name = file.name
      uploadedFile.value.size = file.size
      uploadedFile.value.file = file
      uploadedFile.value.date = new Date()
      showError.value = false;
    } else {
      showError.value = true;
    }
  }

function formatDate(){

}

</script>

<template>
    <div class="py-2">
      <span class="label-text text-lg ">Upload an image: </span>
      <input type="file" class="file-input file-input-bordered w-full mt-2" @change="onFileChange" />
    </div>
      <Error v-if="showError"> <template v-slot:error> File format must be jpeg or png. </template> </Error>

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
</style>