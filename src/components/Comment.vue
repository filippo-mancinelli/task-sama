<script setup>
import { onMounted, ref, watch, defineProps } from 'vue';
import { ChevronDoubleUpIcon, ChevronDoubleDownIcon } from "@vue-hero-icons/outline"
import { useCommentsStore } from '../stores/useCommentsStore';


const props = defineProps([
  'commentId',
  'tokenId',
  'posterAddress',
  'commentBody',
  'ups',
  'downs',
  'postDate',
  'isUp',
  'isDown'
]);


const avatarImgHtml1 = ref('');
avatarImgHtml1.value = connectionStore.getAvatarImg(60, seed); 

function up() {
    useCommentsStore().upComment(commentId).then(response => {
        console.log(response);
    });
}

function down(){
    useCommentsStore().downComment(commentId).then(response => {
        console.log(response);
    });
}
</script>

<template>
    <div class="flex flex-col bg-orange-100 rounded-sm border-2 shadow-sm">
        <!-- COMMENT HEADER -->
        <div class="flex justify-between">
            <div>
                <div class="rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    <div v-html="avatarImgHtml1" class=""></div>
                </div>
                <span class="text-md">{{ posterAddress }}</span>
            </div>

            <span class="italic text-sm">{{ postDate }}</span>
        </div>

        <!-- COMMENT BODY -->
        <div>
            {{ commentBody }}
        </div>

        <!-- COMMENT FOOTER-->
        <div class="flex gap-4">
            <ChevronDoubleUpIcon class="h-4 w-4 text-white" :class="{ 'text-orange-500': isUp }" @click="up" />
            <ChevronDoubleDownIcon class="h-4 w-4" :class="{ 'text-orange-500': isDown }" @click="down" />
        </div>
    </div>
</template>

<style scoped>
</style>
```