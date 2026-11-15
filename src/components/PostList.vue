<template>
  <section class="feed">
    <h2 class="feed-title">时间线</h2>
    <ul class="feed-list">
      <PostItem v-for="post in store.posts" :key="post.id" :post="post" />
    </ul>
    <p v-if="store.posts.length === 0" class="empty-tip">
      还没有内容，发一条试试吧～
    </p>
  </section>
</template>

<script setup>
import { usePostsStore } from "../stores/posts";
import PostItem from "./PostItem.vue";

const store = usePostsStore();
</script>
