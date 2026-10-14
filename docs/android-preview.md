# Android preview APK

The `preview` profile creates an installable APK named **SafarWise Preview** with package `com.fueltrippk.preview`. It has separate storage from Expo Go and any future production app. Export a backup from the existing app and import it into the preview if you want the same trips and settings.

## Expo cloud build

```sh
npx --yes eas-cli@latest whoami
npx --yes eas-cli@latest account:usage asadabbasbusiness --non-interactive
npx --yes eas-cli@latest build --platform android --profile preview
```

Use only the account's available free Android allowance. The profile uses medium workers; no paid plan, store submission, EAS Update subscription, or paid runtime service is required. If the free allowance runs out, wait for its reset or use the local build path. Do not upgrade the account automatically.

The preview uses the generated Android template's debug signing configuration with a release JS bundle. `withoutCredentials` avoids creating or using production signing credentials. This is a testing artifact, not an app-store release. Install the APK from its successful EAS build page; it runs without Metro or Expo Go. A pending build or successful JavaScript export is not proof that an APK was produced.

Generated `android/`, local environment files, caches, keystores, and credentials are excluded by `.gitignore`, which EAS uses for its upload archive. The server generates its own native project from the committed config and preview environment.

## Free local alternative

Install Android Studio with its SDK and compatible bundled JDK, and configure `JAVA_HOME` and `ANDROID_HOME`. SDK installation and license acceptance belong to the computer owner. No local SDK/JDK was available during the 15 October 2026 audit.

From the repository in Git Bash:

```sh
npm ci
npm run android:preview:prepare
cd android
./gradlew :app:assembleRelease
cd ..
```

Open the generated Android project in Android Studio to resolve SDK setup first if needed. The APK is generated at `android/app/build/outputs/apk/release/app-release.apk`. Gradle compilation has not been verified on this PC without the toolchain.

The prepare script refuses to overwrite a native project with a different application ID. It preserves the existing Expo Go start scripts. Generated native files remain ignored and are not production configuration.

Before any public/store build, select the permanent application ID, configure private release signing, finish the release checklist, and review unresolved dependency advisories. Never reuse the preview debug key for store distribution.

References: [Expo APK builds](https://docs.expo.dev/build-reference/apk/), [EAS configuration](https://docs.expo.dev/eas/json/), [local compilation](https://docs.expo.dev/guides/local-app-development/).
