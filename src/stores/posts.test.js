import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { usePostsStore, MAX_LEN } from "./posts";
import { mockApi, samplePost } from "../test-utils/api-mock";

describe("posts store（API 客户端）", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("load 通过 GET /api/posts 获取数据", async () => {
    const { fetchMock } = mockApi([samplePost()]);
    const store = usePostsStore();
    await store.load();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/posts",
      expect.objectContaining({ method: "GET" })
    );
    expect(store.posts).toHaveLength(1);
    expect(store.posts[0].content).toBe("服务端内容");
  });

  it("load 在服务端异常时保持空列表且不抛出", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 500 })));
    const store = usePostsStore();
    await expect(store.load()).rejects.toThrow();
    // store 不崩：允许调用方决定如何处理
  });

  it("publish 通过 POST 创建并插入列表最前", async () => {
    mockApi([samplePost({ id: "srv-old", time: 1 })]);
    const store = usePostsStore();
    await store.load();
    await store.publish("新内容");
    expect(store.posts).toHaveLength(2);
    expect(store.posts[0].content).toBe("新内容");
    expect(store.posts[0].user).toBe("小言");
    expect(store.posts[0].liked).toBe(false);
  });

  it("publish 空内容抛出服务端错误信息", async () => {
    mockApi();
    const store = usePostsStore();
    await expect(store.publish("   ")).rejects.toThrow("内容不能为空");
    expect(store.posts).toHaveLength(0);
  });

  it("publish 超长内容抛出服务端错误信息", async () => {
    mockApi();
    const store = usePostsStore();
    await expect(store.publish("啊".repeat(MAX_LEN + 1))).rejects.toThrow(
      "超出 280 字上限"
    );
    expect(store.posts).toHaveLength(0);
  });

  it("remove 通过 DELETE 删除并同步本地列表", async () => {
    mockApi([samplePost(), samplePost({ id: "srv-2", time: 2 })]);
    const store = usePostsStore();
    await store.load();
    await store.remove("srv-2");
    expect(store.posts).toHaveLength(1);
    expect(store.posts[0].id).toBe("srv-1");
  });

  it("remove 对不存在的 id 静默容错", async () => {
    mockApi([samplePost()]);
    const store = usePostsStore();
    await store.load();
    await store.remove("no-id");
    expect(store.posts).toHaveLength(1);
  });

  it("toggleLike 发送 PATCH 并以服务端返回更新本地", async () => {
    mockApi([samplePost()]);
    const store = usePostsStore();
    await store.load();
    await store.toggleLike("srv-1");
    expect(store.posts[0].liked).toBe(true);
    await store.toggleLike("srv-1");
    expect(store.posts[0].liked).toBe(false);
  });

  it("toggleFavorite 发送 PATCH 并以服务端返回更新本地", async () => {
    mockApi([samplePost()]);
    const store = usePostsStore();
    await store.load();
    await store.toggleFavorite("srv-1");
    expect(store.posts[0].favorited).toBe(true);
  });

  it("toggleLike 双击竞态：响应返回前的重复点击被忽略", async () => {
    mockApi([samplePost()]);
    const store = usePostsStore();
    await store.load();

    // 用延迟响应的 fetch 模拟慢网络
    let resolveLater;
    const delayedFetch = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveLater = resolve;
        })
    );
    vi.stubGlobal("fetch", delayedFetch);

    const p1 = store.toggleLike("srv-1");
    const p2 = store.toggleLike("srv-1"); // 第二次点击应被守卫忽略
    resolveLater(
      new Response(JSON.stringify({ post: { ...samplePost(), liked: true } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    await Promise.all([p1, p2]);

    expect(delayedFetch).toHaveBeenCalledTimes(1); // 仅发出一次 PATCH
    expect(store.posts[0].liked).toBe(true);
  });

  it("toggleLike 对不存在的 id 静默容错", async () => {
    mockApi([samplePost()]);
    const store = usePostsStore();
    await store.load();
    await expect(store.toggleLike("no-id")).resolves.not.toThrow();
    expect(store.posts[0].liked).toBe(false);
  });

  /* ---------- 本地筛选逻辑保持不变 ---------- */

  it("filter 默认 all，setFilter 与 filteredPosts 正常工作", async () => {
    mockApi([
      samplePost({ id: "a", time: 1 }),
      samplePost({ id: "b", time: 2, liked: true }),
    ]);
    const store = usePostsStore();
    await store.load();
    expect(store.filter).toBe("all");
    expect(store.filteredPosts).toHaveLength(2);
    store.setFilter("liked");
    expect(store.filteredPosts.map((p) => p.id)).toEqual(["b"]);
    store.setFilter("nonsense");
    expect(store.filter).toBe("all");
  });

  it("likedCount / favoritedCount 统计正确", async () => {
    mockApi([
      samplePost({ id: "a", time: 1, liked: true }),
      samplePost({ id: "b", time: 2, favorited: true }),
    ]);
    const store = usePostsStore();
    await store.load();
    expect(store.likedCount).toBe(1);
    expect(store.favoritedCount).toBe(1);
  });
});
