#!/usr/bin/env node
import config from "../src/config.js";
import { updateDeps } from "../src/updater.js";
import { runTests } from "../src/testRunner.js";
import {
  createBranch,
  commitAndPush,
  getStagedDiff,
  generateBranchName
} from "../src/git.js";

(async function () {
  const diff = await getStagedDiff();

  if (!diff.trim()) {
    console.log("⚠️ No staged changes to analyze.");
    process.exit(0);
  }

  const aiBranch = await generateBranchName(diff);
  const branchName = `depbot/${aiBranch}`;

  await createBranch(branchName, config.baseBranch);
  await updateDeps(config);

  if (config.runTests) {
    const passed = await runTests();
    if (!passed) {
      console.error("❌ Tests failed. Aborting push.");
      process.exit(1);
    }
  }

  await commitAndPush(null, branchName);
  console.log("✅ Dependencies updated and pushed!");
})();
