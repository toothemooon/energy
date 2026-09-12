# Expo SQLite 学习笔记

> 来源：https://docs.expo.dev/versions/latest/sdk/sqlite/
> 版本：Expo SDK 57（推荐版本 ~57.0.3）
> 用途：CalFast 本地饮食记录存储

## 核心概念

expo-sqlite 提供本地 SQLite 数据库能力：
- 数据全部保存在用户设备上
- 数据库在 App 重启后仍然持久化
- 支持 iOS、Android、macOS、tvOS、Web
- 提供异步和同步两套 API

## 为什么选本地 SQLite

| 优势 | 说明 |
|------|------|
| 离线可用 | 不需要网络就能读写记录 |
| 即时读取 | 首页加载不需要等待网络 |
| 隐私安全 | 数据不出设备 |
| MVP 简单 | 不需要后端数据库 |

## 安装

```bash
npx expo install expo-sqlite
```

## 基本用法

### 打开数据库

```ts
import * as SQLite from 'expo-sqlite';

const db = await SQLite.openDatabaseAsync('calFast.db');
```

### 创建表 + 启用 WAL 模式

```ts
await db.execAsync(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS meals (
    id TEXT PRIMARY KEY,
    energy_kcal INTEGER,
    image_uri TEXT,
    created_at TEXT,
    status TEXT
  );
`);
```

> **Tip**: 启用 WAL (Write-Ahead Logging) 模式可以提升性能。

### 插入数据

```ts
const result = await db.runAsync(
  'INSERT INTO meals (id, energy_kcal, image_uri, created_at, status) VALUES (?, ?, ?, ?, ?)',
  [uuid, 642, imageUri, ISODate, 'completed']
);
console.log(result.lastInsertRowId, result.changes);
```

### 查询数据

```ts
// 查询单条
const firstRow = await db.getFirstAsync('SELECT * FROM meals WHERE id = ?', mealId);

// 查询多条
const allRows = await db.getAllAsync('SELECT * FROM meals WHERE created_at LIKE ?', [`${today}%`]);

// 遍历查询（节省内存）
for await (const row of db.getEachAsync('SELECT * FROM meals')) {
  console.log(row.id, row.energy_kcal);
}
```

### 更新数据

```ts
await db.runAsync(
  'UPDATE meals SET energy_kcal = ? WHERE id = ?',
  [700, mealId]
);
```

### 事务操作

```ts
await db.withTransactionAsync(async () => {
  await db.runAsync('INSERT INTO meals ...');
  await db.runAsync('UPDATE meals ...');
});
```

## SQLiteProvider + useSQLiteContext

推荐在 React 组件中使用 Provider 模式：

```tsx
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';

// 在 App 入口包裹 Provider
export default function App() {
  return (
    <SQLiteProvider databaseName="calFast.db" onInit={migrateDbIfNeeded}>
      <Main />
    </SQLiteProvider>
  );
}

// 在子组件中使用 hook 访问数据库
function Main() {
  const db = useSQLiteContext();
  // 直接使用 db 进行查询
}
```

### onInit 迁移

```ts
async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 1;
  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const currentVersion = result?.user_version ?? 0;
  
  if (currentVersion >= DATABASE_VERSION) return;
  
  // 执行迁移
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS meals (...);
  `);
  
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
```

## 数据库设计

### meals 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT (UUID) | 主键 |
| energy_kcal | INTEGER | 能量（kcal） |
| image_uri | TEXT | 原始图片本地路径 |
| created_at | TEXT (ISO 8601) | 记录时间 |
| status | TEXT | processing / completed / error |

### 设计原则

- 每条记录有独立 UUID（方便将来云同步）
- SQLite 访问放在 Repository/Service 层
- 不让页面直接写 SQL

## API 速查表

| 方法 | 用途 |
|------|------|
| `db.execAsync(sql)` | 批量执行 SQL（不转义参数） |
| `db.runAsync(sql, params)` | 写操作（INSERT/UPDATE/DELETE） |
| `db.getFirstAsync(sql, params)` | 查询单条记录 |
| `db.getAllAsync(sql, params)` | 查询多条记录 |
| `db.getEachAsync(sql, params)` | 遍历查询（节省内存） |
| `db.withTransactionAsync(fn)` | 事务操作 |

## 开发工具

在 Expo CLI 终端按 **Shift + M** 打开 dev tools，选择 **Open expo-sqlite** 可以：
- 浏览表结构
- 查看和编辑数据
- 运行 SQL 查询
- 导出数据库

## 参考链接

- [Expo SQLite 官方文档](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [SQLite WAL 模式](https://www.sqlite.org/wal.html)
