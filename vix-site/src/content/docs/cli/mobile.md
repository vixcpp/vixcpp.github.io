# vix mobile

`vix mobile` creates and runs a mobile shell for a Vix web or PWA application.

It is designed for apps that already expose a web interface, then need to be opened inside a mobile WebView.

```bash id="m2c9pa"
vix mobile init android --name "My App" --url https://example.com
```

The current mobile target is Android.

## Overview

`vix mobile` helps turn a Vix web app into a mobile app shell.

It can:

- generate an Android WebView project
- build the Android app
- install and launch it on a device
- generate a Gradle wrapper
- list connected Android devices

The generated Android app opens the URL you provide.

```txt id="kfjw90"
Vix web app or PWA -> Android WebView shell
```

The mobile command does not embed the Vix C++ runtime yet. Your Vix app still runs as a web application, and the Android shell opens it through WebView.

## Usage

```bash id="a7qewn"
vix mobile init android [options]
vix mobile android [options]
vix mobile build android [options]
vix mobile run android [options]
vix mobile wrapper android [options]
vix mobile devices
```

The short form:

```bash id="kc2ypu"
vix mobile android --name "My App" --url https://example.com
```

is equivalent to:

```bash id="y7ykvu"
vix mobile init android --name "My App" --url https://example.com
```

## Create an Android mobile shell

```bash id="zntks8"
vix mobile init android \
  --name "Softadastra" \
  --package com.softadastra.app \
  --url https://softadastra.com
```

This creates an Android project in:

```txt id="gvf44c"
mobile/android
```

Use a custom output directory:

```bash id="phuymr"
vix mobile init android \
  --name "Softadastra" \
  --package com.softadastra.app \
  --url https://softadastra.com \
  --output apps/android
```

## Local development URL

For local testing, use the IP address reachable from the phone or emulator.

```bash id="q3y2kb"
vix mobile init android \
  --name "Vix UI Demo" \
  --package com.vixcpp.demo \
  --url http://192.168.1.10:8080 \
  --allow-cleartext
```

Android blocks plain `http://` traffic by default. Use `--allow-cleartext` for local HTTP development.

For production, prefer HTTPS:

```bash id="gp1fbs"
vix mobile init android \
  --name "My App" \
  --package com.example.app \
  --url https://example.com
```

## Build the Android app

```bash id="q0kqjz"
vix mobile build android
```

By default, Vix looks for the Android project in:

```txt id="uk8j7s"
mobile/android
```

Use a custom project directory:

```bash id="wkz0ew"
vix mobile build android --project apps/android
```

Build a debug APK:

```bash id="u3zh43"
vix mobile build android --debug
```

Build a release APK:

```bash id="eqbc86"
vix mobile build android --release
```

When the build succeeds, the APK is written under the Android build output directory.

Debug output:

```txt id="be610c"
app/build/outputs/apk/debug
```

Release output:

```txt id="up602q"
app/build/outputs/apk/release
```

## Run on Android

```bash id="gml6kw"
vix mobile run android
```

This builds, installs, and launches the Android app on a connected device or emulator.

Use a custom project directory:

```bash id="frpfhp"
vix mobile run android --project apps/android
```

Use a specific package name:

```bash id="yhz7ga"
vix mobile run android \
  --project apps/android \
  --package com.softadastra.app
```

Run without installing first:

```bash id="nu61wu"
vix mobile run android --no-install
```

Use release variant:

```bash id="t1rm4n"
vix mobile run android --release
```

## List connected devices

```bash id="f046o2"
vix mobile devices
```

This uses `adb devices`.

Use it before `vix mobile run android` to confirm that an emulator or phone is connected.

## Generate the Gradle wrapper

```bash id="v1ycrr"
vix mobile wrapper android
```

Use a specific Gradle version:

```bash id="w4298c"
vix mobile wrapper android --gradle-version 8.14.4
```

Use the full Gradle distribution:

```bash id="znxh1d"
vix mobile wrapper android --distribution-type all
```

Regenerate the wrapper even if it already exists:

```bash id="pj298u"
vix mobile wrapper android --force
```

## Android init options

| Option                       | Description                                        |
| ---------------------------- | -------------------------------------------------- |
| `--name <name>`              | App display name                                   |
| `--url <url>`                | Web or PWA URL opened by the Android app           |
| `--package <name>`           | Android package name. Default: `com.vixcpp.mobile` |
| `--output <dir>`, `-o <dir>` | Output directory. Default: `mobile/android`        |
| `--min-sdk <n>`              | Minimum Android SDK. Default: `23`                 |
| `--target-sdk <n>`           | Target Android SDK. Default: `36`                  |
| `--compile-sdk <n>`          | Compile Android SDK. Default: `36`                 |
| `--version-code <n>`         | Android version code. Default: `1`                 |
| `--version-name <name>`      | Android version name. Default: `1.0.0`             |
| `--agp <version>`            | Android Gradle Plugin version. Default: `8.13.2`   |
| `--allow-cleartext`          | Allow `http://` traffic                            |
| `--no-cleartext`             | Disable cleartext HTTP traffic                     |
| `--force`                    | Allow writing into a non-empty output directory    |

## Build and run options

| Option               | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `--project <dir>`    | Android project directory. Default: `mobile/android` |
| `--package <name>`   | Android package name used when launching             |
| `--debug`            | Build or install the debug variant                   |
| `--release`          | Build or install the release variant                 |
| `--gradle <command>` | Gradle command to use                                |
| `--no-install`       | Launch without installing first                      |

## Wrapper options

| Option                       | Description                                          |
| ---------------------------- | ---------------------------------------------------- |
| `--project <dir>`            | Android project directory. Default: `mobile/android` |
| `--gradle <command>`         | Gradle command used to create the wrapper            |
| `--gradle-version <version>` | Gradle wrapper version. Default: `8.14.4`            |
| `--distribution-type <type>` | Wrapper distribution type: `bin` or `all`            |
| `--force`                    | Regenerate the wrapper if it already exists          |

## Output options

| Option          | Description                             |
| --------------- | --------------------------------------- |
| `--quiet`, `-q` | Only print errors                       |
| `--json`        | Print machine-readable lifecycle events |
| `--no-color`    | Disable ANSI colors                     |

Vix also respects:

```txt id="a65o6j"
NO_COLOR
FORCE_COLOR
```

## Generated Android project

A generated Android shell contains a normal Android app structure.

```txt id="z1yevp"
mobile/android/
  settings.gradle
  build.gradle
  gradle.properties
  local.properties
  README.md
  app/
    build.gradle
    src/main/
      AndroidManifest.xml
      java/<package>/MainActivity.java
      res/values/
        strings.xml
        colors.xml
        styles.xml
```

`local.properties` is created automatically when Vix can detect the Android SDK.

The generated `MainActivity` opens the configured app URL in WebView.

## Common workflows

Create an Android shell for a production site:

```bash id="isz03d"
vix mobile init android \
  --name "Softadastra" \
  --package com.softadastra.app \
  --url https://softadastra.com
```

Create an Android shell for local development:

```bash id="ypn7p1"
vix mobile init android \
  --name "Vix Local" \
  --package com.vixcpp.local \
  --url http://192.168.1.10:8080 \
  --allow-cleartext
```

Generate the Gradle wrapper:

```bash id="jr9lq6"
vix mobile wrapper android
```

Build the debug APK:

```bash id="v4jxxi"
vix mobile build android
```

Install and launch:

```bash id="r5bog1"
vix mobile run android
```

Check connected devices:

```bash id="d5ukel"
vix mobile devices
```

## Common mistakes

### Using localhost on a real phone

Wrong for a real device:

```bash id="hnyxny"
vix mobile init android --name "My App" --url http://127.0.0.1:8080
```

On a phone, `127.0.0.1` points to the phone itself, not your computer.

Use your computer LAN IP:

```bash id="m0hpqs"
vix mobile init android \
  --name "My App" \
  --url http://192.168.1.10:8080 \
  --allow-cleartext
```

### Forgetting cleartext for local HTTP

Wrong for local HTTP:

```bash id="vh8fkg"
vix mobile init android --name "My App" --url http://192.168.1.10:8080
```

Correct:

```bash id="hbdn77"
vix mobile init android \
  --name "My App" \
  --url http://192.168.1.10:8080 \
  --allow-cleartext
```

### Using an invalid package name

Wrong:

```bash id="zifgwd"
vix mobile init android --package softadastra
```

Correct:

```bash id="sb1wru"
vix mobile init android --package com.softadastra.app
```

The package name should contain at least two valid parts separated by dots.

### Building before creating the Android project

Wrong:

```bash id="vr01ww"
vix mobile build android
```

when `mobile/android` does not exist yet.

Correct:

```bash id="cipdnt"
vix mobile init android --name "My App" --url https://example.com
vix mobile build android
```

### Running without a connected device

Check devices first:

```bash id="qbnxcj"
vix mobile devices
```

Then run:

```bash id="vdxph9"
vix mobile run android
```

## Troubleshooting

### Android project not found

Create it first:

```bash id="ii0xfz"
vix mobile init android --name "My App" --url https://example.com
```

Or pass the project path:

```bash id="b8lvx4"
vix mobile build android --project apps/android
```

### SDK location not found

Make sure `ANDROID_HOME` or `ANDROID_SDK_ROOT` points to your Android SDK.

Example:

```bash id="m6wf7j"
export ANDROID_HOME="$HOME/Android/Sdk"
```

You can also create `local.properties` inside the Android project:

```properties id="vgeufa"
sdk.dir=/home/user/Android/Sdk
```

### Gradle is not found

Generate the wrapper:

```bash id="uhvwot"
vix mobile wrapper android
```

Or pass a Gradle command:

```bash id="ybcj0n"
vix mobile build android --gradle gradle
```

### Device is not detected

Run:

```bash id="s8mzs9"
vix mobile devices
```

Then confirm that USB debugging is enabled or that the emulator is running.

## Difference between mobile commands

| Command                      | Purpose                            |
| ---------------------------- | ---------------------------------- |
| `vix mobile init android`    | Generate the Android WebView shell |
| `vix mobile build android`   | Build the Android APK              |
| `vix mobile run android`     | Install and launch the Android app |
| `vix mobile wrapper android` | Generate the Gradle wrapper        |
| `vix mobile devices`         | List connected Android devices     |

## Related commands

| Command       | Purpose                                 |
| ------------- | --------------------------------------- |
| `vix desktop` | Run a Vix web UI inside a desktop shell |
| `vix run`     | Build and run a Vix target              |
| `vix dev`     | Run a development server with reload    |
| `vix build`   | Compile a project or target             |
| `vix note`    | Run the Vix Note UI                     |
