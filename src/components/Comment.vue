<script setup>
import { onMounted, ref, defineProps } from 'vue';
import { ChevronDoubleUpIcon, ChevronDoubleDownIcon } from '@heroicons/vue/24/outline'
import { useCommentsStore } from '../stores/useCommentsStore';
import { useConnectionStore } from '../stores/useConnectionStore';


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
const isUpRef = ref(props.isUp);
const isDownRef = ref(props.isDown);
const upsRef = ref(props.ups);
const downsRef = ref(props.downs);

const seed = Math.round(Math.random() * 10000000);
avatarImgHtml1.value = useConnectionStore().getAvatarImg(25, seed); 

function up() {
    if (isDownRef.value) {
        // If the user has already downvoted, disable it
        useCommentsStore().downComment(props.commentId, false).then(response => {
            downsRef.value = response.data.downs;
            isDownRef.value = response.data.isDown;
        });
    }

    useCommentsStore().upComment(props.commentId, !isUpRef.value).then(response => {
        upsRef.value = response.data.ups;
        isUpRef.value = response.data.isUp;
    });
}

function down() {
    if (isUpRef.value) {
        // If the user has already upvoted, disable it
        useCommentsStore().upComment(props.commentId, false).then(response => {
            upsRef.value = response.data.ups;
            isUpRef.value = response.data.isUp;
        });
    }

    useCommentsStore().downComment(props.commentId, !isDownRef.value).then(response => {
        downsRef.value = response.data.downs;
        isDownRef.value = response.data.isDown;
    });
}

</script>

<template>
    <div class="flex flex-col bg-orange-100 rounded-md border-2 shadow-sm">
        <!-- COMMENT HEADER -->
        <div class="flex justify-between">
            <div class="flex gap-2 p-2">
                <div v-html="avatarImgHtml1" class="rounded-full ring ring-primary avatar"></div>
                <div class="tooltip" :data-tip="posterAddress">
                    <div class="max-sm:w-24 max-sm:text-ellipsis max-sm:overflow-hidden max-sm:whitespace-nowrap">
                        <span class="text-md">{{ posterAddress }}</span>
                    </div>
                </div>
            </div>


            <span class="italic text-xs mr-2">{{ postDate }}</span>
        </div>

        <!-- COMMENT BODY -->
        <div class="p-1 text-lg">
            {{ commentBody }}
        </div>

        <!-- COMMENT FOOTER-->
        <div class="flex gap-3 p-1">
            <div class="flex gap-1">
                <ChevronDoubleUpIcon class="h-5 w-5 cursor-pointer border rounded-full" :class="{ 'text-orange-500 border-orange-500': isUpRef, 'text-gray-400 border-gray-400': !isUpRef }" @click="up" />
                <span>{{ upsRef }}</span>
            </div>
            <div class="flex gap-1">
                <ChevronDoubleDownIcon class="h-5 w-5 cursor-pointer border rounded-full" :class="{ 'text-orange-500 border-orange-500': isDownRef, 'text-gray-400 border-gray-400': !isDownRef }" @click="down" />
                <span>{{ downsRef }}</span>
            </div>
        </div>

    </div>
</template>

<style scoped>
</style>
```