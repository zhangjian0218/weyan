import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Composer from "./Composer.vue";
import { usePostsStore } from "../stores/posts";

function mountComposer() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(Composer, { global: { plugins: [pinia] } });
}

describe("Composer 组件", () => {
  beforeEach(() => localStorage.clear());

  it("渲染输入框、字数统计与发布按钮", () => {
    const wrapper = mountComposer();
    expect(wrapper.find("textarea").exists()).toBe(true);
    expect(wrapper.text()).toContain("0 / 280");
    expect(wrapper.find("button").exists()).toBe(true);
  });

  it("内容为空时发布按钮禁用", () => {
    const wrapper = mountComposer();
    expect(wrapper.find("button").attributes("disabled")).toBeDefined();
  });

  it("输入内容后字数统计与按钮状态实时更新", async () => {
    const wrapper = mountComposer();
    await wrapper.find("textarea").setValue("你好微言");
    expect(wrapper.text()).toContain("4 / 280");
    expect(wrapper.find("button").attributes("disabled")).toBeUndefined();
  });

  it("点击发布：写入 store、清空输入框、localStorage 已持久化", async () => {
    const wrapper = mountComposer();
    const store = usePostsStore();
    await wrapper.find("textarea").setValue("测试发布");
    await wrapper.find("button").trigger("click");

    expect(store.posts).toHaveLength(1);
    expect(store.posts[0].content).toBe("测试发布");
    expect(wrapper.find("textarea").element.value).toBe("");
    expect(JSON.parse(localStorage.getItem("weyan_posts"))).toHaveLength(1);
  });

  it("发布空白内容时显示错误提示且不写入 store", async () => {
    const wrapper = mountComposer();
    const store = usePostsStore();
    // 按钮在空内容时禁用，直接对 textarea 回车触发提交路径
    await wrapper.find("textarea").setValue("   ");
    await wrapper.find("textarea").trigger("keydown", { key: "Enter", ctrlKey: true });

    expect(store.posts).toHaveLength(0);
    expect(wrapper.text()).toContain("内容不能为空");
  });

  it("Ctrl+Enter 快捷键发布", async () => {
    const wrapper = mountComposer();
    const store = usePostsStore();
    await wrapper.find("textarea").setValue("快捷发布");
    await wrapper.find("textarea").trigger("keydown", { key: "Enter", ctrlKey: true });
    expect(store.posts).toHaveLength(1);
    expect(wrapper.find("textarea").element.value).toBe("");
  });
});
