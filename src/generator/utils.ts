import { StandardBody, StandardField, StandardService } from "@zpeak/openapi-adapter";
import { ApiboostConfig } from "../type.js";

/**
 * 生成 JSDoc 的 `@param` 注释行列表
 * @param fields 字段列表
 * @param namePrefix  `params/pathParams/data` 前缀
 * @returns JSDoc 注释行列表
 *
 * @example 输出形式：
 *
 *  ```ts
 *  [
 *    `* @param {number} params.pageSize 每页数量`,
 *    `* @param {string} params.pageNum 页码`
 *  ]
 *  ```
 */
export function genJsDocParams(fields: StandardField[], namePrefix: string): string[] {
  if (!fields.length) return [];
  const lines: string[] = [];
  for (const f of fields) {
    const desc = f.description || "";
    const type = f.type;
    // 形如：` * @param {number} params.pageSize 每页数量`
    lines.push(` * @param {${type}} ${namePrefix}.${f.name} ${desc}`);
  }
  return lines;
}

/**
 * 大驼峰
 */
export function pascalCase(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
/**
 * 小驼峰（支持连字符/下划线转驼峰）
 */
export function camelCase(s: string): string {
  if (!s) return s;
  return s.replace(/[-_ ]+([a-zA-Z])/g, (_, c: string) => c.toUpperCase());
}
/**
 * 文件名命名风格转换
 *  - camel：小驼峰命名法（如 articleList）
 *  - kebab：短横线命名法（如 article-list）
 * @param name - 待转换的文件名
 * @param caseType - 转换目标风格
 */
export function toFileName(name: string, caseType: "camel" | "kebab"): string {
  if (caseType === "kebab") {
    // 将驼峰转为短横线（如 ArticleList -> article-list）
    return name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }
  return camelCase(name);
}

/**
 * 构建 URL 表达式（字符串或模板字符串）
 * @param basePrefix - 统一前缀（如 `/api`）
 * @param rawPath - 源路径（可能包含 `{id}` 或 `:id` 占位符）
 * @param pathFields - 路径参数字段列表
 * @param argsObjName - 路径参数对象名（如 `pathParams`、`params`、`data`）
 * @returns URL 表达式字符串（模板字符串或普通字符串字面量）
 *
 * @example `{id}` 占位符
 *  - 输入：basePrefix='/api', rawPath='/user/{id}', pathFields=[{name:'id'}], argsObjName='pathParams'
 *  - 输出：`/api/user/${pathParams.id}`
 *
 * @example `:id` 占位符
 *  - 输入：basePrefix='/api', rawPath='/user/:id', pathFields=[{name:'id'}], argsObjName='pathParams'
 *  - 输出：`/api/user/${pathParams.id}`
 *
 * @example 无占位符
 *  - 输入：basePrefix='/api', rawPath='/user', pathFields=[{name:'id'}], argsObjName='pathParams'
 *  - 输出：`/api/user/${pathParams.id}`
 */
export function buildUrl(
  basePrefix: string,
  rawPath: string,
  pathFields: StandardField[] | undefined,
  argsObjName: string,
): string {
  const prefix = basePrefix || "";
  let url = `${prefix}${rawPath}`; // 先拼接前缀与原始路径
  if (pathFields && pathFields.length) {
    for (const p of pathFields) {
      const token = p.name;
      // 支持两种占位写法：{id} 或 :id（使用正则字面量）
      // url = url.replace(new RegExp(`\\{${token}\\}`, 'g'), `\${${argsObjName}.${token}}`);
      url = url.replace(/\{([^{}]+)\}/g, (match, key) => {
        return key === token ? `\${${argsObjName}.${token}}` : match;
      });
      // url = url.replace(new RegExp(`:${token}\\b`, 'g'), `\${${argsObjName}.${token}}`);
      url = url.replace(/:([^/:]+)\b/g, (match, key) => {
        return key === token ? `\${${argsObjName}.${token}}` : match;
      });
    }

    // 若原始路径没有任何占位符，则将所有 path 参数作为尾部片段追加
    if (!/[{}:]/.test(rawPath)) {
      const tail = pathFields.map((p) => `\${${argsObjName}.${p.name}}`).join("/");
      if (tail) url = `${prefix}${rawPath}/${tail}`;
    }
  }

  // 包含 模板变量 则返回模板字符串
  if (/\$\{/.test(url)) return `\`${url}\``; // '`' + url + '`'

  // 否则返回普通字符串字面量
  return `"${url}"`;
}

/**
 * 根据字段列表生成接口类型文字
 * - 通用JSON Schema → TypeScript类型转换器
 * @param {Object} schema - 自定义JSON Schema结构
 * @returns {string} TypeScript类型字符串
 *
 * @example  输出形如 :
 *
 *  ```ts
 *  {
 *    /** 描述 *\/
 *    field?: string;
 *  }
 * ```
 */
export function genResponseType(schema: StandardBody): string {
  // 处理对象类型
  if (schema.type === "object") {
    const properties: string[] = [];
    if (!schema?.items?.length) {
      // 对象类型 items 为空不存在属性定义
      return "Record<string, never>";
      // 等价于 { [k: string]: never }
    }
    // 检查是否是嵌套对象
    schema?.items?.forEach((prop) => {
      const required = prop.required ? "" : "?"; // 非必填

      // 递归处理嵌套结构
      let innerType = genResponseType({
        type: prop.type,
        items: prop.items,
      });

      const desc = prop.description;
      desc && properties.push(`  /** ${desc} */`); // 行内注释

      properties.push(`${prop.name}${required}: ${innerType};`);
    });

    // 生成对象类型字符串
    return `{\n${properties.join("\n")}\n}`;
  }

  // 处理数组类型
  if (schema.type === "array") {
    if (!schema.items?.length) return "[]";

    // 处理基础类型数组 items只有一项 且 不存在 name
    if (schema.items.length === 1 && !schema.items[0].name) {
      const baseType = schema.items[0]?.type;
      return `${baseType}[]`;
    }

    // 处理对象类型数组
    const innerType = genResponseType({
      type: "object",
      items: schema.items,
    });
    return `${innerType}[]`;
  }

  // 处理基础类型
  return schema.type;
}

/**
 * 构建文件头部（按需插入请求 import 行）
 * @param cfg - 配置对象
 * @returns
 *
 * @example  配置了 `requestImport.importLine`
 *  ```ts
 *  import request from './request';
 *  ```
 */
export function buildHeader(cfg: ApiboostConfig): string {
  const header: string[] = [];
  if (cfg.requestImport?.enabled && cfg.requestImport.importLine) {
    header.push(cfg.requestImport.importLine); // 直接插入配置的 import 行
  }
  return header.length ? header.join("\n") + "\n\n" : ""; // 末尾补空行分隔正文
}

/**
 * 生成单个服务的函数代码
 * @param groupName - 分组名
 * @param service - 服务数据
 * @param cfg - 配置
 * @param usedNames - 已使用名称集合
 * @returns 函数代码字符串
 *
 * @example 当配置为 function 模式时，生成独立函数：
 *
 * ```ts
 * function reqGetArticle(params: { id: string }) {
 *   return request({
 *     url: `/api/article/${params.id}`,
 *     method: 'GET',
 *     params,
 *   });
 * }
 * ```
 *
 * @example 当配置为 object 模式时，生成对象方法：
 *
 * ```ts
 * reqGetArticle(params: { id: string }) {
 *   return request({
 *     url: `/api/article/${params.id}`,
 *     method: 'GET',
 *     params,
 *   });
 * }
 * ```
 */
export function genFunctionCode(
  groupName: string,
  service: StandardService,
  cfg: ApiboostConfig,
): string {
  const request = service.request; // 当前服务的请求定义
  const { method, path: rawPath, summary, auth, description } = service;

  // 三类参数位置：query/path/body
  const queryFields = request.query || [];
  const pathFields = request.path || [];
  const bodyFields = request?.body?.items || [];

  // 生成 TS 类型字面量（interface-like）
  const queryType = genResponseType({
    type: "object",
    items: queryFields,
  });
  const pathType = genResponseType({
    type: "object",
    items: pathFields,
  });
  const bodyType = genResponseType(request.body!);

  const returnType = genResponseType(service.response); // 响应类型

  // 判断是否存在各类参数
  const hasQuery = queryFields.length > 0;
  const hasPath = pathFields.length > 0;
  const hasBody = bodyFields.length > 0;

  /**
   * 1. 构建 **函数形参** 列表：
   *  - TS 输出：包含类型字面量
   *  - JS 输出：仅参数名，不包含类型
   */
  const args: string[] = [];
  if (cfg.outputExt === "ts") {
    if (hasQuery) args.push(`params: ${queryType}`);
    if (hasPath) args.push(`pathParams: ${pathType}`);
    if (hasBody) args.push(`data: ${bodyType}`);
  } else {
    if (hasQuery) args.push(`params`);
    if (hasPath) args.push(`pathParams`);
    if (hasBody) args.push(`data`);
  }

  /**
   * 2. 构建 **URL**：
   *  - 选择合适的对象名用于模板变量（优先 pathParams -> params -> data）
   */
  const argsNameForUrl = hasPath ? "pathParams" : hasQuery ? "params" : "data";
  const urlExpr = buildUrl(cfg.baseUrlPrefix!, rawPath, pathFields, argsNameForUrl);

  /**
   * 3. 构建 **请求负载**（request 调用参数）：
   *  - URL 表达式（模板或字符串）
   *  - HTTP 方法
   *  - query 参数
   *  - body 参数
   */
  const payload: string[] = [];
  payload.push(`    url: ${urlExpr},`); // URL 表达式（模板或字符串）
  payload.push(`    method: "${method}",`); // HTTP 方法
  if (hasQuery) payload.push("    params,"); // 仅在存在 query 时传入 params
  if (hasBody) payload.push("    data,"); // 仅在存在 body 时传入 data

  /**
   * 4. 构建 **JSDoc 注释** （按配置开关）
   */
  const jsDocLines: string[] = [];
  if (cfg.includeJSDoc) {
    jsDocLines.push("/**");
    jsDocLines.push(` * ${summary || ""}${auth ? "（需要认证）" : ""}`); // 接口摘要 + 认证提示
    description && jsDocLines.push(` * @description ${description}`);
    jsDocLines.push(` * @group ${groupName}`); // 分组名
    jsDocLines.push(` * @route ${rawPath} [${method.toUpperCase()}]`); // 原始路由与方法
    if (hasQuery) jsDocLines.push(...genJsDocParams(queryFields, "params"));
    if (hasPath) jsDocLines.push(...genJsDocParams(pathFields, "pathParams"));
    if (hasBody) jsDocLines.push(...genJsDocParams(bodyFields, "data"));
    jsDocLines.push(" */");
  }

  const sigArgs = args.join(", "); // 形参签名文本 : `params, pathParams, data`
  const typeAnn = cfg.outputExt === "ts" ? `: Promise<${returnType}>` : ""; // 仅 TS 输出返回类型注解
  const funcName = service.controllerName;

  /**
   * 5. 最终函数体代码：包含注释、签名与 request 调用
   */
  let signature = `${funcName}(${sigArgs})${typeAnn} {\n  return ${cfg.requestImport!.identifier}({\n${payload.join("\n")}\n  });\n}`;
  if (cfg.exportStyle === "function") {
    // 适配 function 风格
    signature = `export function ${signature}`;
  }

  return (jsDocLines.length ? jsDocLines.join("\n") + "\n" : "") + signature + "\n";
}
