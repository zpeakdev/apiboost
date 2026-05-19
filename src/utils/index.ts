import fse from "fs-extra";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ApiboostConfig } from "../type.js";
import { ApiboostConfigFileNames } from "../config.js";

/**
 * 检查配置文件是否存在
 * @param rootPath 项目根路径
 * @param configFiles 配置文件
 * @returns 文件路径
 */
export function checkApiboostConfigFile(
  rootPath = process.cwd(),
  configFiles = ApiboostConfigFileNames,
): string {
  let fileName = "";

  for (const name of configFiles) {
    const filePath = path.join(rootPath, name);
    if (fse.existsSync(filePath)) {
      fileName = filePath;
      break;
    }
  }

  return fileName;
}

/**
 * 加载生成器配置
 * - 优先使用命令行指定的配置文件路径
 * - 其次从项目根目录读取 apiboost.config
 * - 若都缺失，抛错提示
 */
export async function loadConfig(
  customConfigPath?: string,
): Promise<ApiboostConfig | ApiboostConfig[]> {
  let configFilePath: string = "";
  // 如果指定了自定义配置路径，直接返回
  if (customConfigPath) {
    const resolvedPath = path.resolve(process.cwd(), customConfigPath);
    if (!fse.existsSync(resolvedPath)) {
      // 如果指定的路径不存在，应该抛出错误而不是继续查找
      throw new Error(`❌ 指定的配置文件不存在: ${resolvedPath}`);
    }
    configFilePath = resolvedPath;
  }

  // 在预定义的配置文件名中查找存在的文件
  configFilePath = checkApiboostConfigFile();

  // 如果没有找到配置文件，抛出错误
  if (!configFilePath) {
    throw new Error(`❌ 未找到配置文件：${ApiboostConfigFileNames}`);
  }

  try {
    /**
     * 为什么传递给 import() 的是 pathToFileURL(configFilePath).href 而不是 configFilePath ？
     *
     * ES 模块的 import() 语句（尤其是动态导入）期望接收一个 URL ，而不是一个普通的文件系统路径。
     * pathToFileURL 是 Node.js 内置 url 模块提供的一个工具函数，它的作用就是将一个文件系统路径转换为一个标准的 file:// 协议的 URL 对象。
     *    例如， d:\project\my_study_project\apiboost\apiboost.config.ts 会被转换为 file:///D:/project/my_study_project/apiboost/apiboost.config.ts 这样的 URL
     */
    const { apiboost } = await import(pathToFileURL(configFilePath).href);
    console.log("✔️  使用配置文件:", configFilePath);
    return apiboost;
  } catch (error) {
    console.error("❌ 加载配置文件失败:", error);
    return [];
  }
}
