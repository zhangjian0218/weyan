import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Composer from "./Composer.vue";
import { usePostsStore } from "../stores/posts";
import { mockApi, samplePost } from "../test-utils/api-mock";

function mountComposer() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(Composer, { global: { plugins: [pinia] } });
}

describe("Composer 组件", () => {
  beforeEach(() => mockApi());
  afterEach(() => vi.unstubAllGlobals());

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

  it("点击发布：经 API 写入 store、清空输入框", async () => {
    const { fetchMock } = mockApi([samplePost()]);
    const wrapper = mountComposer();
    const store = usePostsStore();
    await wrapper.find("textarea").setValue("测试发布");
    await wrapper.find("button").trigger("click");
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/posts",
      expect.objectContaining({ method: "POST" })
    );
    expect(store.posts.some((p) => p.content === "测试发布")).toBe(true);
    expect(wrapper.find("textarea").element.value).toBe("");
  });

  it("发布空白内容时显示服务端错误提示且不写入 store", async () => {
    mockApi();
    const wrapper = mountComposer();
    const store = usePostsStore();
    await wrapper.find("textarea").setValue("   ");
    await wrapper.find("textarea").trigger("keydown", { key: "Enter", ctrlKey: true });
    await flushPromises();

    expect(store.posts).toHaveLength(0);
    expect(wrapper.text()).toContain("内容不能为空");
  });

  it("Ctrl+Enter 快捷键发布", async () => {
    mockApi();
    const wrapper = mountComposer();
    const store = usePostsStore();
    await wrapper.find("textarea").setValue("快捷发布");
    await wrapper.find("textarea").trigger("keydown", { key: "Enter", ctrlKey: true });
    await flushPromises();
    expect(store.posts.some((p) => p.content === "快捷发布")).toBe(true);
    expect(wrapper.find("textarea").element.value).toBe("");
  });
});
