import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import PostList from "./PostList.vue";
import { usePostsStore } from "../stores/posts";

function mountList() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(PostList, { global: { plugins: [pinia] } });
}

describe("PostList 组件", () => {
  beforeEach(() => localStorage.clear());

  it("无内容时显示空提示", () => {
    const wrapper = mountList();
    expect(wrapper.text()).toContain("还没有内容");
    expect(wrapper.findAll(".post")).toHaveLength(0);
  });

  it("渲染 store 中的所有内容卡片", async () => {
    const wrapper = mountList();
    const store = usePostsStore();
    store.publish("第一条");
    store.publish("第二条");
    await wrapper.vm.$nextTick();

    const items = wrapper.findAll(".post");
    expect(items).toHaveLength(2);
    // 最新的排在最前
    expect(items[0].text()).toContain("第二条");
    expect(items[1].text()).toContain("第一条");
    expect(wrapper.text()).not.toContain("还没有内容");
  });

  it("点击删除按钮从 store 中移除对应条目", async () => {
    const wrapper = mountList();
    const store = usePostsStore();
    store.publish("待删除");
    store.publish("保留");
    await wrapper.vm.$nextTick();

    const target = wrapper
      .findAll(".post")
      .find((p) => p.text().includes("待删除"));
    await target.find(".btn-delete").trigger("click");

    expect(store.posts).toHaveLength(1);
    expect(store.posts[0].content).toBe("保留");
    expect(JSON.parse(localStorage.getItem("weyan_posts"))).toHaveLength(1);
  });

  it("内容变化时列表响应式更新", async () => {
    const wrapper = mountList();
    const store = usePostsStore();
    store.publish("响应式新内容");
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("响应式新内容");
  });
});
