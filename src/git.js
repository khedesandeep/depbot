import simpleGit from "simple-git";
import { execSync } from "child_process";
import fetch from "node-fetch"; // Ensure: npm install node-fetch@2

const git = simpleGit();

// 🔐 DeepSeek API Key (use env var or secret in prod)
const DEEPSEEK_API_KEY = "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";

// 📄 Get staged git diff
export async function getStagedDiff() {
  try {
    return execSync("git diff --cached", { encoding: "utf-8" });
  } catch (err) {
    console.error("❌ Could not get git diff:", err.message);
    return "";
  }
}

// 🧠 Generate AI-based branch name
export async function generateBranchName(diff) {
  console.log(`🔍 Generating branch name for diff:\n${diff}\n`);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1:free",
        messages: [
          {
            role: "system",
            content: "You're an AI that generates short, kebab-case Git branch names based on git diffs. Avoid punctuation and make it relevant to the change."
          },
          {
            role: "user",
            content: `Here is the git diff:\n\n${diff}\n\nGive a 2-4 word kebab-case branch name, e.g., 'update-eslint', 'fix-deps-typo'.`
          }
        ]
      })
    });

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content?.trim().split("\n")[0] || "";
    const sanitized = raw
      .toLowerCase()
      .replace(/[^a-z0-9\-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const finalName = sanitized || `ai-branch-${Date.now()}`;
    console.log(`🌿 Suggested branch name: ${finalName}`);
    return finalName;
  } catch (err) {
    console.error("⚠️ Failed to generate branch name:", err.message);
    return `ai-branch-${Date.now()}`;
  }
}

// 🧠 Generate AI commit message
async function generateCommitMessage(diff) {
  console.log(`🔍 Generating commit message for diff:\n${diff}\n`);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1:free",
        messages: [
          {
            role: "system",
            content: "You're an AI that generates concise, conventional commit messages based on git diffs."
          },
          {
            role: "user",
            content: `Here is the git diff:\n\n${diff}\n\nGive a one-line conventional commit message.`
          }
        ]
      })
    });

    const data = await response.json();
    const message = data?.choices?.[0]?.message?.content?.trim().split("\n")[0];
    console.log(`💬 Commit message: "${message}"`);
    return message || "chore: update";
  } catch (err) {
    console.error("⚠️ Failed to generate commit message:", err.message);
    return "chore: update";
  }
}

// 🌿 Create a new branch from base
export async function createBranch(branchName, baseBranch = "main") {
  try {
    const branches = await git.branchLocal();

    if (!branches.all.includes(baseBranch)) {
      console.error(`❌ Base branch '${baseBranch}' not found.`);
      process.exit(1);
    }

    console.log(`📌 Checking out '${baseBranch}'`);
    await git.checkout(baseBranch);

    console.log(`🌱 Creating new branch '${branchName}'`);
    await git.checkoutLocalBranch(branchName);
  } catch (err) {
    console.error("🚫 Git branch creation failed:", err.message);
    process.exit(1);
  }
}

// ✅ Commit staged changes and push
export async function commitAndPush(_, branchName) {
  await git.add(".");
  const diff = await getStagedDiff();
  const message = await generateCommitMessage(diff);

  await git.commit(message);

  try {
    await git.push("origin", branchName);
  } catch {
    console.log("ℹ️ Pushing with --set-upstream");
    await git.push(["--set-upstream", "origin", branchName]);
  }

  console.log(`🚀 Committed and pushed to '${branchName}' with message: "${message}"`);
}
