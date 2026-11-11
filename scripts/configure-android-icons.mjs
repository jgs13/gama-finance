import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = "android/app/src/main/res";
const files = {
  "drawable/ic_launcher_foreground.xml": `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:aapt="http://schemas.android.com/aapt"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="512"
    android:viewportHeight="512">
    <path android:pathData="M140,44 H372 A96,96 0 0 1 468,140 V372 A96,96 0 0 1 372,468 H140 A96,96 0 0 1 44,372 V140 A96,96 0 0 1 140,44 Z">
        <aapt:attr name="android:fillColor">
            <gradient android:type="linear" android:startX="44" android:startY="44" android:endX="468" android:endY="468">
                <item android:offset="0" android:color="#36d6c5"/>
                <item android:offset="1" android:color="#628cff"/>
            </gradient>
        </aapt:attr>
    </path>
    <path android:fillColor="#071018" android:pathData="M350,165c-27-24-58-36-98-36-84,0-144,56-144,135s60,135,144,135c40,0,75-12,102-37V252H254v58h35v28c-12,7-24,10-38,10-47,0-79-34-79-84s32-84,79-84c24,0,45,8,64,25z"/>
</vector>`,
  "drawable/ic_stat_gama.xml": `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="512"
    android:viewportHeight="512">
    <path android:fillColor="#FFFFFFFF" android:pathData="M350,165c-27-24-58-36-98-36-84,0-144,56-144,135s60,135,144,135c40,0,75-12,102-37V252H254v58h35v28c-12,7-24,10-38,10-47,0-79-34-79-84s32-84,79-84c24,0,45,8,64,25z"/>
</vector>`,
  "mipmap-anydpi/ic_launcher.xml": `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:aapt="http://schemas.android.com/aapt"
    android:width="512dp"
    android:height="512dp"
    android:viewportWidth="512"
    android:viewportHeight="512">
    <path android:pathData="M112,0 H400 A112,112 0 0 1 512,112 V400 A112,112 0 0 1 400,512 H112 A112,112 0 0 1 0,400 V112 A112,112 0 0 1 112,0 Z" android:fillColor="#080b12"/>
    <path android:pathData="M140,44 H372 A96,96 0 0 1 468,140 V372 A96,96 0 0 1 372,468 H140 A96,96 0 0 1 44,372 V140 A96,96 0 0 1 140,44 Z">
        <aapt:attr name="android:fillColor">
            <gradient android:type="linear" android:startX="0" android:startY="0" android:endX="512" android:endY="512">
                <item android:offset="0" android:color="#36d6c5"/>
                <item android:offset="1" android:color="#628cff"/>
            </gradient>
        </aapt:attr>
    </path>
    <path android:fillColor="#071018" android:pathData="M350,165c-27-24-58-36-98-36-84,0-144,56-144,135s60,135,144,135c40,0,75-12,102-37V252H254v58h35v28c-12,7-24,10-38,10-47,0-79-34-79-84s32-84,79-84c24,0,45,8,64,25z"/>
</vector>`,
  "mipmap-anydpi-v26/ic_launcher.xml": `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/gama_icon_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>`,
  "mipmap-anydpi/ic_launcher_round.xml": `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:aapt="http://schemas.android.com/aapt"
    android:width="512dp"
    android:height="512dp"
    android:viewportWidth="512"
    android:viewportHeight="512">
    <path android:pathData="M112,0 H400 A112,112 0 0 1 512,112 V400 A112,112 0 0 1 400,512 H112 A112,112 0 0 1 0,400 V112 A112,112 0 0 1 112,0 Z" android:fillColor="#080b12"/>
    <path android:pathData="M140,44 H372 A96,96 0 0 1 468,140 V372 A96,96 0 0 1 372,468 H140 A96,96 0 0 1 44,372 V140 A96,96 0 0 1 140,44 Z">
        <aapt:attr name="android:fillColor">
            <gradient android:type="linear" android:startX="0" android:startY="0" android:endX="512" android:endY="512">
                <item android:offset="0" android:color="#36d6c5"/>
                <item android:offset="1" android:color="#628cff"/>
            </gradient>
        </aapt:attr>
    </path>
    <path android:fillColor="#071018" android:pathData="M350,165c-27-24-58-36-98-36-84,0-144,56-144,135s60,135,144,135c40,0,75-12,102-37V252H254v58h35v28c-12,7-24,10-38,10-47,0-79-34-79-84s32-84,79-84c24,0,45,8,64,25z"/>
</vector>`,
  "mipmap-anydpi-v26/ic_launcher_round.xml": `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/gama_icon_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>`,
  "values/gama_icon_colors.xml": `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="gama_icon_background">#080b12</color>
</resources>`
};
for (const [path, content] of Object.entries(files)) {
  const fullPath = `${root}/${path}`;
  await mkdir(fullPath.slice(0, fullPath.lastIndexOf("/")), { recursive: true });
  await writeFile(fullPath, content + "\n", "utf8");
}
const launcherFallbackPath = `${root}/mipmap-anydpi`;
await mkdir(launcherFallbackPath, { recursive: true });
const manifestPath = "android/app/src/main/AndroidManifest.xml";
let manifest = await readFile(manifestPath, "utf8");
manifest = manifest.replace(/<application\b[^>]*>/, (tag) => {
  let updated = tag;
  if (/\bandroid:icon=/.test(updated)) {
    updated = updated.replace(/android:icon="[^"]*"/, 'android:icon="@mipmap/ic_launcher"');
  } else {
    updated = updated.replace(/>$/, ' android:icon="@mipmap/ic_launcher">');
  }
  if (/\bandroid:roundIcon=/.test(updated)) {
    updated = updated.replace(/android:roundIcon="[^"]*"/, 'android:roundIcon="@mipmap/ic_launcher_round"');
  } else {
    updated = updated.replace(/>$/, ' android:roundIcon="@mipmap/ic_launcher_round">');
  }
  return updated;
});
if (!manifest.includes("com.google.firebase.messaging.default_notification_icon")) {
  manifest = manifest.replace(
    "</application>",
    '        <meta-data android:name="com.google.firebase.messaging.default_notification_icon" android:resource="@drawable/ic_stat_gama" />\n    </application>'
  );
}
await writeFile(manifestPath, manifest, "utf8");
console.log("GAMA FINANCE launcher and monochrome notification icons configured.");
