<script setup>
import { watch, ref, defineProps, defineEmits } from 'vue';
import { ChevronDoubleUpIcon, ChevronDoubleDownIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { useCommentsStore } from '../stores/useCommentsStore';
import { useConnectionStore } from '../stores/useConnectionStore';
import { useUsersStore } from '../stores/useUsersStore';
import { usePopupStore } from '../stores/usePopupStore';

const props = defineProps([
  'commentId',
  'tokenId',
  'posterAddress',
  'posterUsername',
  'posterSeed',
  'commentBody',
  'ups',
  'downs',
  'postDate',
  'upsAddresses',
  'downsAddresses'
]);
const emit = defineEmits(['refreshComments']);

const isUpRef = ref(false);
const isDownRef = ref(false);
const upsRef = ref(props.ups);
const downsRef = ref(props.downs);
const avatarImgHtml1 = useConnectionStore().getAvatarImg(25, props.posterSeed); 


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
    }).catch(error => {
        if(error.response.status == 401){
            usePopupStore().setPopup(true, 'danger', 'You need to sign in with your wallet first', 'noModal')
        } else {
            usePopupStore().setPopup(true, 'danger', error.response.data, 'noModal')
        }
    });;
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
    }).catch(error => {
        if(error.response.status == 401){
            usePopupStore().setPopup(true, 'danger', 'You need to sign in with your wallet first', 'noModal')
        } else {
            usePopupStore().setPopup(true, 'danger', error.response.data, 'noModal')
        }
    });;
}

function deleteComment() {
    useCommentsStore().deleteComment(props.commentId).then(response => {
        emit('refreshComments');
    }).catch(error => {
        if(error.response.status == 401){
            usePopupStore().setPopup(true, 'danger', 'You need to sign in with your wallet first', 'noModal')
        } else {
            usePopupStore().setPopup(true, 'danger', error.response.data.message, 'noModal')
        }
    });
}

function setCommentUpDownStatus() {
    props.upsAddresses.includes(useConnectionStore().walletAddress) ? isUpRef.value = true : isUpRef.value = false;
    props.downsAddresses.includes(useConnectionStore().walletAddress) ? isDownRef.value = true : isDownRef.value = false;
}

// Set the isUp and isDown variables at component mount, and then everytime wallet address changes or metamask disconnects
setCommentUpDownStatus();
watch([() => useConnectionStore().isAllSetUp, () => useConnectionStore().triggerEvent], ([isAllSetup, triggerEvent], [prevIsAllSetuo, prevTriggerEvent]) => {
    setCommentUpDownStatus();
});

</script>

<template>
    <div class="flex flex-col bg-orange-100 rounded-md border-2 shadow-sm">
        <!-- COMMENT HEADER -->
        <div class="flex justify-between">
            <div class="flex gap-2 p-2">
                <div v-html="avatarImgHtml1" class="rounded-full ring ring-primary avatar"></div>
                <div class="tooltip" :data-tip="posterAddress">
                    <div class="">
                        <span class="text-md">{{ posterUsername }}</span>
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
        <div class="flex justify-between">
            <!-- UPVOTE/DOWNVOTE -->
            <div class="flex gap-2 p-1 ">
                <div class="flex gap-1">
                    <ChevronDoubleUpIcon class="h-5 w-5 cursor-pointer border rounded-full" :class="{ 'text-orange-500 border-orange-500': isUpRef, 'text-gray-400 border-gray-400': !isUpRef }" @click="up" />
                    <span>{{ upsRef }}</span>
                </div>
                <div class="flex gap-1">
                    <ChevronDoubleDownIcon class="h-5 w-5 cursor-pointer border rounded-full" :class="{ 'text-orange-500 border-orange-500': isDownRef, 'text-gray-400 border-gray-400': !isDownRef }" @click="down" />
                    <span>{{ downsRef }}</span>
                </div>
            </div>

            <!-- DELETE COMMENT -->
            <div v-if="posterAddress == useConnectionStore().walletAddress" class="dropdown dropdown-end">
                <div tabindex="0" role="button">
                    <TrashIcon tabindex="0" class="h-6 w-6 cursor-pointer border rounded-full self-end text-gray-400 mb-2"   />
                </div>
                <div tabindex="0" class="card compact dropdown-content z-[1] shadow bg-base-100 rounded-box w-64">
                    <div tabindex="0" class="card-body">
                        <h5 class="card-title">Confirm Deletion</h5> 
                        <button class="btn btn-outline btn-warning" @click="deleteComment">Delete</button>
                    </div>
                </div>
            </div>
        </div>

    </div>

</template>

<style scoped>
</style>
```