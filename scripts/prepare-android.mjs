import { cp, mkdir, rm } from "node:fs/promises";

const files = ["index.html", "manifest.json", "sw.js", "icon.svg", "app-version.json", "native-notifications.js"];
await rm("www", { recursive: true, force: true });
await mkdir("www", { recursive: true });
for (const file of files) {
  await cp(file, `www/${file}`);
}
await cp("assets", "www/assets", { recursive: true });
console.log("Android web bundle prepared in www/");
