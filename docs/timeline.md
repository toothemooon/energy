# CalFast 开发时间线

> 起始日期：9/13
> App Store 提交：≤ 11/20
> 上线日期：11/30

## 三个内部 Deadline

| 日期 | 里程碑 | 说明 |
|------|--------|------|
| **10/5** | Core MVP | Calorie Tracker 本身完整可用 |
| **11/2** | Commercial MVP | 快速入口 + 真实订阅全部跑通 |
| **11/20** | Release Candidate | App Store Submit |

## 详细时间线

### Phase 1：AI Magic（9/13 - 9/20）

```
9/13 ───────────── 9/20
Photo → Upload → AI → Result
```

| 日期 | 任务 |
|------|------|
| 9/13 - 9/14 | Image Compression |
| 9/15 - 9/16 | FormData / PocketBase Upload |
| 9/17 - 9/19 | AI Analyze API |
| 9/20 | Result Screen + Gate 1 验证 |

### Phase 2：Real Tracker（9/21 - 10/5）

```
9/21 ───────────── 10/5
Meal / Today / History / Onboarding
```

| 日期 | 任务 |
|------|------|
| 9/21 - 9/22 | Confirm / Edit |
| 9/23 - 9/24 | Meal CRUD |
| 9/25 - 9/26 | Today Screen |
| 9/27 - 9/28 | History Screen |
| 9/29 - 9/30 | Goal Setting |
| 10/1 - 10/5 | Onboarding + Auth + Gate 2 验证 |

### Phase 3：Quick Track（10/6 - 10/14）

```
10/6 ───────────── 10/14
Quick Track + Widget
```

| 日期 | 任务 |
|------|------|
| 10/6 - 10/7 | Quick Track / Deep Link |
| 10/8 - 10/10 | Home Screen Widget |
| 10/11 - 10/12 | Lock Screen Widget |
| 10/13 - 10/14 | Widget 测试 + 修复 |

### 10/15：约 70% → Waitlist 公开

### Phase 4：Native（10/15 - 10/21）

```
10/15 ───────────── 10/21
App Intent / Siri / Back Tap / Action Button
```

| 日期 | 任务 |
|------|------|
| 10/15 - 10/17 | App Intent (TrackFoodIntent) |
| 10/18 - 10/19 | Siri / Shortcuts |
| 10/20 | Back Tap |
| 10/21 | Action Button |

### Phase 5：LockedCameraCapture（10/22 - 10/26）

```
10/22 ───────────── 10/26
LockedCameraCapture（Stretch Goal）
```

| 日期 | 任务 |
|------|------|
| 10/22 - 10/26 | 锁屏相机扩展（如果超 5 天 → 砍掉 → v1.1） |

### Phase 6：Monetization（10/27 - 11/2）

```
10/27 ───────────── 11/2
RevenueCat / IAP
```

| 日期 | 任务 |
|------|------|
| 10/27 - 10/29 | RevenueCat 集成 |
| 10/30 - 11/1 | App Store IAP 配置 |
| 11/2 | Commercial MVP 验证 |

### Phase 7：QA + Submit（11/3 - 11/20）

```
11/3 ───────────── 11/10
Commercial MVP QA

11/11 ───────────── 11/18
TestFlight

≤ 11/20
App Store Submit
```

| 日期 | 任务 |
|------|------|
| 11/3 - 11/10 | Commercial MVP QA |
| 11/11 - 11/18 | TestFlight 测试 |
| ≤ 11/20 | App Store Submit |

### 上线

```
11/30
App Store Live
```

## 关键里程碑

```
9/20  ── Gate 1：AI Magic 完成
10/5  ── Gate 2：Core MVP 完成
10/15 ── Waitlist 公开（约 70%）
11/2  ── Gate 3：Commercial MVP 完成
11/20 ── App Store Submit
11/30 ── App Store Live
```

## 注意事项

- 每完成一个 Gate 再进入下一阶段
- LockedCameraCapture 如果卡超过 5 天 → 砍掉 → v1.1
- 10/15 Waitlist 公开时，确保核心功能可用
- 11/20 是提交截止日，不是开发截止日
