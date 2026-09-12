# Cloudflare Worker 学习笔记

> 来源：https://developers.cloudflare.com/workers/
> 用途：作为 CalFast 的无状态后端，转发 AI 请求

## 核心概念

Cloudflare Worker 是一个**无状态**的边缘计算服务：
- 不保存数据
- 不需要数据库
- 只负责接收请求、调用 AI、返回结果
- AI Key 通过 Worker Secret 保存，不暴露给客户端

## 为什么选 Cloudflare Worker

| 优势 | 说明 |
|------|------|
| 免费额度 | 每天 10 万次请求，足够 MVP |
| 无服务器维护 | 不需要管 Railway、持久化、备份 |
| Secret 安全 | AI Key 存在 Worker 环境变量中 |
| 低延迟 | 边缘节点，全球加速 |

## Worker 代码结构

```
worker/
  ├── src/
  │   └── index.ts      # Worker 入口
  ├── wrangler.toml      # 配置文件
  └── package.json
```

## 基本示例

```ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 只处理 POST 请求
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // 获取上传的图片
    const formData = await request.formData();
    const image = formData.get("image") as File;

    // 调用 AI（使用 env.AI_KEY）
    const result = await callAI(image, env.AI_KEY);

    // 返回简单 JSON
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
```

## 环境变量（Secrets）

在 Worker 中保存敏感信息：

```bash
# 设置 Secret
wrangler secret put AI_KEY
# 输入 API Key
```

在代码中访问：

```ts
env.AI_KEY  // 就是设置的值
```

## 部署命令

```bash
# 安装 wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 开发模式（本地测试）
wrangler dev

# 部署到线上
wrangler deploy
```

## 注意事项

- Worker 是无状态的，不要在内存中保存用户数据
- AI 调用是同步的，需要等待结果返回
- 免费计划有 CPU 时间限制（10ms），但网络等待不计入
- 请求体上限足够大，压缩后的 JPEG 没问题

## 参考链接

- [Workers 入门](https://developers.cloudflare.com/workers/get-started/guide/)
- [Workers 限流](https://developers.cloudflare.com/workers/platform/limits/)
- [Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
