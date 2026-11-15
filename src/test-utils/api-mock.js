import { vi } from "vitest";

/**
 * 模拟后端 RESTful API（与 docs/api-contract.md 一致）
 * 返回 { state, fetchMock }；state 为"服务端内存数据"
 */
export function mockApi(initial = []) {
  const state = [...initial];
  const fetchMock = vi.fn(async (url, options = {}) => {
    const method = (options.method || "GET").toUpperCase();
    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    const path = String(url).replace(/^https?:\/\/[^/]+/, "").split("?")[0];

    if (method === "GET" && path === "/api/posts") {
      return json({ posts: [...state].sort((a, b) => b.time - a.time) });
    }
    if (method === "POST" && path === "/api/posts") {
      const body = JSON.parse(options.body || "{}");
      const text = (body.content ?? "").trim();
      if (!text) return json({ error: "内容不能为空" }, 400);
      if (text.length > 280) return json({ error: "超出 280 字上限" }, 400);
      const post = {
        id: `srv-${Math.random().toString(16).slice(2, 8)}`,
        user: "小言",
        content: text,
        time: Date.now(),
        liked: false,
        favorited: false,
      };
      state.push(post);
      return json({ post }, 201);
    }
    if (method === "PATCH" && path.startsWith("/api/posts/")) {
      const id = path.split("/").pop();
      const post = state.find((p) => p.id === id);
      if (!post) return json({ error: "内容不存在" }, 404);
      const body = JSON.parse(options.body || "{}");
      if (typeof body.liked === "boolean") post.liked = body.liked;
      if (typeof body.favorited === "boolean") post.favorited = body.favorited;
      return json({ post });
    }
    if (method === "DELETE" && path.startsWith("/api/posts/")) {
      const id = path.split("/").pop();
      const index = state.findIndex((p) => p.id === id);
      if (index === -1) return json({ error: "内容不存在" }, 404);
      state.splice(index, 1);
      return new Response(null, { status: 204 });
    }
    return json({ error: "未知路由" }, 404);
  });

  vi.stubGlobal("fetch", fetchMock);
  return { state, fetchMock };
}

export const samplePost = (over = {}) => ({
  id: "srv-1",
  user: "小言",
  content: "服务端内容",
  time: 1700000000000,
  liked: false,
  favorited: false,
  ...over,
});
