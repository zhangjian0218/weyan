import { describe, it, expect, beforeEach } from "vitest";
import { createMemoryStore } from "./store";

describe("内存存储", () => {
  let store;
  beforeEach(() => {
    store = createMemoryStore();
  });

  it("初始为空列表", () => {
    expect(store.list()).toEqual([]);
  });

  it("create 创建内容，包含默认字段并按时间倒序返回", () => {
    store.create("第一条");
    store.create("第二条");
    const posts = store.list();
    expect(posts).toHaveLength(2);
    expect(posts[0].content).toBe("第二条");
    expect(posts[0].user).toBe("小言");
    expect(posts[0].liked).toBe(false);
    expect(posts[0].favorited).toBe(false);
    expect(typeof posts[0].id).toBe("string");
    expect(typeof posts[0].time).toBe("number");
  });

  it("create 去除首尾空白", () => {
    const post = store.create("  你好  ");
    expect(post.content).toBe("你好");
  });

  it("create 空内容 / 纯空白抛出异常", () => {
    expect(() => store.create("")).toThrow("内容不能为空");
    expect(() => store.create("   ")).toThrow("内容不能为空");
    expect(store.list()).toHaveLength(0);
  });

  it("create 超过 280 字抛出异常", () => {
    expect(() => store.create("啊".repeat(281))).toThrow("超出 280 字上限");
    expect(() => store.create("好".repeat(280))).not.toThrow();
  });

  it("create 非字符串内容抛出契约文案异常", () => {
    expect(() => store.create(123)).toThrow("内容格式不正确");
    expect(() => store.create(null)).toThrow("内容格式不正确");
    expect(() => store.create(["数组"])).toThrow("内容格式不正确");
  });

  it("同一毫秒内连续创建，time 严格递增保证倒序正确", () => {
    const ids = [];
    for (let i = 0; i < 5; i++) {
      ids.push(store.create(`第${i}条`).id);
    }
    const times = store.list().map((p) => p.time);
    for (let i = 1; i < times.length; i++) {
      expect(times[i - 1]).toBeGreaterThan(times[i]);
    }
    // 列表顺序与创建顺序相反（最新的在前）
    expect(store.list().map((p) => p.id)).toEqual([...ids].reverse());
  });

  it("find 按 id 查找", () => {
    const post = store.create("A");
    expect(store.find(post.id).content).toBe("A");
    expect(store.find("no-id")).toBeUndefined();
  });

  it("setFlags 设置点赞/收藏并返回更新后的内容", () => {
    const post = store.create("A");
    const updated = store.setFlags(post.id, { liked: true });
    expect(updated.liked).toBe(true);
    expect(updated.favorited).toBe(false);
    store.setFlags(post.id, { favorited: true });
    expect(store.find(post.id).favorited).toBe(true);
  });

  it("setFlags 对不存在的 id 返回 undefined", () => {
    expect(store.setFlags("no-id", { liked: true })).toBeUndefined();
  });

  it("remove 按 id 删除，返回是否删除成功", () => {
    const post = store.create("A");
    expect(store.remove(post.id)).toBe(true);
    expect(store.list()).toHaveLength(0);
    expect(store.remove(post.id)).toBe(false);
  });
});
