import { describe, it, expect, beforeEach } from "vitest";
import { createApp } from "./app";

function jsonReq(path, method, body) {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("RESTful API", () => {
  let app;
  beforeEach(() => {
    app = createApp();
  });

  /* ---------- GET /api/posts ---------- */

  it("GET /api/posts 空列表返回 200", async () => {
    const res = await app.request("/api/posts");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.posts).toEqual([]);
  });

  it("GET /api/posts 按时间倒序返回全部内容", async () => {
    await app.request(jsonReq("/api/posts", "POST", { content: "第一条" }));
    await app.request(jsonReq("/api/posts", "POST", { content: "第二条" }));
    const res = await app.request("/api/posts");
    const data = await res.json();
    expect(data.posts.map((p) => p.content)).toEqual(["第二条", "第一条"]);
  });

  /* ---------- POST /api/posts ---------- */

  it("POST 创建成功返回 201 与完整 post", async () => {
    const res = await app.request(jsonReq("/api/posts", "POST", { content: "你好" }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.post.content).toBe("你好");
    expect(data.post.user).toBe("小言");
    expect(data.post.liked).toBe(false);
    expect(data.post.favorited).toBe(false);
  });

  it("POST 空内容返回 400 与错误信息", async () => {
    const res = await app.request(jsonReq("/api/posts", "POST", { content: "  " }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("内容不能为空");
  });

  it("POST 超长内容返回 400 与错误信息", async () => {
    const res = await app.request(
      jsonReq("/api/posts", "POST", { content: "啊".repeat(281) })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("超出 280 字上限");
  });

  it("POST 非法 JSON 返回 400", async () => {
    const res = await app.request(
      new Request("http://localhost/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{broken",
      })
    );
    expect(res.status).toBe(400);
  });

  /* ---------- PATCH /api/posts/:id ---------- */

  it("PATCH 设置点赞返回 200 与更新后的 post", async () => {
    const created = await (
      await app.request(jsonReq("/api/posts", "POST", { content: "A" }))
    ).json();
    const id = created.post.id;

    const res = await app.request(jsonReq(`/api/posts/${id}`, "PATCH", { liked: true }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.post.liked).toBe(true);
    expect(data.post.favorited).toBe(false);
  });

  it("PATCH 设置收藏后 GET 结果同步更新", async () => {
    const created = await (
      await app.request(jsonReq("/api/posts", "POST", { content: "A" }))
    ).json();
    await app.request(jsonReq(`/api/posts/${created.post.id}`, "PATCH", { favorited: true }));

    const res = await app.request("/api/posts");
    const data = await res.json();
    expect(data.posts[0].favorited).toBe(true);
  });

  it("PATCH 不存在的 id 返回 404", async () => {
    const res = await app.request(jsonReq("/api/posts/no-id", "PATCH", { liked: true }));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("内容不存在");
  });

  it("PATCH 不含任何合法字段返回 400", async () => {
    const created = await (
      await app.request(jsonReq("/api/posts", "POST", { content: "A" }))
    ).json();
    const res = await app.request(jsonReq(`/api/posts/${created.post.id}`, "PATCH", {}));
    expect(res.status).toBe(400);
  });

  it("PATCH 非法 JSON 返回 400", async () => {
    const res = await app.request(
      new Request("http://localhost/api/posts/any-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "{broken",
      })
    );
    expect(res.status).toBe(400);
  });

  it("PATCH 非布尔 flag 返回 400", async () => {
    const created = await (
      await app.request(jsonReq("/api/posts", "POST", { content: "A" }))
    ).json();
    const res = await app.request(
      jsonReq(`/api/posts/${created.post.id}`, "PATCH", { liked: "yes" })
    );
    expect(res.status).toBe(400);
  });

  it("POST 非字符串 content 返回 400 与契约文案", async () => {
    const res = await app.request(jsonReq("/api/posts", "POST", { content: 123 }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("内容格式不正确");
  });

  /* ---------- DELETE /api/posts/:id ---------- */

  it("DELETE 成功返回 204 且列表已更新", async () => {
    const created = await (
      await app.request(jsonReq("/api/posts", "POST", { content: "A" }))
    ).json();
    const res = await app.request(jsonReq(`/api/posts/${created.post.id}`, "DELETE"));
    expect(res.status).toBe(204);

    const list = await (await app.request("/api/posts")).json();
    expect(list.posts).toHaveLength(0);
  });

  it("DELETE 不存在的 id 返回 404", async () => {
    const res = await app.request(jsonReq("/api/posts/no-id", "DELETE"));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("内容不存在");
  });
});
