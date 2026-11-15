# 点赞 / 收藏 功能契约（core 与 ui 分工接口）

本文件是 `feature/lf-core`（数据层）与 `feature/lf-ui`（界面层）两条并行分支的接口契约，双方必须严格遵守。

## 数据模型

Post 对象新增两个字段：

- `liked: boolean`（发布时默认 `false`）
- `favorited: boolean`（发布时默认 `false`）
- `load()` 恢复旧数据时对缺失字段回填 `false`（数据迁移）

## Store API（仅 core 分支修改 `src/stores/posts.js` / `posts.test.js`）

state 新增：

- `filter: 'all' | 'liked' | 'favorited'`，默认 `'all'`

actions 新增：

- `toggleLike(id)`：切换 liked 并持久化；id 不存在时静默无操作
- `toggleFavorite(id)`：切换 favorited 并持久化；id 不存在时静默无操作
- `setFilter(filter)`：非法值回退 `'all'`

getters 新增：

- `likedPosts` / `favoritedPosts`
- `likedCount` / `favoritedCount`
- `filteredPosts`：按 filter 过滤；`'all'` 返回全部（保持时间倒序）

persist 语义与现有 `persist()` 一致。

## UI（仅 ui 分支修改，禁止改 store 与 App.vue/main.js）

- `PostItem.vue`：两个切换按钮「♥ 点赞」「★ 收藏」，激活态 class 为 `liked` / `favorited`；点击调用对应 action
- `PostList.vue`：顶部筛选 Tab（全部 / 已点赞 / 已收藏），列表基于 `store.filteredPosts` 渲染
- `style.css`：新增按钮与激活态样式
- 测试：`PostItem.test.js`（新增）、`PostList.test.js`（扩展）

## 文件所有权（避免合并冲突）

| 分支 | 独占文件 |
| --- | --- |
| lf-core | `src/stores/posts.js`、`src/stores/posts.test.js` |
| lf-ui | `src/components/*`、`src/style.css` |
