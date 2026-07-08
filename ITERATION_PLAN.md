# 项目迭代与问题追踪记录

## 优先级定义
- **P0 (阻断)**：核心逻辑错误/报错，必须立即修复。
- **P1 (体验)**：输出结构/提示不佳，影响使用体验。
- **P2 (完善)**：文档、测试、工程化等后续增强。

## 需求与 BUG 追踪
> *状态说明：`待处理` | `开发中` | `测试中` | `已完成`*

- **[P1]**：`StandardBody`|`StandardField` 类型结构调整 [#1] | 待处理
  ```ts
    {
      "type": "object", // 类型 

      "items":StandardField
    }
  
    // 改为下面
    // 让 `items`属性为object

    {
      "type": "object", // 类型 

      // 为 object 时 才有 properties 属性
      "properties":[
        {
          "type":"string"
        },
        {
          "type":"number"
        },
        {
          "type":"array",
          
          // 为 array 时 才有items属性
          "items": StandardField
        }
      ]
    }
  ```
  - 参照  /bonus-plan/export 和 /bonus-plan-field/save 的请求body参数


## 版本发布计划
- **v0.1.x (稳定核心)**：修复 #1, #2。
