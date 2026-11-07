/**
 * 色リテラル（#hex / rgb() / rgba()）を起動時テーマの色に差し替える。
 *
 * - 静的な色はモジュール先頭の const に上げる（worklet からも参照できる）
 * - `rgba(${...})` のような組み立て色は実行時に変換（worklet 内は触らない）
 * - 変換関数は `globalThis.__uzc`（src/theme/themeColorRuntime.ts）。無ければ素通し
 *
 * Program.enter で全部済ませる（Reanimated が worklet を切り出す前に置き換える）。
 */
const HEX = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const FUNC = /^rgba?\(\s*[-\d.%\s,/]+\)$/i;
const NAMED = new Set(["white", "black"]);
const COLOR_KEY = /(?:color|Color)$|^(?:fill|stroke)$/;
const DYNAMIC_PREFIX = /^\s*(?:rgba?\(|#)/i;
/** 引数の色をそのまま残す呼び出し（src/theme/themeColorRuntime.ts） */
const RAW_CALLEE = new Set(["require", "rawColor", "themePick"]);

const EXCLUDE = [
  /\/node_modules\//,
  /\/apps\/native\/index\.ts$/,
  /\/apps\/native\/src\/theme\//,
  /\/lib\/theme\//,
  /\/apps\/native\/babel\//,
  /\/CyberSlantedTabNative\.tsx$/,
  /\/lib\/teams-[a-z0-9]+\.ts$/,
  /\/lib\/team-colors\.ts$/,
  /\/apps\/native\/src\/features\/games\/teamColors\.ts$/,
  /\/lib\/nba\/draftPicks\/draftTextTeamColors\.ts$/,
  /\/lib\/nba\/teamFranchise\//,
  /\/apps\/native\/src\/features\/splash\//,
];

const WORKLET_CALLEE =
  /^(?:use(?:Animated\w*|DerivedValue|FrameCallback)|runOnUI|interpolateColor|on(?:Begin|Start|Update|Change|End|Finalize|Touches\w*))$/;

function propertyKeyName(node) {
  if (!node) return null;
  if (node.type === "Identifier") return node.name;
  if (node.type === "StringLiteral") return node.value;
  return null;
}

/** 値が入るプロパティ名 / JSX 属性名（三項・論理式・as を挟んでも辿る） */
function colorSlotName(p) {
  let cur = p;
  for (let i = 0; i < 4 && cur.parentPath; i++) {
    const parent = cur.parentPath;
    const n = parent.node;
    if (
      n.type === "ConditionalExpression" ||
      n.type === "LogicalExpression" ||
      n.type === "TSAsExpression" ||
      n.type === "TSSatisfiesExpression" ||
      n.type === "JSXExpressionContainer"
    ) {
      cur = parent;
      continue;
    }
    if (n.type === "ObjectProperty" && n.value === cur.node) return propertyKeyName(n.key);
    if (n.type === "JSXAttribute") return n.name && n.name.name;
    if (n.type === "AssignmentPattern") return null;
    return null;
  }
  return null;
}

function roleFor(slot) {
  if (slot === "shadowColor") return "shadow";
  if (slot === "textShadowColor") return "glow";
  return undefined;
}

function insideWorklet(p) {
  let cur = p.parentPath;
  while (cur) {
    if (cur.isFunction()) {
      const body = cur.node.body;
      if (
        body &&
        body.type === "BlockStatement" &&
        (body.directives || []).some((d) => d.value && d.value.value === "worklet")
      ) {
        return true;
      }
      const call = cur.parentPath;
      if (call && call.isCallExpression()) {
        const callee = call.node.callee;
        const name =
          callee.type === "Identifier"
            ? callee.name
            : callee.type === "MemberExpression" && callee.property.type === "Identifier"
              ? callee.property.name
              : null;
        if (name && WORKLET_CALLEE.test(name)) return true;
      }
    }
    if (cur.isCallExpression()) {
      const callee = cur.node.callee;
      if (callee.type === "Identifier" && callee.name === "interpolateColor") return true;
    }
    cur = cur.parentPath;
  }
  return false;
}

function isSkippableStringPosition(p) {
  const parent = p.parentPath;
  if (!parent) return true;
  const n = parent.node;
  if (
    n.type === "ImportDeclaration" ||
    n.type === "ExportAllDeclaration" ||
    n.type === "ExportNamedDeclaration" ||
    n.type === "ImportSpecifier" ||
    n.type === "ExportSpecifier" ||
    n.type === "TSLiteralType" ||
    n.type === "TSEnumMember" ||
    n.type === "TSExternalModuleReference" ||
    n.type === "TSImportType"
  ) {
    return true;
  }
  if (
    (n.type === "ObjectProperty" || n.type === "ObjectMethod" || n.type === "ClassProperty") &&
    n.key === p.node &&
    !n.computed
  ) {
    return true;
  }
  if (
    n.type === "CallExpression" &&
    n.callee.type === "Identifier" &&
    RAW_CALLEE.has(n.callee.name)
  ) {
    return true;
  }
  return false;
}

module.exports = function themeColorLiteralsPlugin({ types: t }) {
  return {
    name: "uniterz-theme-color-literals",
    visitor: {
      Program: {
        enter(programPath, state) {
          const file = (state.filename || "").split("\\").join("/");
          if (!file || EXCLUDE.some((re) => re.test(file))) return;

          const hoisted = new Map();
          const decls = [];
          let fnId = null;
          const fn = () => {
            if (!fnId) fnId = programPath.scope.generateUidIdentifier("uzcFn");
            return fnId;
          };

          const hoist = (value, role) => {
            const key = `${role || ""}|${value}`;
            let id = hoisted.get(key);
            if (!id) {
              id = programPath.scope.generateUidIdentifier("uzc");
              hoisted.set(key, id);
              const args = [t.stringLiteral(value)];
              if (role) args.push(t.stringLiteral(role));
              decls.push(
                t.variableDeclaration("const", [
                  t.variableDeclarator(id, t.callExpression(t.cloneNode(fn()), args)),
                ])
              );
            }
            return t.cloneNode(id);
          };

          programPath.traverse({
            StringLiteral(p) {
              const v = p.node.value;
              const slot = colorSlotName(p);
              const isColor =
                HEX.test(v) || FUNC.test(v) || (NAMED.has(v) && slot != null && COLOR_KEY.test(slot));
              if (!isColor) return;
              if (isSkippableStringPosition(p)) return;
              const ref = hoist(v, roleFor(slot));
              if (p.parentPath.isJSXAttribute()) {
                p.replaceWith(t.jsxExpressionContainer(ref));
              } else {
                p.replaceWith(ref);
              }
              p.skip();
            },
            TemplateLiteral(p) {
              if (p.parentPath.isTaggedTemplateExpression()) return;
              if (isSkippableStringPosition(p)) return;
              const first = p.node.quasis[0];
              const head = first && (first.value.cooked != null ? first.value.cooked : first.value.raw);
              if (!head || !DYNAMIC_PREFIX.test(head)) return;
              if (p.node.expressions.length === 0) {
                const v = head.trim();
                if (!HEX.test(v) && !FUNC.test(v)) return;
                p.replaceWith(hoist(v, roleFor(colorSlotName(p))));
                p.skip();
                return;
              }
              if (insideWorklet(p)) return;
              const args = [p.node];
              const role = roleFor(colorSlotName(p));
              if (role) args.push(t.stringLiteral(role));
              p.replaceWith(t.callExpression(t.cloneNode(fn()), args));
              p.skip();
            },
          });

          if (!fnId) return;
          const g = t.memberExpression(t.identifier("globalThis"), t.identifier("__uzc"));
          const fnDecl = t.variableDeclaration("const", [
            t.variableDeclarator(
              fnId,
              t.conditionalExpression(
                t.binaryExpression("===", t.unaryExpression("typeof", g), t.stringLiteral("function")),
                t.cloneNode(g),
                t.arrowFunctionExpression([t.identifier("c")], t.identifier("c"))
              )
            ),
          ]);

          const body = programPath.get("body");
          let insertIndex = 0;
          while (insertIndex < body.length && body[insertIndex].isImportDeclaration()) insertIndex++;
          const nodes = [fnDecl, ...decls];
          if (insertIndex === 0) programPath.unshiftContainer("body", nodes);
          else body[insertIndex - 1].insertAfter(nodes);
        },
      },
    },
  };
};
