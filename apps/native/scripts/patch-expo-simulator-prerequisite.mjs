/**
 * Xcode 27: Simulator.app → DeviceHub.app。
 * Expo CLI の事前チェック / open -a Simulator / activate を DeviceHub 対応にする。
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const MARKER = "Xcode 27 DeviceHub patch";

const prerequisiteTarget = path.join(
  root,
  "node_modules/@expo/cli/build/src/start/doctor/apple/SimulatorAppPrerequisite.js"
);

const ensureRunningTarget = path.join(
  root,
  "node_modules/@expo/cli/build/src/start/platforms/ios/ensureSimulatorAppRunning.js"
);

const deviceManagerTarget = path.join(
  root,
  "node_modules/@expo/cli/build/src/start/platforms/ios/AppleDeviceManager.js"
);

const prerequisitePatched = `"use strict";
/**
 * ${MARKER}
 * Xcode 27 では Simulator.app が DeviceHub.app に置き換わり、
 * Expo CLI の「Simulator があるか」チェックが実機ビルドでも落ちる。
 * simctl が動けば十分なので、ここでは app id チェックをスキップする。
 */
Object.defineProperty(exports, "__esModule", { value: true });
Object.defineProperty(exports, "SimulatorAppPrerequisite", {
  enumerable: true,
  get: function () {
    return SimulatorAppPrerequisite;
  },
});
const spawnAsync = require("@expo/spawn-async");
const _log = require("../../../log");
const _Prerequisite = require("../Prerequisite");

class SimulatorAppPrerequisite extends _Prerequisite.Prerequisite {
  static instance = new SimulatorAppPrerequisite();
  async assertImplementation() {
    try {
      await spawnAsync("xcrun", ["simctl", "help"]);
    } catch (error) {
      _log.warn(\`Unable to run simctl:\\n\${error.toString()}\`);
      throw new _Prerequisite.PrerequisiteCommandError(
        "SIMCTL",
        "xcrun is not configured correctly. Ensure \`sudo xcode-select --reset\` works before running this command again."
      );
    }
  }
}
`;

function patchEnsureRunning(filePath) {
  if (!existsSync(filePath)) return false;
  let src = readFileSync(filePath, "utf8");
  if (src.includes(MARKER)) return false;

  src = src.replace(
    `const zeroMeansNo = (await _osascript().execAsync('tell app "System Events" to count processes whose name is "Simulator"')).trim();`,
    `// ${MARKER}
        const zeroMeansNo = (await _osascript().execAsync('tell app "System Events" to count (processes whose name is "DeviceHub" or name is "Simulator")')).trim();`
  );

  src = src.replace(
    `const args = [
        '-a',
        'Simulator'
    ];
    if (device.udid) {
        // This has no effect if the app is already running.
        args.push('--args', '-CurrentDeviceUDID', device.udid);
    }
    await (0, _spawnasync().default)('open', args);`,
    `// ${MARKER}: Xcode 27 uses DeviceHub.app instead of Simulator.app
    const deviceHub = '/Applications/Xcode.app/Contents/Applications/DeviceHub.app';
    try {
        const args = device.udid
            ? ['-a', deviceHub, '--args', '-CurrentDeviceUDID', device.udid]
            : ['-a', deviceHub];
        await (0, _spawnasync().default)('open', args);
    } catch {
        await (0, _spawnasync().default)('open', ['-b', 'com.apple.dt.Devices']);
    }`
  );

  if (!src.includes(MARKER)) {
    throw new Error("ensureSimulatorAppRunning patch failed to apply");
  }
  writeFileSync(filePath, src);
  return true;
}

function patchDeviceManager(filePath) {
  if (!existsSync(filePath)) return false;
  let src = readFileSync(filePath, "utf8");
  if (src.includes(MARKER)) return false;

  const before = `await _osascript().execAsync(\`tell application "Simulator" to activate\`);`;
  const after = `// ${MARKER}
        try {
            await _osascript().execAsync(\`tell application "DeviceHub" to activate\`);
        } catch {
            try {
                await _osascript().execAsync(\`tell application "Simulator" to activate\`);
            } catch {
                // Window activate is best-effort on Xcode 27+.
            }
        }`;

  if (!src.includes(before)) {
    return false;
  }
  src = src.replace(before, after);
  writeFileSync(filePath, src);
  return true;
}

let changed = false;

if (existsSync(prerequisiteTarget)) {
  const current = readFileSync(prerequisiteTarget, "utf8");
  if (!current.includes(MARKER) && !current.includes("DeviceHub.app に置き換わり")) {
    writeFileSync(prerequisiteTarget, prerequisitePatched);
    changed = true;
  } else if (current.includes("DeviceHub.app に置き換わり") && !current.includes(MARKER)) {
    // Older patch already applied — leave prerequisite as-is.
  }
}

if (patchEnsureRunning(ensureRunningTarget)) changed = true;
if (patchDeviceManager(deviceManagerTarget)) changed = true;

if (changed) {
  console.log("[patch-expo-simulator] Xcode 27 DeviceHub 対応を適用しました");
}
