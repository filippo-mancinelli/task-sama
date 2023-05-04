<template>
    <div>
      <h1>{{ title }}</h1>
      <div v-html="html"></div>
      <img :src="cover" />
      <img :src="icon" />
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const html = ref('')
  const cover = ref('')
  const icon = ref('')
  const title = ref('')
  
  fetch('http://localhost:3000/getPage', { credentials: 'include' })
    .then(response => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json();
    })
    .then(({ html, cover, icon, title }) => {
      htmlRef.value = html;
      coverRef.value = cover;
      iconRef.value = icon;
      titleRef.value = title;
    })
    .catch(error => {
      console.error(error);
    });
  </script>


