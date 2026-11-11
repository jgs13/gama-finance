import { mkdir, writeFile } from "node:fs/promises";

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
    <path android:fillColor="#071018" android:pathData="M350,165 C323,141 292,129 252,129 C168,129 108,185 108,264 C108,343 168,399 252,399 C292,399 327,387 354,362 V252 H254 V310 H289 V338 C277,345 265,348 251,348 C204,348 172,314 172,264 C172,214 204,180 251,180 C275,180 296,188 315,205 Z"/>
</vector>`,
  "drawable/ic_stat_gama.xml": `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="512"
    android:viewportHeight="512">
    <path android:fillColor="#FFFFFFFF" android:pathData="M350,165 C323,141 292,129 252,129 C168,129 108,185 108,264 C108,343 168,399 252,399 C292,399 327,387 354,362 V252 H254 V310 H289 V338 C277,345 265,348 251,348 C204,348 172,314 172,264 C172,214 204,180 251,180 C275,180 296,188 315,205 Z"/>
</vector>`,
  "mipmap-anydpi-v26/ic_launcher.xml": `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/gama_icon_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>`,
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
  await writeFile(fullPath, content + "\\n", "utf8");
}
console.log("GAMA FINANCE launcher and monochrome notification icons configured.");
