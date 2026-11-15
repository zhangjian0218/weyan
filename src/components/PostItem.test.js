import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import PostItem from "./PostItem.vue";
import { usePostsStore } from "../stores/posts";
import { mockApi, samplePost } from "../test-utils/api-mock";

function mountItem(over = {}, renderOnly = false) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = usePostsStore();
  const post = renderOnly ? { ...samplePost(), ...over } : samplePost();
  mockApi([post]);
  const wrapper = mount(PostItem, {
    props: { post },
    global: { plugins: [pinia] },
  });
  return { wrapper, store };
}

describe("PostItem 组件", () => {
  beforeEach(() => mockApi());
  afterEach(() => vi.unstubAllGlobals());

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

  it("点击点赞按钮经 API 切换点赞状态", async () => {
    const { wrapper, store } = mountItem();
    await store.load();
    await flushPromises();
    await wrapper.find(".btn-like").trigger("click");
    await flushPromises();
    expect(store.posts[0].liked).toBe(true);
    await wrapper.find(".btn-like").trigger("click");
    await flushPromises();
    expect(store.posts[0].liked).toBe(false);
  });

  it("点击收藏按钮经 API 切换收藏状态", async () => {
    const { wrapper, store } = mountItem();
    await store.load();
    await flushPromises();
    await wrapper.find(".btn-favorite").trigger("click");
    await flushPromises();
    expect(store.posts[0].favorited).toBe(true);
  });
});
