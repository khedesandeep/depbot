import { execaCommand } from "execa";

export async function updateDeps(config) {
  const { include, onlyMinor } = config;
  for (const pkg of include) {
    const command = onlyMinor
      ? `npm install ${pkg}@latest --save-exact --save`
      : `npm install ${pkg}@latest`;

    try {
      console.log(`Updating ${pkg}...`);
      await execaCommand(command, { stdio: "inherit" });
    } catch (err) {
      console.error(`Failed to update ${pkg}:`, err.message);
    }
  }
}
