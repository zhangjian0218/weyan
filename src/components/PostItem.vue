<template>
  <li class="post">
    <div class="post-header">
      <span class="post-user">
        <span class="avatar">{{ post.user[0] }}</span>{{ post.user }}
      </span>
      <span class="post-time">{{ formatTime(post.time) }}</span>
    </div>
    <div class="post-content">{{ post.content }}</div>
    <div class="post-actions">
      <button class="btn-delete" @click="store.remove(post.id)">删除</button>
    </div>
  </li>
</template>

<script setup>
import { usePostsStore } from "../stores/posts";
import { formatTime } from "../utils/time";

defineProps({
  post: { type: Object, required: true },
});
const store = usePostsStore();
</script>
