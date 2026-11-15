import { defineStore } from "pinia";

export const MAX_LEN = 280;
export const DEFAULT_USER = "小言";

export const FILTERS = ["all", "liked", "favorited"];

/** 进行中的 toggle 请求 id 集合（模块级，非响应式） */
const pendingToggles = new Set();

async function request(url, options = {}) {
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let message = `请求失败（${res.status}）`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* 204 等无 body 响应 */
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export const usePostsStore = defineStore("posts", {
  state: () => ({
    posts: [],
    filter: "all",
  }),

  getters: {
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
    /** 从后端拉取列表（时间倒序） */
    async load() {
      const data = await request("/api/posts");
      this.posts = Array.isArray(data?.posts) ? data.posts : [];
    },

    /** 发布内容：服务端校验并创建，成功后插入本地列表最前 */
    async publish(content) {
      const data = await request("/api/posts", {
        method: "POST",
        body: JSON.stringify({ content: (content ?? "").trim() }),
      });
      this.posts.unshift(data.post);
    },

    /** 删除内容（不存在的 id 静默容错） */
    async remove(id) {
      try {
        await request(`/api/posts/${id}`, { method: "DELETE" });
      } catch (e) {
        if (e.status !== 404) throw e;
        return;
      }
      this.posts = this.posts.filter((p) => p.id !== id);
    },

    /** 切换点赞（in-flight 守卫防止双击竞态） */
    async toggleLike(id) {
      const post = this.posts.find((p) => p.id === id);
      if (!post || pendingToggles.has(id)) return;
      pendingToggles.add(id);
      try {
        const data = await request(`/api/posts/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ liked: !post.liked }),
        });
        Object.assign(post, data.post);
      } finally {
        pendingToggles.delete(id);
      }
    },

    /** 切换收藏（in-flight 守卫防止双击竞态） */
    async toggleFavorite(id) {
      const post = this.posts.find((p) => p.id === id);
      if (!post || pendingToggles.has(id)) return;
      pendingToggles.add(id);
      try {
        const data = await request(`/api/posts/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ favorited: !post.favorited }),
        });
        Object.assign(post, data.post);
      } finally {
        pendingToggles.delete(id);
      }
    },

    /** 设置筛选；非法值回退 all */
    setFilter(filter) {
      this.filter = FILTERS.includes(filter) ? filter : "all";
    },
  },
});
