import * as esbuild from "esbuild";
import { dtsPlugin } from "esbuild-plugin-d.ts";

// peer 전부 external — 소비처 번들과 중복 방지(taskbox/vdt/mfd 와 동일 워크플로).
const baseConfig = {
    entryPoints: ["src/index.ts"],
    bundle: true,
    minify: true,
    sourcemap: true,
    external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@mui/material",
        "@mui/material/*",
        "@mui/icons-material",
        "@mui/icons-material/*",
        "@emotion/react",
        "@emotion/styled",
        "react-markdown",
        "remark-gfm",
        "react-virtuoso",
        "entity-client",
        "@ehfuse/forma",
        "@ehfuse/alerts",
        "@ehfuse/mui-form-controls",
        "@ehfuse/mui-form-dialog",
        "@ehfuse/overlay-scrollbar",
        "@ehfuse/taskbox",
    ],
    plugins: [dtsPlugin()],
};

// ESM build
await esbuild.build({
    ...baseConfig,
    format: "esm",
    outfile: "dist/index.esm.js",
});

// CJS build
await esbuild.build({
    ...baseConfig,
    format: "cjs",
    outfile: "dist/index.js",
});

console.log("✅ Build completed successfully!");
