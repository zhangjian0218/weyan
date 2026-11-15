# 微言（WeYan）—— 极简本地化内容社区

一个使用 **Vue 3 + Pinia + Vite** 实现的极简社交内容发布应用，数据通过浏览器 Local Storage 本地化存储，无后端、无外部服务。

> 采用 **TDD（测试驱动开发）** 方式开发：先写测试（红灯）→ 实现功能（绿灯），共 23 个单元测试。

## 功能清单

- [x] 发布内容：280 字上限、实时字数统计、空内容/超限校验与错误提示
- [x] 查看时间线：按发布时间倒序的响应式卡片流，含头像、昵称、相对时间
- [x] 删除内容：单条删除，列表与 localStorage 同步更新
- [x] **点赞**：单条内容切换点赞（♡/♥），状态持久化
- [x] **收藏**：单条内容切换收藏（☆/★），状态持久化
- [x] **筛选 Tab**：全部 / 已点赞 / 已收藏，基于 store getter `filteredPosts`
- [x] Local Storage 持久化：刷新/关闭浏览器后数据不丢失，损坏数据自动容错，旧数据自动回填点赞/收藏字段
- [x] 快捷键：Ctrl + Enter 快速发布
- [x] 原始纯 HTML/CSS/JS 版本保留在 `vanilla/` 目录

## 开发流程（Git Worktree 并行 + 子 Agent 审查）

点赞/收藏功能采用并行分支开发，接口契约见 `docs/contract.md`：

```
feature/like-favorite ──┬── feature/lf-core（store 数据层：点赞/收藏/筛选）
                        └── feature/lf-ui （组件层：切换按钮/筛选 Tab/样式）
```

- 两条分支在独立 Git Worktree 中开发，按契约的文件所有权划分避免冲突
- 各分支 TDD 红绿循环完成后合并回 `feature/like-favorite`
- 两个子 Agent（code-explorer）并行审查 core / ui 分支
- 合并后统一运行全部测试与构建，浏览器实际操作验收

## 测试覆盖（Vitest + @vue/test-utils，43 个用例）

| 层 | 文件 | 用例 |
| --- | --- | --- |
| Store | `src/stores/posts.test.js` | 发布/排序/持久化、空白校验、280 字上限、删除、load 恢复、损坏数据容错、点赞/收藏切换、旧数据回填、筛选（19 个） |
| 工具 | `src/utils/time.test.js` | 相对时间格式化边界（4 个） |
| 组件 | `src/components/Composer.test.js` | 渲染、按钮禁用、字数联动、点击/快捷键发布、错误提示（6 个） |
| 组件 | `src/components/PostList.test.js` | 空提示、渲染卡片、点击删除、响应式更新、筛选 Tab 渲染与切换（8 个） |
| 组件 | `src/components/PostItem.test.js` | 按钮渲染、激活态、点赞/收藏切换调用（6 个） |

## 运行方式

```bash
npm install        # 安装依赖
npm test           # 运行测试（TDD 全绿）
npm run dev        # 启动开发服务器 http://localhost:5173
npm run build      # 生产构建
```

## 技术要点

| 项 | 说明 |
| --- | --- |
| 框架 | Vue 3（`<script setup>` 组合式 API） |
| 状态管理 | Pinia：`posts` store 集中管理发布/删除/持久化 |
| 存储 | `localStorage`，键名 `weyan_posts`，JSON 序列化 |
| 构建 | Vite |
| 测试 | Vitest（jsdom 环境）+ @vue/test-utils，TDD 红绿循环 |
| 安全 | Vue 模板默认转义，防 XSS |

## 目录结构

```
├── index.html                  # Vite 入口
├── vite.config.js              # Vite + Vitest 配置
├── src/
│   ├── main.js                 # 应用入口（挂载 Pinia）
│   ├── App.vue                 # 根组件
│   ├── style.css               # 全局样式
│   ├── stores/
│   │   ├── posts.js            # Pinia store（核心业务逻辑）
│   │   └── posts.test.js
│   ├── components/
│   │   ├── Composer.vue        # 发布区
│   │   ├── PostList.vue        # 时间线列表
│   │   ├── PostItem.vue        # 单条内容卡片
│   │   ├── Composer.test.js
│   │   └── PostList.test.js
│   └── utils/
│       ├── time.js             # 相对时间格式化
│       └── time.test.js
└── vanilla/                    # 原纯 HTML/CSS/JS 版本
```
