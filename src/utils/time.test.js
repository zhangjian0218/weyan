import { describe, it, expect } from "vitest";
import { formatTime } from "./time";

const NOW = 1700000000000; // 固定"当前时间"便于测试

describe("formatTime", () => {
  it("1 分钟内显示 刚刚", () => {
    expect(formatTime(NOW - 30 * 1000, NOW)).toBe("刚刚");
  });

  it("1 小时内显示 x 分钟前", () => {
    expect(formatTime(NOW - 5 * 60 * 1000, NOW)).toBe("5 分钟前");
    expect(formatTime(NOW - 59 * 60 * 1000, NOW)).toBe("59 分钟前");
  });

  it("1 天内显示 x 小时前", () => {
    expect(formatTime(NOW - 3 * 60 * 60 * 1000, NOW)).toBe("3 小时前");
  });

  it("超过 1 天显示 日期时间", () => {
    expect(formatTime(NOW - 26 * 60 * 60 * 1000, NOW)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });
});
