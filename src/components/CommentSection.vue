<script setup>
import {  ref, computed } from 'vue';
import { useConnectionStore } from '../stores/useConnectionStore';
import { useCommentsStore } from '../stores/useCommentsStore';
import { Comment } from 'vue';


const props = defineProps([
  'tokenId',
  'commentsArray'
]);
console.log(props.commentsArray);
const commentText = ref('');

const checkUpDown = computed(() => (commentId) => {
    var check = false;
    for(var i = 0; i < props.commentsArray.length; i++){
        if(props.commentsArray[i].commentId == commentId){
            if(props.commentsArray[i].upsAddresses.includes(useConnectionStore().walletAddress)){
                check = true;
            }
        }
    }

    return check;
});

function postComment() {
    if(commentText.value.length > 0 && commentText.value.length < 1000){
        useCommentsStore().postComment(props.tokenId, commentText.value).then(response => {
            console.log(response);
            commentText.value = '';
        });
    }
}

</script>

<template>
<!-- COMMENT LIST -->
<div class="card bg-white shadow-lg">
    <div v-for="comment in commentsArray" class="flex flex-col gap-2 border-2 shadow-sm">
        <span class="text-sm"> 
             <Comment 
                :commentId="comment.commentId"
                :tokenId="comment.tokenId"
                :posterAddress="comment.posterAddress"
                :commentBody="comment.commentBody"
                :ups="comment.ups"
                :downs="comment.downs"
                :postDate="comment.postDate"
                :isUp="checkUpDown(comment.commentId)"
                :isDown="checkUpDown(comment.commentId)"
             />
        </span>
    </div>
</div>

<!-- POST COMMENT SECTION-->
<div class="flex items-center gap-1 bg-orange-50 shadow-sm border-r-2 rounded ">
    <textarea v-model="commentText" class="textarea textarea-warning leading-tight placeholder:text-base  w-full focus:ring-orange-400 focus:border-orange-400 border border-orange-400" placeholder="Write your comment here"></textarea>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#e07f00" class="w-8 h-8 mx-1 cursor-pointer" @click="postComment"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
</div>

</template>

<style scoped>

</style>