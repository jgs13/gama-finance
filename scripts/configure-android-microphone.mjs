import { readFile, writeFile } from "node:fs/promises";

const path = "android/app/src/main/AndroidManifest.xml";
let xml = await readFile(path, "utf8");
const permissions = [
  '  <uses-permission android:name="android.permission.RECORD_AUDIO" />\n',
  '  <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />\n'
];
for (const permission of permissions) {
  const name = permission.match(/android:name="([^"]+)"/)[1];
  if (!xml.includes(name)) {
    const marker = "<application";
    const i = xml.indexOf(marker);
    if (i < 0) throw new Error("AndroidManifest.xml não contém <application.");
    xml = xml.slice(0, i) + permission + xml.slice(i);
  }
}
await writeFile(path, xml);
console.log("Permissões RECORD_AUDIO e MODIFY_AUDIO_SETTINGS habilitadas para o assistente IA.");
