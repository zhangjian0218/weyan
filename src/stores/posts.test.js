import { describe, it, expect, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { usePostsStore, STORAGE_KEY, MAX_LEN } from "./posts";

describe("posts store", () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it("初始状态为空，且 load 后仍为空", () => {
    const store = usePostsStore();
    expect(store.posts).toHaveLength(0);
    store.load();
    expect(store.posts).toHaveLength(0);
  });

  it("publish 发布一条内容，排在最前面并写入 localStorage", () => {
    const store = usePostsStore();
    store.publish("第一条");
    store.publish("第二条");
    expect(store.posts).toHaveLength(2);
    expect(store.posts[0].content).toBe("第二条");
    expect(store.posts[0].user).toBe("小言");
    expect(store.posts[1].content).toBe("第一条");

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(saved).toHaveLength(2);
    expect(saved[0].content).toBe("第二条");
  });

  it("publish 去除首尾空白后存储", () => {
    const store = usePostsStore();
    store.publish("  你好  ");
    expect(store.posts[0].content).toBe("你好");
  });

  it("publish 空内容 / 纯空白内容抛出异常且不存储", () => {
    const store = usePostsStore();
    expect(() => store.publish("")).toThrow();
    expect(() => store.publish("   ")).toThrow();
    expect(store.posts).toHaveLength(0);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("publish 超过 280 字上限抛出异常且不存储", () => {
    const store = usePostsStore();
    expect(() => store.publish("啊".repeat(MAX_LEN + 1))).toThrow();
    expect(store.posts).toHaveLength(0);
    expect(() => store.publish("好".repeat(MAX_LEN))).not.toThrow();
    expect(store.posts).toHaveLength(1);
  });

  it("remove 按 id 删除并同步 localStorage", () => {
    const store = usePostsStore();
    store.publish("A");
    store.publish("B");
    const idOfB = store.posts[0].id;
    store.remove(idOfB);
    expect(store.posts).toHaveLength(1);
    expect(store.posts[0].content).toBe("A");
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(saved).toHaveLength(1);
    expect(saved[0].content).toBe("A");
  });

  it("remove 传入不存在的 id 时数据不变", () => {
    const store = usePostsStore();
    store.publish("A");
    store.remove("not-exist");
    expect(store.posts).toHaveLength(1);
  });

  it("load 从 localStorage 恢复数据", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: "x1", user: "小言", content: "历史内容", time: 1700000000000 }])
    );
    const store = usePostsStore();
    store.load();
    expect(store.posts).toHaveLength(1);
    expect(store.posts[0].content).toBe("历史内容");
  });

  it("load 对损坏的 localStorage 数据具有容错性", () => {
    localStorage.setItem(STORAGE_KEY, "{broken json");
    const store = usePostsStore();
    expect(() => store.load()).not.toThrow();
    expect(store.posts).toHaveLength(0);
  });

  /* ---------- 点赞 / 收藏 / 筛选 ---------- */

  it("publish 的新内容默认未点赞、未收藏", () => {
    const store = usePostsStore();
    store.publish("新内容");
    expect(store.posts[0].liked).toBe(false);
    expect(store.posts[0].favorited).toBe(false);
  });

  it("load 对旧数据回填 liked/favorited 为 false", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: "old1", user: "小言", content: "旧数据", time: 1700000000000 }])
    );
    const store = usePostsStore();
    store.load();
    expect(store.posts[0].liked).toBe(false);
    expect(store.posts[0].favorited).toBe(false);
  });

  it("toggleLike 切换点赞状态并持久化", () => {
    const store = usePostsStore();
    store.publish("点赞我");
    const id = store.posts[0].id;

    store.toggleLike(id);
    expect(store.posts[0].liked).toBe(true);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))[0].liked).toBe(true);

    store.toggleLike(id);
    expect(store.posts[0].liked).toBe(false);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))[0].liked).toBe(false);
  });

  it("toggleFavorite 切换收藏状态并持久化", () => {
    const store = usePostsStore();
    store.publish("收藏我");
    const id = store.posts[0].id;

    store.toggleFavorite(id);
    expect(store.posts[0].favorited).toBe(true);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))[0].favorited).toBe(true);

    store.toggleFavorite(id);
    expect(store.posts[0].favorited).toBe(false);
  });

  it("toggleLike/toggleFavorite 对不存在的 id 无操作", () => {
    const store = usePostsStore();
    store.publish("A");
    expect(() => store.toggleLike("no-id")).not.toThrow();
    expect(() => store.toggleFavorite("no-id")).not.toThrow();
    expect(store.posts).toHaveLength(1);
    expect(store.posts[0].liked).toBe(false);
  });

  it("likedCount / favoritedCount 统计正确", () => {
    const store = usePostsStore();
    store.publish("A");
    store.publish("B");
    store.publish("C");
    store.toggleLike(store.posts[0].id);
    store.toggleLike(store.posts[2].id);
    store.toggleFavorite(store.posts[1].id);
    expect(store.likedCount).toBe(2);
    expect(store.favoritedCount).toBe(1);
  });

  it("likedPosts / favoritedPosts 过滤正确", () => {
    const store = usePostsStore();
    store.publish("A");
    store.publish("B");
    store.toggleLike(store.posts[0].id); // B
    store.toggleFavorite(store.posts[1].id); // A
    expect(store.likedPosts.map((p) => p.content)).toEqual(["B"]);
    expect(store.favoritedPosts.map((p) => p.content)).toEqual(["A"]);
  });

  it("filter 默认 all，filteredPosts 返回全部", () => {
    const store = usePostsStore();
    store.publish("A");
    store.publish("B");
    expect(store.filter).toBe("all");
    expect(store.filteredPosts).toHaveLength(2);
  });

  it("setFilter=liked 时 filteredPosts 只含已点赞内容", () => {
    const store = usePostsStore();
    store.publish("A");
    store.publish("B");
    store.toggleLike(store.posts[0].id); // B 被点赞
    store.setFilter("liked");
    expect(store.filteredPosts.map((p) => p.content)).toEqual(["B"]);
    store.setFilter("favorited");
    expect(store.filteredPosts).toHaveLength(0);
    store.setFilter("all");
    expect(store.filteredPosts).toHaveLength(2);
  });

  it("setFilter 非法值回退为 all", () => {
    const store = usePostsStore();
    store.setFilter("nonsense");
    expect(store.filter).toBe("all");
  });
});
