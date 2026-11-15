import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import PostItem from "./PostItem.vue";
import { usePostsStore } from "../stores/posts";

/**
 * 先在 store 中发布一条内容，再用 store 中的 post 对象挂载组件，
 * 保证组件与测试共享同一数据源。
 * renderOnly: 直接用覆写后的对象渲染（用于激活态样式检查）
 */
function mountItem(over = {}, renderOnly = false) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = usePostsStore();
  store.publish("你好");
  const post = renderOnly ? { ...store.posts[0], ...over } : store.posts[0];
  const wrapper = mount(PostItem, {
    props: { post },
    global: { plugins: [pinia] },
  });
  return { wrapper, store };
}

describe("PostItem 组件", () => {
  beforeEach(() => localStorage.clear());

  it("渲染点赞与收藏两个切换按钮", () => {
    const { wrapper } = mountItem();
    expect(wrapper.find(".btn-like").exists()).toBe(true);
    expect(wrapper.find(".btn-favorite").exists()).toBe(true);
    expect(wrapper.text()).toContain("点赞");
    expect(wrapper.text()).toContain("收藏");
  });

  it("未点赞/未收藏时按钮无激活态", () => {
    const { wrapper } = mountItem();
    expect(wrapper.find(".btn-like").classes()).not.toContain("liked");
    expect(wrapper.find(".btn-favorite").classes()).not.toContain("favorited");
  });

  it("已点赞/已收藏时按钮显示激活态", () => {
    const { wrapper } = mountItem({ liked: true, favorited: true }, true);
    expect(wrapper.find(".btn-like").classes()).toContain("liked");
    expect(wrapper.find(".btn-favorite").classes()).toContain("favorited");
  });

  it("点击点赞按钮调用 store.toggleLike", async () => {
    const { wrapper, store } = mountItem();
    await wrapper.find(".btn-like").trigger("click");
    expect(store.posts[0].liked).toBe(true);
    expect(JSON.parse(localStorage.getItem("weyan_posts"))[0].liked).toBe(true);
  });

  it("点击收藏按钮调用 store.toggleFavorite", async () => {
    const { wrapper, store } = mountItem();
    await wrapper.find(".btn-favorite").trigger("click");
    expect(store.posts[0].favorited).toBe(true);
    expect(JSON.parse(localStorage.getItem("weyan_posts"))[0].favorited).toBe(true);
  });

  it("点赞后再次点击取消点赞（切换语义）", async () => {
    const { wrapper, store } = mountItem();
    await wrapper.find(".btn-like").trigger("click");
    await wrapper.find(".btn-like").trigger("click");
    expect(store.posts[0].liked).toBe(false);
  });
});
