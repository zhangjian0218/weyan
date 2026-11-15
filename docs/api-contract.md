# RESTful API 契约（Hono + 内存存储，替换 Local Storage）

## 数据模型

Post：`{ id: string, user: string, content: string, time: number, liked: boolean, favorited: boolean }`

存储：后端进程内存（重启即清空，符合需求"内存存储"）；前端不再读写 localStorage。

## 端点

| 方法 | 路径 | 请求体 | 成功响应 | 失败响应 |
| --- | --- | --- | --- | --- |
| GET | `/api/posts` | - | `200 {"posts":[...]}` 按时间倒序 | - |
| POST | `/api/posts` | `{"content":"..."}` | `201 {"post":{...}}` | `400 {"error":"内容不能为空"/"超出 280 字上限"}` |
| PATCH | `/api/posts/:id` | `{"liked"?:bool,"favorited"?:bool}`（至少一个字段） | `200 {"post":{...}}` | `404 {"error":"内容不存在"}` / `400` |
| DELETE | `/api/posts/:id` | - | `204` 无 body | `404 {"error":"内容不存在"}` |

约定：

- 请求/响应均为 JSON（Content-Type: application/json）
- 校验逻辑与原前端一致：trim 后非空、≤ 280 字
- 服务端字段默认值：`user="小言"`、`liked=false`、`favorited=false`
- 筛选（全部/已点赞/已收藏）由前端基于返回列表完成，服务端不做筛选

## 前端改造

- `src/stores/posts.js`：actions 变为 async，通过 `fetch("/api/...")` 调用；`filter`/`filteredPosts` 等本地筛选逻辑保留
- 组件无需大改（调用仍是 store action），Composer 的错误提示兼容异步
- `vite.config.js`：dev 代理 `/api` → `http://localhost:3000`
- 测试：mock 全局 `fetch`（`vi.stubGlobal`）
