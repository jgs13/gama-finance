import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";

const root = "android/app/src/main/res";
const gPath = "M350,165c-27-24-58-36-98-36-84,0-144,56-144,135s60,135 144,135c40,0,75-12,102-37V252H254v58h35v28c-12,7-24,10-38,10-47,0-79-34-79-84s32-84 79-84c24,0,45,8,64,25z";
const dPath = "M160 126h91c94 0 151 49 151 130S345 386 251 386h-91V126zm77 66v128h15c48 0 73-21 73-64s-25-64-73-64h-15z";
// Reproduz o icon.svg da versão web: moldura escura, fundo verde-limão e letra D.
const brandBackground = '<path android:fillColor="#0a0a0c" android:pathData="M0,0 H512 V512 H0 Z"/>';
const brandTile = '<path android:fillColor="#d4ff1f" android:pathData="M148,44 H364 C421.4,44 468,90.6 468,148 V364 C468,421.4 421.4,468 364,468 H148 C90.6,468 44,421.4 44,364 V148 C44,90.6 90.6,44 148,44 Z"/>';
const brandLetter = `<path android:fillColor="#0a0a0c" android:pathData="${dPath}"/>`;
const logo = `${brandTile}
    ${brandLetter}`;
const fallback = `${brandBackground}
    ${logo}`;
const vector = (width, height, body) => `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:aapt="http://schemas.android.com/aapt"
    android:width="${width}" android:height="${height}"
    android:viewportWidth="512" android:viewportHeight="512">
${body}
</vector>`;
const files = {
  "drawable/gama_launcher_foreground.xml": vector("108dp", "108dp", logo),
  "drawable/ic_stat_gama.xml": vector("24dp", "24dp", `<path android:fillColor="#00000000" android:strokeColor="#FFFFFFFF" android:strokeWidth="12" android:strokeLineCap="round" android:strokeLineJoin="round" android:pathData="${gPath}"/>`),
  "mipmap-anydpi/gama_launcher.xml": vector("512dp", "512dp", fallback),
  "mipmap-anydpi/gama_launcher_round.xml": vector("512dp", "512dp", fallback),
  "mipmap-anydpi-v26/gama_launcher.xml": `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/gama_icon_background"/><foreground android:drawable="@drawable/gama_launcher_foreground"/></adaptive-icon>`,
  "mipmap-anydpi-v26/gama_launcher_round.xml": `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/gama_icon_background"/><foreground android:drawable="@drawable/gama_launcher_foreground"/></adaptive-icon>`,
  "values/gama_icon_colors.xml": `<?xml version="1.0" encoding="utf-8"?><resources><color name="gama_icon_background">#0a0a0c</color></resources>`
};

for (const [path, body] of Object.entries(files)) {
  if (body.includes("\\n")) throw new Error(`Quebra de linha escapada inválida no XML: ${path}`);
  const fullPath = `${root}/${path}`;
  await mkdir(fullPath.slice(0, fullPath.lastIndexOf("/")), { recursive: true });
  await writeFile(fullPath, body + "\n", "utf8");
}

// Remove todos os recursos de launcher genéricos criados pelo Capacitor.
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const dir = `${root}/${entry.name}`;
  for (const name of await readdir(dir)) {
    if (/^ic_launcher(?:_round|_foreground)?(?:\.(?:png|webp|xml))?$/i.test(name)) {
      await unlink(`${dir}/${name}`);
    }
  }
}

const manifestPath = "android/app/src/main/AndroidManifest.xml";
let manifest = await readFile(manifestPath, "utf8");

// Permissões Android para recursos que dependem da localização do aparelho.
const locationPermissions = [
  "android.permission.ACCESS_COARSE_LOCATION",
  "android.permission.ACCESS_FINE_LOCATION"
];
for (const permission of locationPermissions) {
  if (!manifest.includes(`android:name="${permission}"`)) {
    manifest = manifest.replace(/<manifest\b[^>]*>/, tag => `${tag}\n    <uses-permission android:name="${permission}" />`);
  }
}
manifest = manifest.replace(/<application\b[^>]*>/, tag => {
  let updated = tag;
  updated = /\bandroid:icon="/.test(updated)
    ? updated.replace(/android:icon="[^"]*"/, 'android:icon="@mipmap/gama_launcher"')
    : updated.replace(/>$/, ' android:icon="@mipmap/gama_launcher">');
  updated = /\bandroid:roundIcon="/.test(updated)
    ? updated.replace(/android:roundIcon="[^"]*"/, 'android:roundIcon="@mipmap/gama_launcher_round"')
    : updated.replace(/>$/, ' android:roundIcon="@mipmap/gama_launcher_round">');
  return updated;
});
if (!manifest.includes('android:icon="@mipmap/gama_launcher"')) throw new Error("Manifesto não aponta para o launcher exclusivo do GAMA");
if (!manifest.includes('android:roundIcon="@mipmap/gama_launcher_round"')) throw new Error("Manifesto não aponta para o launcher redondo exclusivo do GAMA");
if (!manifest.includes("com.google.firebase.messaging.default_notification_icon")) {
  manifest = manifest.replace("</application>", '        <meta-data android:name="com.google.firebase.messaging.default_notification_icon" android:resource="@drawable/ic_stat_gama" />\n    </application>');
}
await writeFile(manifestPath, manifest, "utf8");

const leftovers = [];
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  for (const name of await readdir(`${root}/${entry.name}`)) {
    if (/^ic_launcher(?:_round|_foreground)(?:\.(?:png|webp|xml))?$/i.test(name)) leftovers.push(`${entry.name}/${name}`);
  }
}
if (leftovers.length) throw new Error(`Recursos de launcher genéricos ainda presentes: ${leftovers.join(", ")}`);
console.log("GAMA launcher resources:", Object.keys(files).join(", "));
console.log("Manifest launcher:", manifest.match(/<application\b[^>]*>/)?.[0]);
