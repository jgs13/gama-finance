import { readFile, writeFile } from "node:fs/promises";

const path = "android/app/src/main/AndroidManifest.xml";
let xml = await readFile(path, "utf8");
const permission = '  <uses-permission android:name="android.permission.RECORD_AUDIO" />\n';
if (!xml.includes('android.permission.RECORD_AUDIO')) {
  const marker = "<application";
  const i = xml.indexOf(marker);
  if (i < 0) throw new Error("AndroidManifest.xml não contém <application.");
  xml = xml.slice(0, i) + permission + xml.slice(i);
  await writeFile(path, xml);
}
console.log("Permissão de microfone habilitada para o assistente IA.");
