import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";

const root = "android/app/src/main/res";
const gPath = "M350,165c-27-24-58-36-98-36-84,0-144,56-144,135s60,135,144,135c40,0,75-12,102-37V252H254v58h35v28c-12,7-24,10-38,10-47,0-79-34-79-84s32-84,79-84c24,0,45,8,64,25z";
const logo = `<path android:pathData="${gPath}">
        <aapt:attr name="android:fillColor"><gradient android:type="linear" android:startX="120" android:startY="120" android:endX="390" android:endY="390"><item android:offset="0" android:color="#36D6C5"/><item android:offset="1" android:color="#628CFF"/></gradient></aapt:attr>
    </path>
    <path android:fillColor="#080B12" android:pathData="M292,270 h34 v92 h-34 z M340,238 h34 v124 h-34 z M388,202 h28 v160 h-28 z"/>
    <path android:fillColor="#FFFFFF" android:pathData="M292,258 L402,148 L402,190 L446,128 L364,140 L384,158 L274,268 Z"/>`;
const fallback = `<path android:fillColor="#000000" android:pathData="M112,0 H400 A112,112 0 0 1 512,112 V400 A112,112 0 0 1 400,512 H112 A112,112 0 0 1 0,400 V112 A112,112 0 0 1 112,0 Z"/>
    ${logo}`;
const vector = (width, height, body) => `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:aapt="http://schemas.android.com/aapt"
    android:width="${width}" android:height="${height}"
    android:viewportWidth="512" android:viewportHeight="512">
${body}
</vector>`;
const files = {
  "drawable/ic_launcher_foreground.xml": vector("108dp", "108dp", logo),
  "drawable/ic_stat_gama.xml": vector("24dp", "24dp", `<path android:fillColor="#00000000" android:strokeColor="#FFFFFFFF" android:strokeWidth="12" android:strokeLineCap="round" android:strokeLineJoin="round" android:pathData="${gPath}"/>`),
  "mipmap-anydpi/ic_launcher.xml": vector("512dp", "512dp", fallback),
  "mipmap-anydpi/ic_launcher_round.xml": vector("512dp", "512dp", fallback),
  "mipmap-anydpi-v26/ic_launcher.xml": `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/gama_icon_background"/><foreground android:drawable="@drawable/ic_launcher_foreground"/></adaptive-icon>`,
  "mipmap-anydpi-v26/ic_launcher_round.xml": `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/gama_icon_background"/><foreground android:drawable="@drawable/ic_launcher_foreground"/></adaptive-icon>`,
  "values/gama_icon_colors.xml": `<?xml version="1.0" encoding="utf-8"?><resources><color name="gama_icon_background">#080B12</color></resources>`
};
for (const [path, body] of Object.entries(files)) {
  const fullPath = `${root}/${path}`;
  await mkdir(fullPath.slice(0, fullPath.lastIndexOf("/")), { recursive: true });
  await writeFile(fullPath, body + "\n", "utf8");
}

// Remove os PNGs padrão criados pelo Capacitor. Eles podem continuar sendo
// escolhidos pelo Android no lugar do vetor oficial do GAMA FINANCE.
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isDirectory() || !entry.name.startsWith("mipmap-") || entry.name === "mipmap-anydpi" || entry.name === "mipmap-anydpi-v26") continue;
  const dir = `${root}/${entry.name}`;
  for (const name of await readdir(dir)) {
    if (/^ic_launcher(?:_round|_foreground)?\.(?:png|webp)$/i.test(name)) {
      await unlink(`${dir}/${name}`);
    }
  }
}
const manifestPath = "android/app/src/main/AndroidManifest.xml";
let manifest = await readFile(manifestPath, "utf8");
manifest = manifest.replace(/<application\b[^>]*>/, tag => {
  let updated = tag;
  if (/\bandroid:icon="/.test(updated)) updated = updated.replace(/android:icon="[^"]*"/, 'android:icon="@mipmap/ic_launcher"');
  else updated = updated.replace(/>$/, ' android:icon="@mipmap/ic_launcher">');
  if (/\bandroid:roundIcon="/.test(updated)) updated = updated.replace(/android:roundIcon="[^"]*"/, 'android:roundIcon="@mipmap/ic_launcher_round"');
  else updated = updated.replace(/>$/, ' android:roundIcon="@mipmap/ic_launcher_round">');
  return updated;
});
if (!/android:icon="@mipmap\/ic_launcher"/.test(manifest)) throw new Error("Manifesto Android não aponta para o ícone oficial");
if (!/android:roundIcon="@mipmap\/ic_launcher_round"/.test(manifest)) throw new Error("Manifesto Android não aponta para o ícone redondo oficial");
const launcherFiles = [];
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  for (const name of await readdir(`${root}/${entry.name}`)) {
    if (/^ic_launcher(?:_round|_foreground)?\.(?:png|webp)$/i.test(name)) launcherFiles.push(`${entry.name}/${name}`);
  }
}
if (launcherFiles.length) throw new Error(`Ícones padrão antigos ainda presentes: ${launcherFiles.join(", ")}`);
console.log("Manifest launcher:", manifest.match(/<application\b[^>]*>/)?.[0]);
console.log("Launcher icon resources:", (await readdir(root)).filter(name => name.startsWith("mipmap-")).join(", "));
if (!manifest.includes("com.google.firebase.messaging.default_notification_icon")) {
  manifest = manifest.replace("</application>", '        <meta-data android:name="com.google.firebase.messaging.default_notification_icon" android:resource="@drawable/ic_stat_gama" />\n    </application>');
}
await writeFile(manifestPath, manifest, "utf8");
console.log("GAMA FINANCE Finance G launcher icon and transparent white-outline notification G configured.");
