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
        @click="onLike"
      >
        {{ post.liked ? "♥ 已点赞" : "♡ 点赞" }}
      </button>
      <button
        class="btn-favorite"
        :class="{ favorited: post.favorited }"
        @click="onFavorite"
      >
        {{ post.favorited ? "★ 已收藏" : "☆ 收藏" }}
      </button>
      <button class="btn-delete" @click="onRemove">删除</button>
    </div>
  </li>
</template>

<script setup>
import { usePostsStore } from "../stores/posts";
import { formatTime } from "../utils/time";

const props = defineProps({
  post: { type: Object, required: true },
});
const store = usePostsStore();

function onLike() {
  store.toggleLike(props.post.id).catch(() => {});
}
function onFavorite() {
  store.toggleFavorite(props.post.id).catch(() => {});
}
function onRemove() {
  store.remove(props.post.id).catch(() => {});
}
</script>
