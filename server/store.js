import { randomUUID } from "node:crypto";

const MAX_LEN = 280;
const DEFAULT_USER = "小言";

function createId() {
  return randomUUID();
}

/**
 * 内存存储（进程内数组，重启即清空）
 */
export function createMemoryStore() {
  const posts = [];
  let lastTime = 0;

  function validate(content) {
    if (typeof content !== "string") {
      throw new Error("内容格式不正确");
    }
    const text = content.trim();
    if (!text) {
      throw new Error("内容不能为空");
    }
    if (text.length > MAX_LEN) {
      throw new Error(`超出 ${MAX_LEN} 字上限`);
    }
    return text;
  }

  return {
    list() {
      return [...posts].sort((a, b) => b.time - a.time);
    },

    find(id) {
      return posts.find((p) => p.id === id);
    },

    create(content) {
      const text = validate(content);
      // 保证时间戳严格递增，同一毫秒内多次创建也能正确排序
      lastTime = Math.max(Date.now(), lastTime + 1);
      const post = {
        id: createId(),
        user: DEFAULT_USER,
        content: text,
        time: lastTime,
        liked: false,
        favorited: false,
      };
      posts.push(post);
      return post;
    },

    /** 设置 liked/favorited 标记，返回更新后的 post 或 undefined */
    setFlags(id, flags) {
      const post = posts.find((p) => p.id === id);
      if (!post) return undefined;
      if (typeof flags.liked === "boolean") post.liked = flags.liked;
      if (typeof flags.favorited === "boolean") post.favorited = flags.favorited;
      return post;
    },

    /** 删除，返回是否删除成功 */
    remove(id) {
      const index = posts.findIndex((p) => p.id === id);
      if (index === -1) return false;
      posts.splice(index, 1);
      return true;
    },
  };
}
