import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = "android/app/src/main/res";
const logo = `<path android:pathData="M256,58 C145,58 65,140 65,256 C65,372 145,454 256,454 C331,454 391,420 426,361 L426,246 L257,246 L257,309 L355,309 C337,360 301,391 256,391 C177,391 130,333 130,256 C130,179 178,121 256,121 C302,121 338,139 367,174 L414,127 C374,82 321,58 256,58 Z">
        <aapt:attr name="android:fillColor"><gradient android:type="linear" android:startX="75" android:startY="100" android:endX="435" android:endY="430"><item android:offset="0" android:color="#36D6C5"/><item android:offset="1" android:color="#245BFF"/></gradient></aapt:attr>
    </path>
    <path android:fillColor="#B8FF45" android:pathData="M155,325 H204 V379 H155 Z"/>
    <path android:fillColor="#20E5B5" android:pathData="M218,288 H267 V379 H218 Z"/>
    <path android:fillColor="#16B9F5" android:pathData="M281,247 H330 V379 H281 Z"/>
    <path android:fillColor="#246BFF" android:pathData="M344,205 H393 V379 H344 Z"/>
    <path android:pathData="M137,354 C210,350 268,310 342,249 L389,210 L369,207 L405,177 L411,227 L397,215 C315,291 244,351 151,382 Z">
        <aapt:attr name="android:fillColor"><gradient android:type="linear" android:startX="145" android:startY="360" android:endX="410" android:endY="200"><item android:offset="0" android:color="#19E7B8"/><item android:offset="1" android:color="#C4FF48"/></gradient></aapt:attr>
    </path>`;
const fallback = `<path android:fillColor="#080B12" android:pathData="M112,0 H400 A112,112 0 0 1 512,112 V400 A112,112 0 0 1 400,512 H112 A112,112 0 0 1 0,400 V112 A112,112 0 0 1 112,0 Z"/><path android:pathData="M256,58 C145,58 65,140 65,256 C65,372 145,454 256,454 C331,454 391,420 426,361 L426,246 L257,246 L257,309 L355,309 C337,360 301,391 256,391 C177,391 130,333 130,256 C130,179 178,121 256,121 C302,121 338,139 367,174 L414,127 C374,82 321,58 256,58 Z">
        <aapt:attr name="android:fillColor"><gradient android:type="linear" android:startX="75" android:startY="100" android:endX="435" android:endY="430"><item android:offset="0" android:color="#36D6C5"/><item android:offset="1" android:color="#245BFF"/></gradient></aapt:attr>
    </path>
    <path android:fillColor="#B8FF45" android:pathData="M155,325 H204 V379 H155 Z"/>
    <path android:fillColor="#20E5B5" android:pathData="M218,288 H267 V379 H218 Z"/>
    <path android:fillColor="#16B9F5" android:pathData="M281,247 H330 V379 H281 Z"/>
    <path android:fillColor="#246BFF" android:pathData="M344,205 H393 V379 H344 Z"/>
    <path android:pathData="M137,354 C210,350 268,310 342,249 L389,210 L369,207 L405,177 L411,227 L397,215 C315,291 244,351 151,382 Z">
        <aapt:attr name="android:fillColor"><gradient android:type="linear" android:startX="145" android:startY="360" android:endX="410" android:endY="200"><item android:offset="0" android:color="#19E7B8"/><item android:offset="1" android:color="#C4FF48"/></gradient></aapt:attr>
    </path>`;
const vector = (width, height, body) => `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:aapt="http://schemas.android.com/aapt"
    android:width="${width}" android:height="${height}"
    android:viewportWidth="512" android:viewportHeight="512">
${body}
</vector>`;
const files = {
  "drawable/ic_launcher_foreground.xml": vector("108dp", "108dp", logo),
  "drawable/ic_stat_gama.xml": vector("24dp", "24dp", '<path android:fillColor="#FFFFFFFF" android:pathData="M256,58 C145,58 65,140 65,256 C65,372 145,454 256,454 C331,454 391,420 426,361 L426,246 L257,246 L257,309 L355,309 C337,360 301,391 256,391 C177,391 130,333 130,256 C130,179 178,121 256,121 C302,121 338,139 367,174 L414,127 C374,82 321,58 256,58 Z"/>'),
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
const manifestPath = "android/app/src/main/AndroidManifest.xml";
let manifest = await readFile(manifestPath, "utf8");
manifest = manifest.replace(/<application\b[^>]*>/, tag => {
  let updated = tag.replace(/android:icon="[^"]*"/, 'android:icon="@mipmap/ic_launcher"');
  updated = updated.replace(/android:roundIcon="[^"]*"/, 'android:roundIcon="@mipmap/ic_launcher_round"');
  return updated;
});
if (!manifest.includes("com.google.firebase.messaging.default_notification_icon")) {
  manifest = manifest.replace("</application>", '        <meta-data android:name="com.google.firebase.messaging.default_notification_icon" android:resource="@drawable/ic_stat_gama" />\n    </application>');
}
await writeFile(manifestPath, manifest, "utf8");
console.log("GAMA FINANCE G + financial growth launcher icon configured.");
