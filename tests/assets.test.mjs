import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { assetManifest, requiredAssetIds, getAssetPath } from "../src/assets.js";

describe("redesign asset manifest", () => {
  it("tracks every required redesign-v1 asset id", () => {
    const expectedIds = [
      "mockup.world",
      "mockup.story",
      "mockup.training",
      "mockup.battle",
      "mockup.mindDemon",
      "mockup.report",
      "mockup.daily",
      "mockup.rosterArtifacts",
      "mockup.mobile.world",
      "mockup.mobile.story",
      "mockup.mobile.training",
      "mockup.mobile.battle",
      "mockup.mobile.mindDemon",
      "mockup.mobile.report",
      "mockup.mobile.daily",
      "mockup.mobile.rosterArtifacts",
    "bg.world",
    "bg.battle",
    "bg.academyGate",
    "bg.training",
    "bg.demonCorridor",
    "bg.night",
    "bg.blackInk",
    "bg.daily",
    "bg.roster",
    "bg.chapter.law",
    "bg.chapter.psychology",
    "bg.chapter.design",
    "bg.chapter.ethics",
    "bg.chapter.classroom",
    "bg.chapter.child",
    "logo.academy",
    "standee.mingche",
      "standee.azhi",
      "standee.qinglan",
      "standee.xiaomo",
      "avatar.mingche",
      "avatar.azhi",
      "avatar.qinglan",
      "avatar.xiaomo",
      "demon.law",
      "demon.psych",
      "demon.design",
      "demon.ethics",
      "demon.classroom",
      "demon.child",
      "demon.mixed",
      "item.shuye",
      "item.xingsha",
      "item.moyu",
      "item.lingqian",
      "artifact.biling",
      "artifact.yanling",
      "artifact.zhiling",
      "artifact.moling",
      "node.normal",
      "node.elite",
      "node.recover",
      "node.treasure",
      "node.demon",
      "node.mystery",
      "node.resonance",
      "node.trial",
      "seal.locked",
      "seal.unlocked",
      "seal.glowing",
      "ink.mark",
      "ui.shell.hud.desktop.textless",
      "ui.shell.hud.mobile.textless",
      "ui.nav.desktop.textless",
      "ui.nav.mobile.textless",
      "ui.panels.parchment.sheet",
      "ui.panels.dark.sheet",
      "map.mockup.components.sheet",
      "story.mockup.components.sheet",
      "training.mockup.components.sheet",
      "battle.mockup.components.sheet",
      "mindDemon.mockup.components.sheet",
      "report.mockup.components.sheet",
      "daily.mockup.components.sheet",
      "roster.mockup.components.sheet",
      "characters.mockup.uiVariants.sheet",
      "items.mockup.iconSheet",
      "characters.mockup.mingche.bust",
      "characters.mockup.mingche.half",
      "characters.mockup.mingche.avatar",
      "characters.mockup.azhi.bust",
      "characters.mockup.azhi.half",
      "characters.mockup.azhi.avatar",
      "characters.mockup.qinglan.bust",
      "characters.mockup.qinglan.half",
      "characters.mockup.qinglan.avatar",
      "characters.mockup.xiaomo.bust",
      "characters.mockup.xiaomo.half",
      "characters.mockup.xiaomo.avatar",
      "items.mockup.currency.starSand",
      "items.mockup.currency.spiritPage",
      "items.mockup.material.inkJade",
      "items.mockup.artifact.heartToken",
      "items.mockup.artifact.lotusToken",
      "items.mockup.artifact.brush",
      "items.mockup.artifact.bell",
      "items.mockup.artifact.medallion",
      "items.mockup.artifact.mirror",
      "items.mockup.artifact.book",
      "items.mockup.reward.sparkBurst",
      "items.mockup.material.stone",
      "items.mockup.material.scroll",
      "items.mockup.reward.lotus",
      "items.mockup.rarity.common",
      "items.mockup.rarity.rare",
      "items.mockup.rarity.epic",
      "items.mockup.rarity.legendary",
      "items.mockup.reward.chestToken",
    ];

    assert.deepEqual(requiredAssetIds, expectedIds);
    assert.deepEqual(Object.keys(assetManifest).sort(), expectedIds.toSorted());
  });

  it("resolves project-local paths for required assets", () => {
    for (const id of requiredAssetIds) {
      const path = getAssetPath(id);
      assert.match(path, /^(\.\/)?(assets|docs)\//, `${id} should resolve to a project-local path`);
    }
  });

  it("has files for each required asset", () => {
    const missing = requiredAssetIds.filter((id) => !existsSync(resolve(getAssetPath(id).replace(/^\.\//, ""))));
    assert.deepEqual(missing, []);
  });
});
