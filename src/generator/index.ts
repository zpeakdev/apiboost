import path from "node:path";
import fse from "fs-extra";
import prettier from "prettier";
import type { StandardGroup } from "@zpeak/openapi-adapter";
import { OpenAPIAdapter } from "@zpeak/openapi-adapter";
import type { ApiboostConfig } from "../type.js";
import { genFunctionCode, pascalCase, toFileName } from "./utils.js";

/**
 * 生成对象聚合导出文件内容
 * @param group 分组数据
 * @param cfg 配置
 * @param header 头部内容
 * @returns
 *
 * @example
 *
 * ```ts
 * const reqObj = {
 *  reqGetArticle(params: { id: string }) {
 *    return request({
 *      url: '/article/get',
 *      method: 'get',
 *      params,
 *    });
 *  },
 *  // ...
 * }
 * ```
 */
export function genObjectFile(group: StandardGroup, cfg: ApiboostConfig, header: string): string {
  const objName = group.controllerName || `req${pascalCase(group.name)}`; // 对象名：优先使用 group.controllerName
  const lines: string[] = [];
  if (header) lines.push(header); //
  lines.push(`export const ${objName} = {`);
  for (const s of group.services || []) {
    lines.push(genFunctionCode(group.name, s, cfg));
    lines.push(","); // 每个方法后加逗号分隔
  }
  lines.push("};\n");
  return lines.join("\n");
}

/**
 * 生成逐函数导出文件内容
 * @param group 分组数据
 * @param cfg 配置
 * @param header 头部内容
 * @returns
 *
 * @example
 *
 * ```ts
 * export function reqGetArticle(params: { id: string }) {
 *   return request({
 *     url: '/article/get',
 *     method: 'get',
 *     params,
 *   });
 * }
 *
 * // ...
 * ```
 */
export function genFunctionFile(group: StandardGroup, cfg: ApiboostConfig, header: string): string {
  const lines: string[] = [];
  if (header) lines.push(header);
  for (const s of group.services || []) {
    lines.push(genFunctionCode(group.name, s, cfg));
  }
  return lines.join("\n");
}

/**
 * 处理单个配置项
 * @param config 配置项
 */
export async function processConfig(config: ApiboostConfig): Promise<void> {
  // 合并配置项与默认配置
  const cfg: ApiboostConfig = {
    outDir: "outputs",
    exportStyle: "function",
    outputExt: "ts",
    baseUrlPrefix: "",
    filenameCase: "camel",
    includeJSDoc: true,
    groupInclude: [],
    format: true,
    requestImport: {
      enabled: true,
      importLine: "import request from '@/utils/request';",
      identifier: "request",
    },
    returnPromiseAs: "AxiosPromise",
    ...config,
  };

  const outDirAbs = path.resolve(process.cwd(), cfg.outDir!); // 输出目录绝对路径
  const openapiAdapterOutputPath = path.join(
    outDirAbs,
    "openapi-adapter",
    path.basename(cfg.sourcePath),
  ); // OpenAPI源数据 标准化后的文件导出路径
  await fse.ensureDir(path.dirname(openapiAdapterOutputPath)); // 确保目录存在

  // OPTIMIZATION: 后续优化， adapter 也要有可配置入口
  const openapiAdapterData = await OpenAPIAdapter({
    inputPath: cfg.sourcePath,
    outputPath: openapiAdapterOutputPath,
    ...config.adapter,
  }).catch((err) => {
    console.error("❌ OpenAPIAdapter 错误:", err);
    throw err;
  });

  if (!Array.isArray(openapiAdapterData)) throw new Error("❌ 源数据格式不正确，期望为数组");

  // 构建文件头（包含 import，后加空行分隔正文）
  const header =
    cfg.requestImport?.enabled && cfg.requestImport.importLine
      ? cfg.requestImport.importLine + "\n\n"
      : "";

  // 遍历分组进行文件生成
  for (const group of openapiAdapterData) {
    // 过滤：若配置了 groupInclude，仅生成命中的分组
    if (cfg.groupInclude?.length && !cfg.groupInclude.includes(group.name)) continue;
    const baseFileName = toFileName(group.name, cfg.filenameCase!); // 生成文件名基础（命名风格）
    const fileName = `${baseFileName}.${cfg.outputExt}`; // 拼接后缀 ts/js
    const outputFilePath = path.join(outDirAbs, fileName);

    // 根据导出风格生成完整文件内容
    const content =
      cfg.exportStyle === "object"
        ? genObjectFile(group, cfg, header)
        : genFunctionFile(group, cfg, header);

    const finalContent = cfg.format
      ? await prettier.format(content, {
          ...(await prettier.resolveConfig(outputFilePath)),
          filepath: outputFilePath,
        })
      : content;
    // 写入目标文件
    fse.writeFileSync(outputFilePath, finalContent, "utf8");
    console.log("✔️  生成完成:", outputFilePath); // 控制台提示
  }
}
