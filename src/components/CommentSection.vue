<script setup>
import {  ref, defineEmits } from 'vue';
import { useCommentsStore } from '../stores/useCommentsStore';
import Comment from './Comment.vue';
import { usePopupStore } from '../stores/usePopupStore';

const props = defineProps([
  'tokenId',
  'commentsArray',
  'category'
]);
const emit = defineEmits(['refreshComments']);
const commentText = ref('');
const isLoading = ref(false);

function postComment() {
    isLoading.value = true;
    if(commentText.value.length > 0 && commentText.value.length < 1000) {
        useCommentsStore().postComment(props.tokenId, commentText.value, props.category).then(response => {
            commentText.value = '';
            emit('refreshComments');
            isLoading.value = false;
        }).catch(error => {
            console.log(error);
            if(error.response.status == 401){
                usePopupStore().setPopup(true, 'danger', 'You need to sign with your wallet to login first', 'noModal')
            } else {
                usePopupStore().setPopup(true, 'danger', error.response.data.message, 'noModal')
            }
            isLoading.value = false;
        });
    } else {
        usePopupStore().setPopup(true, 'danger', 'Comments maximum length is 1000 characters', 'noModal')
        isLoading.value = false;
    }
}

</script>

<template>
<!-- COMMENT LIST -->
<div class="card bg-white shadow-lg flex flex-col gap-2">
    <div v-for="comment in commentsArray" :key="comment._id">
        <span class="text-sm"> 
             <Comment 
                :commentId="comment._id"
                :tokenId="comment.tokenId"
                :posterAddress="comment.posterAddress"
                :posterUsername="comment.username"
                :posterSeed="comment.seed"
                :commentBody="comment.commentBody"
                :ups="comment.ups"
                :downs="comment.downs"
                :postDate="comment.postDate"
                :upsAddresses="comment.upsAddresses"
                :downsAddresses="comment.downsAddresses"
                @refreshComments="$emit('refreshComments')"
             />
        </span>
    </div>
</div>

<!-- POST COMMENT SECTION-->
<div class="flex items-center gap-1 bg-orange-50 shadow-sm border-r-2 rounded mt-2 mb-12 hover:bg-orange-100">
    <textarea v-model="commentText" class="textarea textarea-warning leading-tight placeholder:text-base  w-full focus:ring-orange-400 focus:border-orange-400 border border-orange-400" placeholder="Write your comment here"></textarea>
    <svg v-if="!isLoading" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#e07f00" class="w-8 h-8 mx-1 cursor-pointer" @click.once="postComment"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
    <span v-else class="loading loading-dots loading-sm text-warning mx-2.5"></span>
</div>

</template>

<style scoped>

</style>