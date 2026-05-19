import type { ApiboostConfig } from "./src/type";

// /qualstar-manage/standard/import/parseTemplate
export const apiboost: ApiboostConfig[] = [
  {
    sourcePath: "swagger/blog.all.openapi.json",
    // "sourcePath": "http://localhost:3000/blog.all.openapi.json",
    // "sourcePath": "http://localhost:30001/xrz2.json",
    outDir: "outputs",
    exportStyle: "object",
    outputExt: "ts",
    baseUrlPrefix: "",
    filenameCase: "camel",
    includeJSDoc: true,
    groupInclude: [],
    requestImport: {
      enabled: true,
      importLine: "import request from '@/utils/request';",
      identifier: "request",
    },
    adapter: {
      groupBy: "path",
    },
  },
];
