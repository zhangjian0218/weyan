import { defineStore } from "pinia";

export const STORAGE_KEY = "weyan_posts";
export const MAX_LEN = 280;
export const DEFAULT_USER = "小言";

export const FILTERS = ["all", "liked", "favorited"];

function createId() {
  return Date.now() + Math.random().toString(16).slice(2, 8);
}

/** 对单条内容回填点赞/收藏默认值（兼容旧数据） */
function withDefaults(post) {
  return {
    liked: false,
    favorited: false,
    ...post,
  };
}

export const usePostsStore = defineStore("posts", {
  state: () => ({
    posts: [],
    filter: "all",
  }),

  getters: {
    count: (state) => state.posts.length,
    likedPosts: (state) => state.posts.filter((p) => p.liked),
    favoritedPosts: (state) => state.posts.filter((p) => p.favorited),
    likedCount() {
      return this.likedPosts.length;
    },
    favoritedCount() {
      return this.favoritedPosts.length;
    },
    filteredPosts(state) {
      if (state.filter === "liked") return this.likedPosts;
      if (state.filter === "favorited") return this.favoritedPosts;
      return state.posts;
    },
  },

  actions: {
    /** 从 localStorage 恢复数据（容错 + 旧数据字段回填） */
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const data = raw ? JSON.parse(raw) : [];
        this.posts = Array.isArray(data) ? data.map(withDefaults) : [];
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
        liked: false,
        favorited: false,
      });
      this.persist();
    },

    /** 按 id 删除并持久化 */
    remove(id) {
      this.posts = this.posts.filter((p) => p.id !== id);
      this.persist();
    },

    /** 切换点赞并持久化 */
    toggleLike(id) {
      const post = this.posts.find((p) => p.id === id);
      if (!post) return;
      post.liked = !post.liked;
      this.persist();
    },

    /** 切换收藏并持久化 */
    toggleFavorite(id) {
      const post = this.posts.find((p) => p.id === id);
      if (!post) return;
      post.favorited = !post.favorited;
      this.persist();
    },

    /** 设置筛选；非法值回退 all */
    setFilter(filter) {
      this.filter = FILTERS.includes(filter) ? filter : "all";
    },

    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.posts));
    },
  },
});
