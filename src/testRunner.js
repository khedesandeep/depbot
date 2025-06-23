import { execaCommand } from "execa";


export async function runTests() {
  try {
    await execaCommand("npm test", { stdio: "inherit" });
    return true;
  } catch {
    return false;
  }
}
