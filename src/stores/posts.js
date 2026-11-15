import { defineStore } from "pinia";

export const STORAGE_KEY = "weyan_posts";
export const MAX_LEN = 280;
export const DEFAULT_USER = "小言";

function createId() {
  return Date.now() + Math.random().toString(16).slice(2, 8);
}

export const usePostsStore = defineStore("posts", {
  state: () => ({
    posts: [],
  }),

  getters: {
    count: (state) => state.posts.length,
  },

  actions: {
    /** 从 localStorage 恢复数据（容错） */
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const data = raw ? JSON.parse(raw) : [];
        this.posts = Array.isArray(data) ? data : [];
      } catch {
        this.posts = [];
      }
    },

    /** 发布内容：校验 → 插入最前 → 持久化 */
    publish(content) {
      const text = (content ?? "").trim();
      if (!text) {
        throw new Error("内容不能为空");
      }
      if (text.length > MAX_LEN) {
        throw new Error(`超出 ${MAX_LEN} 字上限`);
      }
      this.posts.unshift({
        id: createId(),
        user: DEFAULT_USER,
        content: text,
        time: Date.now(),
      });
      this.persist();
    },

    /** 按 id 删除并持久化 */
    remove(id) {
      this.posts = this.posts.filter((p) => p.id !== id);
      this.persist();
    },

    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.posts));
    },
  },
});
