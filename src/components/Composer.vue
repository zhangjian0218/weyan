<template>
  <section class="composer">
    <textarea
      v-model="draft"
      maxlength="280"
      rows="3"
      placeholder="有什么新鲜事想告诉大家？"
      @keydown="onKeydown"
    ></textarea>
    <div class="composer-footer">
      <span class="char-count" :class="{ over: isOver }">{{ draft.length }} / 280</span>
      <button class="btn-publish" :disabled="!canPublish" @click="submit">发布</button>
    </div>
    <p v-if="toast" class="toast" :style="{ color: toastColor }">{{ toast }}</p>
  </section>
</template>

<script setup>
import { ref, computed } from "vue";
import { usePostsStore, MAX_LEN } from "../stores/posts";

const store = usePostsStore();
const draft = ref("");
const toast = ref("");
const toastColor = ref("#e0245e");
let toastTimer = null;

const isOver = computed(() => draft.value.length > MAX_LEN);
const canPublish = computed(() => draft.value.trim().length > 0 && !isOver.value);

function showToast(msg, isError = true) {
  toast.value = msg;
  toastColor.value = isError ? "#e0245e" : "#31a24c";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.value = ""), 2000);
}

function submit() {
  try {
    store.publish(draft.value);
    draft.value = "";
    showToast("发布成功", false);
  } catch (e) {
    showToast(e.message);
  }
}

function onKeydown(e) {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    submit();
  }
}
</script>
