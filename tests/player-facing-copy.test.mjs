import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const runtimeFiles = ["index.html", "app.js", "core.js"];

const bannedPlayerCopy = [
  "题库加载中",
  "内置题库加载失败",
  "内置题库加载后",
  "等待内置题库加载完成",
  "没有可玩题",
  "源题位",
  "可玩题",
  "需复核",
  "正式题",
  "待归类",
  "暂缓",
  "谨慎题",
  "题位",
  "正式主线",
  "章节提示",
  "完成剧情",
  "题库固定内置",
  "本地存档实时生成",
  "不上传数据",
  "题库原文全量数据",
  "JSON 需要",
  "questions 数组",
  "不导入题库",
  "缺少 stem",
  "缺少 topic",
  "缺少 answer",
  "练功讲解样本",
  "错误诊断",
  "学习风格切换失败",
  "导出失败",
  "导入存档失败",
  "存档类型不匹配",
  "未知路线节点",
  "未知破招式",
  "题干待补充",
  "暂无讲解",
  "必须是对象",
  "升级材料不足",
  "星辉",
  "星砂",
  "灵签",
  "当前没有真实错题",
  "核心玩法",
  "样本",
  "暂无",
  "未知",
  "未诊断",
  "未满足解锁条件",
  "卷宗入口暂时没有回应（",
  "找不到这种学习风格：",
  "找不到这种学习风格",
  "学习风格",
  "练功",
  "战斗",
  "回地图",
  "回练功",
  "章节机制",
  "章节封印",
  "完成练功",
  "练功目标",
  "战斗检验",
  "练功结果",
  "找不到这件法器：",
  "请回地图重进",
  "请回地图重进：",
  "暂时不可用：",
];

test("runtime copy stays player-facing instead of exposing implementation details", () => {
  const source = runtimeFiles.map((file) => readFileSync(file, "utf8")).join("\n");

  for (const phrase of bannedPlayerCopy) {
    assert.doesNotMatch(source, new RegExp(escapeRegExp(phrase), "u"), phrase);
  }
});

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
