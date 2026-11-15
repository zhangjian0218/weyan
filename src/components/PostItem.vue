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
      <button
        class="btn-like"
        :class="{ liked: post.liked }"
        @click="store.toggleLike(post.id)"
      >
        {{ post.liked ? "♥ 已点赞" : "♡ 点赞" }}
      </button>
      <button
        class="btn-favorite"
        :class="{ favorited: post.favorited }"
        @click="store.toggleFavorite(post.id)"
      >
        {{ post.favorited ? "★ 已收藏" : "☆ 收藏" }}
      </button>
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
