# CalFast — Roadmap

> 一句话：拍一张食物照片，AI 告诉你吃了多少卡路里。

## 产品定位

CalFast 不是一个完整的营养百科，而是一个"拍照后快速得到卡路里结果"的饮食记录工具。

核心卖点：**无感记录** — 用户只需拍照，CalFast 就帮他完成记录。

## 技术路线

**Expo-first，不是 Expo-only**

```
CalFast
│
├── React Native / Expo（80-90%）
│   ├── UI
│   ├── Navigation (Expo Router)
│   ├── Camera (expo-camera)
│   ├── Image Manipulation (expo-image-manipulator)
│   ├── API (fetch)
│   ├── PocketBase SDK
│   ├── Analytics
│   └── Widget UI (expo-widgets)
│
└── Native iOS Layer（10-20%）
    ├── App Intents
    ├── Siri / Shortcuts
    ├── Action Button
    └── LockedCameraCapture
```

## 技术栈

| 层 | 选型 | 职责 |
|---|---|---|
| 前端 | Expo 57 + React Native + Expo Router | 拍照、压缩、展示结果 |
| 后端 | PocketBase（自定义 API + 数据库） | 匿名认证、AI 路由、数据存储 |
| 部署 | Railway | PocketBase 托管 |
| AI | 视觉模型（待选型） | 食物识别 + 能量估算 |
| Widget | expo-widgets | Home Screen + Lock Screen Widget |
| 原生 | Swift（少量） | App Intents、Siri、LockedCameraCapture |
| 订阅 | RevenueCat | 付费墙、购买、恢复购买 |

## 阶段划分（6 个阶段）

### Phase 1：AI Magic（9/13 - 9/20）
验证"照片能稳定到达结果页"。

包含：
- 拍照/选图
- 图片压缩
- 上传到 PocketBase
- AI 识别返回 energyKcal
- 显示结果

**Gate 1**：拍一份真实食物 → 手机上传 → AI → CalFast 显示 calories

### Phase 2：Real Tracker（9/21 - 10/5）
从 AI Demo 变成真正的卡路里追踪器。

包含：
- AI 结果可编辑/确认
- 保存饮食记录
- 今日首页
- 历史记录
- 用户引导
- 匿名登录

**Gate 2**：连续一天只用 CalFast：早餐/午餐/晚餐拍照 → 保存 → Today 正确显示

### Phase 3：Quick Track（10/6 - 10/14）
建立统一的"快速记录"入口。

包含：
- Deep Link（/scan）
- Home Screen Widget
- Lock Screen Widget

### Phase 4：Native（10/15 - 10/21）
解锁 iOS 系统级入口。

包含：
- App Intent（TrackFoodIntent）
- Siri / Shortcuts
- Back Tap
- Action Button

### Phase 5：LockedCameraCapture（10/22 - 10/26）
锁屏直接相机扩展（Stretch Goal）。

如果超过 5 天 → 砍掉 → v1.1

### Phase 6：Monetization（10/27 - 11/2）
建立收费墙。

包含：
- RevenueCat 集成
- App Store IAP
- Free → Paywall → Pro
- 免费额度控制

## 开发原则

- **Expo-first**：优先使用 Expo 生态，只在必要时用 Swift
- **小步验证**：每完成一个 Gate 再进入下一阶段
- **先跑通再优化**：先用假数据、再接真实接口
- **AI Key 安全**：永远不暴露在客户端
- **不提前设计**：不需要的功能不写，不提前建表

## 参考资料

- [expo-widgets](https://docs.expo.dev/versions/latest/sdk/widgets/)
- [App Intents](https://developer.apple.com/documentation/appintents)
- [RevenueCat](https://www.revenuecat.com/docs)
