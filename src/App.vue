<template>
  <main class="container">
    <header class="header">
      <h1>微言</h1>
      <p class="slogan">分享你的此刻</p>
    </header>
    <Composer />
    <PostList />
  </main>
</template>

<script setup>
import { onMounted } from "vue";
import Composer from "./components/Composer.vue";
import PostList from "./components/PostList.vue";
import { usePostsStore } from "./stores/posts";

const store = usePostsStore();
onMounted(() => {
  store.load().catch(() => {
    // 后端不可用时保持空列表，避免未处理的 Promise rejection
  });
});
</script>
