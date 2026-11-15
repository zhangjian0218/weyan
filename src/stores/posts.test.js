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
});
