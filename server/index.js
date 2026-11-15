import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { createApp } from "./app.js";

const app = createApp();

// 生产模式下托管前端构建产物（dist/）
app.use("*", serveStatic({ root: "./dist" }));

const port = Number(process.env.PORT || 3000);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`微言后端已启动: http://localhost:${info.port}`);
});
