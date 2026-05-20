# apiboost

一个开源工具，助力提升前端API开发效率。基于OpenAPI规范解析源数据，自动生成JavaScript/TypeScript API调用代码，与Vue、React等主流框架无缝集成，显著提高您的API开发流程。

[![npm](https://img.shields.io/npm/v/apiboost)](https://www.npmjs.com/package/apiboost)
[![license](https://img.shields.io/npm/l/apiboost)](https://github.com/zpeakdev/apiboost/blob/main/LICENSE)

## 功能特点

- 🚀 **自动化生成**：根据 OpenAPI/Swagger 规范自动生成 API 调用代码
- 🔄 **多种导出风格**：支持函数式和对象式两种导出方式
- 📝 **智能类型推导**：自动解析数值枚举并生成 TypeScript 联合类型
- 📚 **丰富注释**：可选生成 JSDoc 注释，提供良好的开发体验
- ⚙️ **高度可配置**：支持自定义请求封装、URL 前缀、文件命名、Promise 类型等
- 🎨 **代码格式化**：集成 Prettier，生成代码自动格式化
- 🔌 **适配器架构**：通过 [`@zpeak/openapi-adapter`](https://www.npmjs.com/package/@zpeak/openapi-adapter) 解耦数据标准化，支持按路径/标签分组
- 📦 **多配置支持**：支持配置数组，可同时处理多个 API 数据源
- 🔧 **CLI 支持**：提供命令行工具，方便集成到构建流程中

## 安装

```bash
# 使用 npm
npm install apiboost

# 使用 yarn
yarn add apiboost

# 使用 pnpm
pnpm add apiboost
```

## 快速开始

### 1. 创建配置文件

在项目根目录创建 `apiboost.config.ts`（也支持 `.js` / `.mjs`）配置文件：

```ts
import type { ApiboostConfig } from "apiboost";

export const apiboost: ApiboostConfig[] = [
  {
    sourcePath: "swagger/swagger.json", // OpenAPI/Swagger 文件路径
    outDir: "src/api", // 生成代码的输出目录（默认: "outputs"）
    exportStyle: "function", // 导出风格: "object" | "function"（默认: "function"）
    outputExt: "ts", // 输出文件类型: "ts" | "js"（默认: "ts"）
    baseUrlPrefix: "/api", // URL 前缀（默认: ""）
    filenameCase: "camel", // 文件命名风格: "camel" | "kebab"（默认: "camel"）
    includeJSDoc: true, // 是否生成 JSDoc 注释（默认: true）
    format: true, // 是否 Prettier 格式化（默认: true）
    groupInclude: [], // 要生成的分组（空数组表示全部）
    returnPromiseAs: "Promise", // 自定义 Promise 类型名（默认: "Promise"）
    requestImport: {
      enabled: true, // 是否启用请求导入
      importLine: "import request from '@/utils/request';", // 导入语句
      identifier: "request", // 请求函数标识符
    },
    adapter: {
      groupBy: "path", // 适配器分组方式: "path" | "tag" 等
    },
  },
];
```

> 配置支持单个对象或数组形式。数组形式可同时处理多个 API 数据源。

### 2. 运行生成命令

```bash
# 使用 npx 运行
npx apiboost

# 或者添加到 package.json scripts 中
# "scripts": {
#   "generate-api": "apiboost"
# }
```

## 配置说明

| 属性                     | 类型                            | 必填 | 默认值       | 描述                                         |
| ------------------------ | ------------------------------- | ---- | ------------ | -------------------------------------------- |
| sourcePath               | string                          | 是   | —            | OpenAPI/Swagger 文件路径（本地或 URL）       |
| outDir                   | string                          | 否   | `"outputs"`  | 生成代码的输出目录                           |
| exportStyle              | `"object"` \| `"function"`      | 否   | `"function"` | 导出风格                                     |
| outputExt                | `"ts"` \| `"js"`                | 否   | `"ts"`       | 输出文件类型                                 |
| baseUrlPrefix            | string                          | 否   | `""`         | URL 前缀                                     |
| filenameCase             | `"camel"` \| `"kebab"`          | 否   | `"camel"`    | 文件命名风格                                 |
| includeJSDoc             | boolean                         | 否   | `true`       | 是否生成 JSDoc 注释                          |
| format                   | boolean                         | 否   | `true`       | 是否使用 Prettier 格式化生成代码             |
| groupInclude             | string[]                        | 否   | `[]`         | 要生成的分组（空数组表示全部）               |
| returnPromiseAs          | string                          | 否   | `"Promise"`  | 自定义 Promise 类型名（如 `"AxiosPromise"`） |
| requestImport.enabled    | boolean                         | 否   | `true`       | 是否启用请求导入                             |
| requestImport.importLine | string                          | 否   | —            | 导入语句                                     |
| requestImport.identifier | string                          | 否   | `"request"`  | 请求函数标识符                               |
| adapter                  | `Partial<OpenAPIAdapterConfig>` | 否   | —            | `@zpeak/openapi-adapter` 适配器配置          |

### 适配器配置

`adapter` 字段传递给 [`@zpeak/openapi-adapter`](https://www.npmjs.com/package/@zpeak/openapi-adapter)，用于控制 OpenAPI 数据的标准化和分组方式。

适配器标准化后的中间数据会同时输出到 `outDir/openapi-adapter/` 目录下，方便调试和查看。

## 使用示例

### 函数式导出（Function Style）

假设你的 Swagger 文件中有以下接口定义：

```json
{
  "paths": {
    "/article/{article_id}": {
      "get": {
        "summary": "获取文章详情",
        "tags": ["article"],
        "parameters": [
          {
            "name": "article_id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": { "200": { "description": "成功" } }
      }
    }
  }
}
```

运行 apiboost 后会生成类似以下的代码：

```ts
import request from "@/utils/request";

/**
 * 获取文章详情
 * @group article
 * @route /article/{article_id} [GET]
 * @param {string} pathParams.article_id
 */
export function reqGetArticle(pathParams: {
  article_id: string;
}): AxiosPromise<Record<string, never>> {
  return request({ url: `/article/${pathParams.article_id}`, method: "get" });
}
```

使用生成的 API：

```ts
import { reqGetArticle } from "./api/article";

const data = await reqGetArticle({ article_id: "123" });
```

### 对象式导出（Object Style）

当 `exportStyle` 设置为 `"object"` 时，同一个分组下的接口聚合为一个对象：

```ts
import request from "@/utils/request";

export const reqArticle = {
  reqGetArticle(pathParams: { article_id: string }): AxiosPromise<Record<string, never>> {
    return request({ url: `/article/${pathParams.article_id}`, method: "get" });
  },
  reqPostArticle(data: {
    article_title: string;
    article_content: string;
  }): AxiosPromise<Record<string, never>> {
    return request({ url: "/article", method: "post", data });
  },
};
```

使用生成的 API：

```ts
import { reqArticle } from "./api/article";

const data = await reqArticle.reqGetArticle({ article_id: "123" });
```

## 命令行参数

```bash
apiboost [options]

Options:
  -c, --config <path>  指定配置文件路径 (默认自动查找 apiboost.config.ts/js/mjs)
  -h, --help           显示帮助信息
  -v, --version        显示版本信息
```

apiboost 会自动在项目根目录查找以下配置文件（优先级从上到下）：

1. `apiboost.config.ts`
2. `apiboost.config.js`
3. `apiboost.config.mjs`

## 公开 API

apiboost 也支持作为 Node.js 库编程式调用：

```ts
import { processConfig, loadConfig, genFunctionFile, genObjectFile } from "apiboost";
```

| 导出                      | 类型 | 说明                           |
| ------------------------- | ---- | ------------------------------ |
| `processConfig`           | 函数 | 处理单个配置项（核心生成流程） |
| `loadConfig`              | 函数 | 加载配置文件                   |
| `genFunctionFile`         | 函数 | 生成函数式导出文件内容         |
| `genObjectFile`           | 函数 | 生成对象式导出文件内容         |
| `checkApiboostConfigFile` | 函数 | 检查配置文件是否存在           |
| `ApiboostConfigFileNames` | 常量 | 配置文件名列表                 |
| `ApiboostConfig`          | 类型 | 生成器总配置接口               |
| `RequestImportCfg`        | 类型 | 请求导入配置接口               |

## 数据流

```
OpenAPI/Swagger JSON (sourcePath)
        │
        ▼
@zpeak/openapi-adapter (标准化适配器)
        │
        ▼
StandardGroup[] (标准分组数据)
        │
        ▼
apiboost 生成器 (genFunctionFile / genObjectFile)
        │
        ▼
TypeScript/JavaScript API 代码文件 (outDir)
```

## 开发

```bash
# 安装依赖
pnpm install

# 构建
pnpm build:un

# 运行生成（开发测试）
pnpm test

# 构建并运行
pnpm g

# 代码检查
pnpm lint

# 格式化
pnpm format
```

## License

MIT © [peak](https://zhanggaofeng.cn)
