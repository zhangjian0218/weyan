<template>
  <section class="feed">
    <div class="feed-header">
      <h2 class="feed-title">时间线</h2>
      <div class="filter-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="filter-tab"
          :class="{ active: store.filter === tab.value }"
          @click="store.setFilter(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>
    <ul class="feed-list">
      <PostItem v-for="post in store.filteredPosts" :key="post.id" :post="post" />
    </ul>
    <p v-if="store.filteredPosts.length === 0" class="empty-tip">
      {{ store.filter === "all" ? "还没有内容，发一条试试吧～" : "这里还没有内容～" }}
    </p>
  </section>
</template>

<script setup>
import { usePostsStore } from "../stores/posts";
import PostItem from "./PostItem.vue";

const store = usePostsStore();
const tabs = [
  { label: "全部", value: "all" },
  { label: "已点赞", value: "liked" },
  { label: "已收藏", value: "favorited" },
];
</script>
