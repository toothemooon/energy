# PocketBase JS Routing 学习笔记

> 来源：https://pocketbase.io/docs/js-routing/
> 版本：PocketBase v0.40.3

## 核心概念

PocketBase 使用 **Extend with JavaScript** 功能，可以通过 JS 代码扩展后端功能，包括：
- 自定义路由（Custom Routes）
- 中间件（Middlewares）
- 事件钩子（Event Hooks）

## 创建自定义路由

### 基本语法

使用 `routerAdd()` 函数注册路由：

```js
routerAdd("METHOD", "/path", (e) => {
  // e 是 RequestEvent 对象
  return e.json(200, { "key": "value" })
})
```

### 路由示例

```js
// GET 路径参数
routerAdd("GET", "/hello/{name}", (e) => {
  let name = e.request.pathValue("name")
  return e.json(200, { "message": "Hello " + name })
})

// POST 路由（需要认证）
routerAdd("POST", "/api/myapp/settings", (e) => {
  return e.json(200, { "success": true })
}, $apis.requireAuth())  // 第三个参数是中间件
```

## RequestEvent (e) 的常用方法

### 读取路径参数
```js
let id = e.request.pathValue("id")
```

### 读取查询参数
```js
let search = e.request.url.query().get("search")
```

### 读取请求头
```js
let token = e.request.header.get("Some-Header")
```

### 读取上传文件
```js
// 解析 multipart/form-data 文件
let files = e.findUploadedFiles("image")
// 或获取原始文件
let [mf, mh] = e.request.formFile("image")
```

### 读取请求体
```js
// 方式1：直接读取
let body = e.requestInfo().body
console.log(body.title)

// 方式2：绑定到对象
const data = new DynamicModel({
  someTextField: "",
  someIntValue: 0,
})
e.bindBody(data)
console.log(data.someTextField)
```

### 返回 JSON 响应
```js
e.json(200, { "name": "John" })
```

### 返回错误
```js
throw new BadRequestError("Invalid input")        // 400
throw new UnauthorizedError("Not logged in")      // 401
throw new ForbiddenError("No access")             // 403
throw new NotFoundError("Not found")              // 404
throw new InternalServerError("Server error")     // 500
```

## 中间件 (Middlewares)

### 全局中间件
```js
routerUse((e) => {
  if (e.request.header.get("Something") == "") {
    throw new BadRequestError("Missing header")
  }
  return e.next()
})
```

### 路由级中间件
```js
routerAdd("POST", "/api/myapp/data", (e) => {
  // 业务逻辑
}, $apis.requireAuth())  // 只允许已认证用户
```

### 常用内置中间件
- `$apis.requireAuth()` — 需要登录
- `$apis.requireGuestOnly()` — 只允许未登录
- `$apis.requireSuperuserAuth()` — 需要超级管理员
- `$apis.bodyLimit(limitBytes)` — 设置请求体大小限制

## 文件结构

PocketBase 的 JS 扩展代码通常放在：
```
pb_hooks/
  ├── routes.js      # 自定义路由
  ├── middlewares.js  # 中间件
  └── migrations.js   # 数据库迁移
```

## 本项目需要的路由

根据 v1.md 的 API 设计：

```
POST /api/ai/analyze-food
Content-Type: multipart/form-data

Fields:
  image: File（JPEG/PNG/HEIC）
  locale: "en-US"

Response:
{
  "status": "ok",
  "totalCalories": 680,
  "macros": { ... },
  "items": [ ... ]
}
```

### 路由伪代码

```js
routerAdd("POST", "/api/ai/analyze-food", (e) => {
  // 1. 获取上传的图片
  let files = e.findUploadedFiles("image")
  
  // 2. 假接口：直接返回固定 JSON
  return e.json(200, {
    "status": "ok",
    "totalCalories": 680,
    "macros": {
      "proteinG": 35,
      "carbsG": 78,
      "fatG": 22
    },
    "items": [
      {
        "name": "Grilled chicken",
        "portion": "150g",
        "calories": 280,
        "proteinG": 32,
        "carbsG": 0,
        "fatG": 14
      }
    ],
    "confidence": "medium",
    "assumptions": ["Estimated using a standard restaurant serving"]
  })
})
```

## 参考链接

- [JS Routing 完整文档](https://pocketbase.io/docs/js-routing/)
- [JS Overview](https://pocketbase.io/docs/js-overview)
- [JS Event Hooks](https://pocketbase.io/docs/js-event-hooks)
- [PocketBase JS SDK](https://github.com/pocketbase/js-sdk)
