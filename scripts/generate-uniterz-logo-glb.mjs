/**
 * 確定版 SVG ロゴを押し出して GLB にする（Blender なし・Three.js）。
 * Usage: node scripts/generate-uniterz-logo-glb.mjs
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { ExtrudeGeometry, Shape } from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

/** Node には FileReader がないので、GLTFExporter 用に最低限を足す */
if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class FileReader {
    result = null;
    onloadend = null;
    readAsArrayBuffer(blob) {
      Promise.resolve(blob.arrayBuffer()).then((buf) => {
        this.result = buf;
        this.onloadend?.({ target: this });
      });
    }
  };
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const JOBS = [
  {
    id: "u-mark",
    src: join(root, "public/brand/uniterz-u-mark.svg"),
    outs: [
      join(root, "public/brand/uniterz-u-mark.glb"),
      join(root, "public/logo/uniterz-u-mark.glb"),
      join(root, "apps/native/assets/models/uniterz-u-mark.glb"),
    ],
    depthRatio: 0.16,
    bevelRatio: 0.0045,
  },
  {
    id: "wordmark",
    src: join(root, "public/brand/uniterz-logo.svg"),
    outs: [
      join(root, "public/brand/uniterz-logo-3d.glb"),
      join(root, "public/logo/uniterz-logo-3d.glb"),
      join(root, "apps/native/assets/models/uniterz-logo-3d.glb"),
    ],
    depthRatio: 0.22,
    bevelRatio: 0.0055,
  },
];

function tokenize(d) {
  return d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
}

function parsePathToShape(d) {
  const tokens = tokenize(d);
  let i = 0;
  let cmd = "";
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let prev = "";
  let c2x = 0;
  let c2y = 0;
  const num = () => parseFloat(tokens[i++]);
  const flipY = (y) => -y;

  const shape = new Shape();
  let started = false;

  const move = (x, y) => {
    cx = x;
    cy = y;
    sx = x;
    sy = y;
    if (!started) {
      shape.moveTo(x, flipY(y));
      started = true;
    } else {
      shape.lineTo(x, flipY(y));
    }
  };

  while (i < tokens.length) {
    const t = tokens[i];
    if (/[A-Za-z]/.test(t)) {
      cmd = t;
      i++;
    }
    switch (cmd) {
      case "M":
        move(num(), num());
        cmd = "L";
        prev = "M";
        break;
      case "m":
        move(cx + num(), cy + num());
        cmd = "l";
        prev = "m";
        break;
      case "L":
        cx = num();
        cy = num();
        shape.lineTo(cx, flipY(cy));
        prev = "L";
        break;
      case "l":
        cx += num();
        cy += num();
        shape.lineTo(cx, flipY(cy));
        prev = "l";
        break;
      case "H":
        cx = num();
        shape.lineTo(cx, flipY(cy));
        prev = "H";
        break;
      case "h":
        cx += num();
        shape.lineTo(cx, flipY(cy));
        prev = "h";
        break;
      case "V":
        cy = num();
        shape.lineTo(cx, flipY(cy));
        prev = "V";
        break;
      case "v":
        cy += num();
        shape.lineTo(cx, flipY(cy));
        prev = "v";
        break;
      case "C": {
        const x1 = num();
        const y1 = num();
        const x2 = num();
        const y2 = num();
        const x = num();
        const y = num();
        shape.bezierCurveTo(x1, flipY(y1), x2, flipY(y2), x, flipY(y));
        c2x = x2;
        c2y = y2;
        cx = x;
        cy = y;
        prev = "C";
        break;
      }
      case "c": {
        const x1 = cx + num();
        const y1 = cy + num();
        const x2 = cx + num();
        const y2 = cy + num();
        const x = cx + num();
        const y = cy + num();
        shape.bezierCurveTo(x1, flipY(y1), x2, flipY(y2), x, flipY(y));
        c2x = x2;
        c2y = y2;
        cx = x;
        cy = y;
        prev = "c";
        break;
      }
      case "S":
      case "s": {
        const rel = cmd === "s";
        const reflect = prev === "c" || prev === "C" || prev === "s" || prev === "S";
        const x1 = reflect ? 2 * cx - c2x : cx;
        const y1 = reflect ? 2 * cy - c2y : cy;
        const x2 = rel ? cx + num() : num();
        const y2 = rel ? cy + num() : num();
        const x = rel ? cx + num() : num();
        const y = rel ? cy + num() : num();
        shape.bezierCurveTo(x1, flipY(y1), x2, flipY(y2), x, flipY(y));
        c2x = x2;
        c2y = y2;
        cx = x;
        cy = y;
        prev = cmd;
        break;
      }
      case "Z":
      case "z":
        shape.closePath();
        cx = sx;
        cy = sy;
        prev = "Z";
        break;
      default:
        throw new Error(`未対応のパスコマンド: ${cmd}`);
    }
  }

  return shape;
}

function extractPathTags(svgText) {
  return [...svgText.matchAll(/<path\b([^>]*)>/gi)]
    .map((m, index) => {
      const attrs = m[1];
      const d = /\bd="([^"]+)"/.exec(attrs)?.[1];
      const id = /\bid="([^"]+)"/.exec(attrs)?.[1];
      return d ? { d, id: id || `part-${index}` } : null;
    })
    .filter(Boolean);
}

function makeMaterial() {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color("#0a0e14"),
    metalness: 0.96,
    roughness: 0.18,
    emissive: new THREE.Color("#1c2430"),
    emissiveIntensity: 0.14,
    side: THREE.DoubleSide,
  });
}

function extrudeSettings(depth, bevel) {
  return {
    depth,
    bevelEnabled: bevel > 0.01,
    bevelThickness: bevel,
    bevelSize: bevel * 0.72,
    bevelOffset: 0,
    bevelSegments: 2,
    curveSegments: 6,
    steps: 1,
  };
}

function bakeWorldTransforms(rootGroup) {
  rootGroup.updateMatrixWorld(true);
  const baked = new THREE.Group();
  baked.name = rootGroup.name;
  rootGroup.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh) || !obj.geometry) return;
    const geo = obj.geometry.clone();
    geo.applyMatrix4(obj.matrixWorld);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, obj.material);
    mesh.name = obj.name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    baked.add(mesh);
  });
  return baked;
}

function fitToUnit(group) {
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  group.position.sub(center);
  const longest = Math.max(size.x, size.y, size.z) || 1;
  group.scale.setScalar(1 / longest);
  return bakeWorldTransforms(group);
}

function shapeSpanY(shape) {
  const pts = shape.getPoints(12);
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  return Math.max(1, maxY - minY);
}

function extrudeSvg(svgText, { depthRatio, bevelRatio, name }) {
  const tags = extractPathTags(svgText);
  if (tags.length === 0) throw new Error(`${name}: SVG path が空です`);

  const shapes = tags.map((tag) => ({
    id: tag.id,
    shape: parsePathToShape(tag.d),
  }));
  const spanY = Math.max(...shapes.map((s) => shapeSpanY(s.shape)));
  const depth = spanY * depthRatio;
  const bevel = spanY * bevelRatio;
  const material = makeMaterial();

  const raw = new THREE.Group();
  raw.name = name;

  shapes.forEach((item, index) => {
    let geo;
    try {
      geo = new ExtrudeGeometry(item.shape, extrudeSettings(depth, bevel));
    } catch {
      geo = new ExtrudeGeometry(item.shape, extrudeSettings(depth, 0));
    }
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, material.clone());
    mesh.name = `${item.id}-${index}`;
    raw.add(mesh);
  });

  return fitToUnit(raw);
}

async function exportGlb(group) {
  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(group, {
    binary: true,
    onlyVisible: true,
    embedImages: false,
  });
  if (!(result instanceof ArrayBuffer)) {
    throw new Error("GLB の ArrayBuffer が返りませんでした");
  }
  return Buffer.from(result);
}

async function runJob(job) {
  const svgText = readFileSync(job.src, "utf8");
  const group = extrudeSvg(svgText, {
    depthRatio: job.depthRatio,
    bevelRatio: job.bevelRatio,
    name: job.id,
  });
  const buf = await exportGlb(group);
  const [primary, ...copies] = job.outs;
  mkdirSync(dirname(primary), { recursive: true });
  writeFileSync(primary, buf);
  for (const dest of copies) {
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(primary, dest);
  }
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  console.log(
    `${job.id}: meshes=${group.children.length} size=${size.x.toFixed(3)}x${size.y.toFixed(3)}x${size.z.toFixed(3)} bytes=${buf.length}`
  );
  for (const dest of job.outs) console.log(`  -> ${dest.replace(`${root}/`, "")}`);
}

for (const job of JOBS) {
  await runJob(job);
}
