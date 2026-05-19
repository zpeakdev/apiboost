import type { OpenAPIAdapterConfig } from "@zpeak/openapi-adapter/";

/**
 * 文件头部的请求导入配置
 * - 用于指定生成的文件顶部是否插入 import 语句以及 import 的具体内容
 */
export interface RequestImportCfg {
  /**
   * 是否在生成文件顶部插入 import 语句
   */
  enabled: boolean;

  /**
   * 完整的 import 文本
   *
   * @example `import request from '@/utils/request';`
   */
  importLine: string;

  /**
   * 请求调用函数的标识符，通常与 import 的默认导出一致（如 "request"）
   *
   * @default "request"
   */
  identifier?: string;
}

/**
 * 生成器总配置
 */
export interface ApiboostConfig {
  /**
   * 源 JSON 路径, 支持本地文件路径或网络 URL
   */
  sourcePath: string;

  /**
   * 输出目录
   *
   * @default "outputs"
   */
  outDir?: string;

  /**
   * 导出风格 "object" 对象聚合导出 | "function" 逐函数导出
   *
   * @default "object"
   */
  exportStyle?: "object" | "function";

  /**
   * 生成文件后缀 "ts" | "js"
   *
   * @default "ts"
   */
  outputExt?: "js" | "ts";

  /**
   * URL 前缀（如 "/api"）
   *
   * @default ""
   */
  baseUrlPrefix?: string;

  /**
   * 文件命名风格 "camel" | "kebab"
   *
   * @default "camel"
   */
  filenameCase?: "camel" | "kebab";

  /**
   * 是否输出 JSDoc 注释
   *
   * @default true
   */
  includeJSDoc?: boolean;

  /**
   * 只生成指定分组名（空数组表示全部）
   *
   * @default []
   */
  groupInclude?: string[];

  /**
   * 请求导入配置
   */
  requestImport?: RequestImportCfg;

  /**
   * 自定义函数返回类型中 `Promise` 的类型名称
   * - 用于外部自定义一个工具类型，解决响应的类型结构
   *
   * @example "AxiosPromise"
   * ```ts
   *   function getApi():AxiosPromise<XXX>{ ... }
   * ```
   *
   * @default "Promise"
   */
  returnPromiseAs?: string;

  /**
   * 适配器配置【 https://www.npmjs.com/package/@zpeak/openapi-adapter 】
   * - 处理 openapi 源数据为约定的标准数据
   */
  adapter: Partial<OpenAPIAdapterConfig>;
}
