import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import PostList from "./PostList.vue";
import { usePostsStore } from "../stores/posts";
import { mockApi, samplePost } from "../test-utils/api-mock";

function mountList() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(PostList, { global: { plugins: [pinia] } });
}

describe("PostList 组件", () => {
  beforeEach(() => mockApi());
  afterEach(() => vi.unstubAllGlobals());

  it("无内容时显示空提示", async () => {
    const wrapper = mountList();
    const store = usePostsStore();
    await store.load();
    await flushPromises();
    expect(wrapper.text()).toContain("还没有内容");
    expect(wrapper.findAll(".post")).toHaveLength(0);
  });

  it("渲染 store 中的所有内容卡片（时间倒序）", async () => {
    mockApi([
      samplePost({ id: "a", content: "第一条", time: 1 }),
      samplePost({ id: "b", content: "第二条", time: 2 }),
    ]);
    const wrapper = mountList();
    const store = usePostsStore();
    await store.load();
    await flushPromises();

    const items = wrapper.findAll(".post");
    expect(items).toHaveLength(2);
    expect(items[0].text()).toContain("第二条");
    expect(items[1].text()).toContain("第一条");
    expect(wrapper.text()).not.toContain("还没有内容");
  });

  it("点击删除按钮经 API 从 store 中移除对应条目", async () => {
    mockApi([
      samplePost({ id: "del", content: "待删除", time: 2 }),
      samplePost({ id: "keep", content: "保留", time: 1 }),
    ]);
    const wrapper = mountList();
    const store = usePostsStore();
    await store.load();
    await flushPromises();

    const target = wrapper
      .findAll(".post")
      .find((p) => p.text().includes("待删除"));
    await target.find(".btn-delete").trigger("click");
    await flushPromises();

    expect(store.posts).toHaveLength(1);
    expect(store.posts[0].content).toBe("保留");
  });

  it("内容变化时列表响应式更新", async () => {
    mockApi();
    const wrapper = mountList();
    const store = usePostsStore();
    await store.load();
    await store.publish("响应式新内容");
    await flushPromises();
    expect(wrapper.text()).toContain("响应式新内容");
  });

  /* ---------- 筛选 Tab ---------- */

  it("渲染全部/已点赞/已收藏三个筛选 Tab，默认选中全部", async () => {
    const wrapper = mountList();
    const store = usePostsStore();
    await store.load();
    await flushPromises();

    const tabs = wrapper.findAll(".filter-tab");
    expect(tabs).toHaveLength(3);
    expect(tabs.map((t) => t.text())).toEqual(["全部", "已点赞", "已收藏"]);
    expect(tabs[0].classes()).toContain("active");
    expect(tabs[1].classes()).not.toContain("active");
  });

  it("点击已点赞 Tab 后列表只显示已点赞内容", async () => {
    mockApi([
      samplePost({ id: "a", content: "甲", time: 1 }),
      samplePost({ id: "b", content: "乙", time: 2 }),
    ]);
    const wrapper = mountList();
    const store = usePostsStore();
    await store.load();
    await store.toggleLike("b");
    await flushPromises();

    await wrapper.findAll(".filter-tab")[1].trigger("click");
    await flushPromises();

    const texts = wrapper.findAll(".post").map((p) => p.text());
    expect(texts).toHaveLength(1);
    expect(texts[0]).toContain("乙");
    expect(wrapper.findAll(".filter-tab")[1].classes()).toContain("active");
  });

  it("点击已收藏 Tab 后列表只显示已收藏内容", async () => {
    mockApi([
      samplePost({ id: "a", content: "甲", time: 1 }),
      samplePost({ id: "b", content: "乙", time: 2 }),
    ]);
    const wrapper = mountList();
    const store = usePostsStore();
    await store.load();
    await store.toggleFavorite("a");
    await flushPromises();

    await wrapper.findAll(".filter-tab")[2].trigger("click");
    await flushPromises();

    const texts = wrapper.findAll(".post").map((p) => p.text());
    expect(texts).toHaveLength(1);
    expect(texts[0]).toContain("甲");
  });

  it("筛选后再切回全部，恢复显示所有内容", async () => {
    mockApi([samplePost({ id: "a" }), samplePost({ id: "b", time: 2 })]);
    const wrapper = mountList();
    const store = usePostsStore();
    await store.load();
    await flushPromises();

    await wrapper.findAll(".filter-tab")[1].trigger("click"); // 已点赞（空）
    await flushPromises();
    expect(wrapper.findAll(".post")).toHaveLength(0);

    await wrapper.findAll(".filter-tab")[0].trigger("click"); // 全部
    await flushPromises();
    expect(wrapper.findAll(".post")).toHaveLength(2);
  });
});
