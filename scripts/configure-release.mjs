import { readFile, writeFile } from "node:fs/promises";

const version = process.env.RELEASE_VERSION;
const versionCode = Number(process.env.RELEASE_VERSION_CODE);
if (!/^\d+\.\d+\.\d+$/.test(version || "")) throw new Error("RELEASE_VERSION must be semver, e.g. 1.0.1");
if (!Number.isInteger(versionCode) || versionCode < 1) throw new Error("RELEASE_VERSION_CODE must be a positive integer");

const htmlPath = "index.html";
let html = await readFile(htmlPath, "utf8");
html = html.replace(/const APP_VERSION='[^']+';/, `const APP_VERSION='${version}';`);
if (!html.includes(`const APP_VERSION='${version}';`)) throw new Error("APP_VERSION marker not found");
await writeFile(htmlPath, html);

const gradlePath = "android/app/build.gradle";
let gradle = await readFile(gradlePath, "utf8");
if (!gradle.includes("signingConfigs")) {
  gradle = gradle.replace(/android\s*\{/, `android {
    signingConfigs {
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_FILE"))
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }
    }
`);
}
const releaseBlock = /buildTypes\s*\{\s*release\s*\{/;
if (!releaseBlock.test(gradle)) throw new Error("Could not locate Android release buildType");
gradle = gradle.replace(releaseBlock, match => match + "\n            signingConfig signingConfigs.release");
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
gradle = gradle.replace(/versionName\s+["'][^"']+["']/, `versionName "${version}"`);
await writeFile(gradlePath, gradle);
console.log(`Configured signed GAMA FINANCE release ${version} (versionCode ${versionCode}).`);
