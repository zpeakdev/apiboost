#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import tls from "node:tls";
import { constants as cryptoConstants } from "node:crypto";
import fse from "fs-extra";
import { processConfig } from "../src/generator/index.js";
import { loadConfig } from "../src/utils/index.js";
import { ApiboostConfigFileNames } from "../src/config.js";
import "tsx/esm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 兼容旧网关 TLS：部分内网/测试环境网关（如 xxx 网关）未实现安全重协商（RFC 5746），
 * Node 17+（OpenSSL 3.x）默认拒绝连接，fetch 会报 ERR_SSL_UNSAFE_LEGACY_RENEGOTIATION_DISABLED。
 * 这里给全局 tls.connect 追加 SSL_OP_LEGACY_SERVER_CONNECT 放行，仅影响本 CLI 进程内的请求。
 */
function enableLegacyTlsRenegotiation(): void {
  // Node 17 以下使用 OpenSSL 1.1.1，默认行为本身允许旧版重协商，无需处理
  if (parseInt(process.versions.node.split(".")[0] ?? "0", 10) < 17) return;

  const originalConnect = tls.connect;
  const patchedConnect = (...args: unknown[]) => {
    const options = args.find(
      (arg): arg is Record<string, unknown> => typeof arg === "object" && arg !== null,
    );
    if (options) {
      options.secureOptions =
        ((options.secureOptions as number) ?? 0) | cryptoConstants.SSL_OP_LEGACY_SERVER_CONNECT;
    }
    return originalConnect.apply(tls, args as Parameters<typeof tls.connect>);
  };
  tls.connect = patchedConnect as typeof tls.connect;
}

enableLegacyTlsRenegotiation();

// 命令行参数解析
interface CliOptions {
  configPath?: string;
  help?: boolean;
  version?: boolean;
}

/**
 * 解析命令行参数
 * @returns
 */
function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--config" || arg === "-c") {
      options.configPath = args[++i]; // 参数值紧跟在选项后面
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--version" || arg === "-v") {
      options.version = true;
    }
  }

  return options;
}

/**
 * 显示帮助信息
 */
function showHelp(): void {
  console.log(`
  apiboost - API前端接口代码生成工具

  用法:
    npx apiboost [选项]

  选项:
    -c, --config <path>  指定配置文件路径 (默认: ./${ApiboostConfigFileNames[0]})
    -h, --help           显示帮助信息
    -v, --version        显示版本信息
  `);
}

/**
 * 显示版本信息
 */
function showVersion(): void {
  try {
    // 从package.json读取版本信息
    const packageStr = fse.readFileSync(path.resolve(__dirname, "../package.json"), "utf8");
    const packageJson = JSON.parse(packageStr);
    console.log(`apiboost v${packageJson.version || "1.0.0"}`);
  } catch (error) {
    console.log(`版本读取失败: ${error}`);
  }
}

/**
 * 主流程
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
  try {
    // 解析命令行参数
    const options = parseArgs();

    // 处理帮助和版本信息
    if (options.help) {
      showHelp();
      return;
    }

    if (options.version) {
      showVersion();
      return;
    }

    // 读取配置
    const configs = await loadConfig(options.configPath);

    if (Array.isArray(configs)) {
      // 处理配置数组
      for (const config of configs) {
        await processConfig(config);
      }
    } else {
      // 处理单个配置
      await processConfig(configs);
    }

    console.log("✅ 全部生成完成。"); // 总结提示
  } catch (e: unknown) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
}

// 仅作为脚本使用：始终执行 main()
main();
