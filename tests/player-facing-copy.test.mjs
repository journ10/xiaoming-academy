import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const runtimeFiles = ["index.html", "app.js", "core.js"];

const bannedPlayerCopy = [
  "地图",
  "练功",
  "战斗",
  "学习风格",
  "章节机制",
  "章节封印",
  "题眼手账",
  "今日清单",
  "学习仪表盘",
  "材料",
  "心力",
  "正式题",
  "待归类",
  "源题位",
  "可玩题",
  "手账",
  "日课",
  "仪表盘",
  "秘卷",
  "章节",
];

test("runtime copy stays aligned with the current player-facing vocabulary", () => {
  const source = runtimeFiles.map((file) => readFileSync(file, "utf8")).join("\n");

  for (const phrase of bannedPlayerCopy) {
    assert.doesNotMatch(source, new RegExp(escapeRegExp(phrase), "u"), phrase);
  }
});

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
