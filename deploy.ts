import { execSync } from "child_process";

function runCommand(command: string) {
  console.log(`\nRunning: ${command}`);
  try {
    const output = execSync(command, { stdio: "inherit" });
  } catch (error) {
    console.error(`Failed to run: ${command}`);
    process.exit(1);
  }
}

function main() {
  runCommand("git pull");
  runCommand("npm install");
  runCommand("npx prisma generate");
  runCommand("npx prisma db push");
  runCommand("npm run build");
  runCommand("pm2 restart nestjs");
}

main();
