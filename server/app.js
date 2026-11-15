import { Hono } from "hono";
import { createMemoryStore } from "./store.js";

/**
 * 创建 Hono 应用实例（RESTful API，内存存储）
 */
export function createApp() {
  const app = new Hono();
  const store = createMemoryStore();

  // 列表（时间倒序）
  app.get("/api/posts", (c) => {
    return c.json({ posts: store.list() });
  });

  // 创建
  app.post("/api/posts", async (c) => {
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "请求体必须是合法 JSON" }, 400);
    }
    try {
      const post = store.create(body?.content);
      return c.json({ post }, 201);
    } catch (e) {
      return c.json({ error: e.message }, 400);
    }
  });

  // 更新点赞/收藏标记
  app.patch("/api/posts/:id", async (c) => {
    const id = c.req.param("id");
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "请求体必须是合法 JSON" }, 400);
    }
    const { liked, favorited } = body ?? {};
    const hasFlag =
      typeof liked === "boolean" || typeof favorited === "boolean";
    if (!hasFlag) {
      return c.json({ error: "至少提供 liked 或 favorited 布尔字段" }, 400);
    }
    const post = store.setFlags(id, { liked, favorited });
    if (!post) {
      return c.json({ error: "内容不存在" }, 404);
    }
    return c.json({ post });
  });

  // 删除
  app.delete("/api/posts/:id", (c) => {
    const removed = store.remove(c.req.param("id"));
    if (!removed) {
      return c.json({ error: "内容不存在" }, 404);
    }
    return c.body(null, 204);
  });

  return app;
}
