# CalFast — Roadmap

> 一句话：拍一张食物照片，AI 告诉你吃了多少卡路里。

## 产品定位

CalFast 不是一个完整的营养百科，而是一个"拍照后快速得到卡路里结果"的饮食记录工具。

核心卖点：**无感记录** — 用户只需拍照，CalFast 就帮他完成记录。

## 技术栈

| 层 | 选型 | 职责 |
|---|---|---|
| 前端 | Expo 57 + React Native + Expo Router | 拍照、压缩、展示结果、本地存储 |
| 本地数据库 | Expo SQLite | 保存饮食记录、历史数据 |
| 后端 | Cloudflare Worker（无状态） | 隐藏 AI Key、转发 AI 请求 |
| AI | 视觉模型（待选型） | 食物识别 + 能量估算 |
| 订阅 | Superwall | 付费墙、购买、恢复购买 |

## 架构流程

```
iOS 小组件（唯一入口）
    ↓
App 拍照页面
    ↓
本地 SQLite 保存待处理状态
    ↓
Cloudflare Worker 转发 AI
    ↓
返回 energyKcal
    ↓
SQLite 自动保存记录
    ↓
首页与历史记录
```

## 阶段划分

### 阶段 1：MVP 最小闭环（11月底）
核心闭环。验证"拍照 → AI 识别 → 自动保存 → 查看记录"。

包含：
- 匿名一键登录（本地 Keychain）
- 极简首次引导（3-4 页）
- 小组件作为唯一拍照入口
- AI 只返回 energyKcal
- 能量调整滑条
- 自动保存记录
- 今日首页
- 简单历史记录
- Superwall 订阅

### 阶段 2：上线后优化
- 锁屏相机扩展（LockedCameraCapture）
- 操作按钮快捷入口
- 更丰富的食物数据
- 数据导出

### 阶段 3（远期）
- 正式账户系统
- 云端同步
- 多设备支持
- AI 教练
- 社交功能

## 开发原则

- **本地优先**：饮食记录全部保存在设备本地，不依赖云端数据库
- **小步验证**：每完成一步都确保能跑通，再进入下一步
- **先跑通再优化**：先用假数据、再接真实接口
- **AI Key 安全**：永远不暴露在客户端，通过 Cloudflare Worker Secret 保存
- **不提前设计**：不需要的功能不写，不提前建表

## 暂不采用

- ❌ PocketBase / Railway（MVP 不需要云端数据库）
- ❌ 正式账户系统
- ❌ 复杂同步机制
- ❌ 云端饮食数据库

## 将来迁移规则

- 每条本地记录生成独立 UUID
- SQLite 访问放在 Repository/Service 层，不让页面直接写 SQL
- AI 返回格式固定，只保留 energyKcal
- 不把 Cloudflare Worker 代码和 App UI 混在一起
- 将来需要云同步时，再增加 Remote Repository 或迁移到 PocketBase
