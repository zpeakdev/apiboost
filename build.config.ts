import { defineBuildConfig } from "unbuild";

export default defineBuildConfig([
  {
    entries: ["./src/index", "./bin/generate.ts"],
    outDir: "dist",
    declaration: true, // .d.ts 类型
    clean: true,
    rollup: {
      // 基于 rollup 的自定义配置
      emitCJS: true, // 输出 CJS 格式
    },
  },
]);
