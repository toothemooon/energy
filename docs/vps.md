# CalFast VPS 部署、TestFlight 与维护手册

> 适用项目：CalFast / energy  
> 更新时间：2026-09-16  
> 目标：将 PocketBase 部署到 Vultr VPS，并让 TestFlight 真机完成“拍照 → AI 分析 → 首页显示结果”。

## 0. 当前架构

~~~text
iPhone / TestFlight App
        |
        | HTTPS
        v
Caddy（80 / 443，TLS）
        |
        | 反向代理到 127.0.0.1:8090
        v
PocketBase（Custom Route / pb_hooks）
        |
        | HTTPS + DEEPSEEK_API_KEY
        v
DeepSeek Responses API
~~~

当前数据流：

~~~text
App 拍照或选择图片
  ↓
App 压缩 JPEG 并转换为 Base64 Data URL
  ↓
App POST JSON 到 PocketBase
  ↓
PocketBase 调用 DeepSeek Responses API
  ↓
PocketBase 解析 AI 文本并返回 Analysis JSON
  ↓
App 显示总热量和最近餐食
~~~

### 当前 VPS 配置

| 项目 | 当前值 |
|---|---|
| 服务商 | Vultr |
| 计划 | Shared CPU vc2-1c-1gb |
| CPU / 内存 | 1 vCPU / 1 GB |
| 磁盘 | 25 GB |
| 区域 | Seattle, US |
| 系统 | Ubuntu 26.04 LTS x64 |
| 当前公网 IPv4 | 137.220.33.136，以 Vultr 控制台为准 |
| 登录用户 | linuxuser |
| 主机名 / Label | energy-vps |
| PocketBase 内部端口 | 127.0.0.1:8090 |
| Vultr Firewall Group | test，上线前确认规则 |
| 其他服务 | Outline，与本项目共用 VPS |

公网 IP 可能变化。正式 App 应使用域名，例如：

~~~text
https://api.example.com
~~~

## 1. 安全边界

以下内容不能提交到 GitHub，也不能放进 App：

- DEEPSEEK_API_KEY
- SSH 私钥 ~/.ssh/id_ed25519
- PocketBase 的 pb_data/
- PocketBase 管理员密码或 Token
- 完整 Base64 图片

PocketBase 只监听本机的 8090，公网请求统一通过 Caddy 的 HTTPS 进入：

~~~text
App → HTTPS → Caddy → 127.0.0.1:8090 → PocketBase
~~~

不要把 8090 加到公网防火墙规则中。

由于 VPS 同时运行 Outline，不能随意关闭或覆盖 Outline 使用的端口。特别要确认 Outline 是否占用 80 或 443。

## 2. 开始前的本地准备

### 2.1 保存当前可运行版本

在 App 项目目录执行：

~~~bash
cd /Users/allen/Documents/GitHub/energy
npx tsc --noEmit
git status --short
~~~

确认：

- TypeScript 没有错误
- 当前本地 AI 流程仍能运行
- API Key 没有写入 App
- 当前版本已经保存，后续可以回滚

### 2.2 确认 PocketBase 版本和架构

在 Mac 后端目录执行：

~~~bash
cd /Users/allen/Documents/GitHub/energy_backend/pocketbase
./pocketbase --version
file ./pocketbase
~~~

当前本地二进制是 macOS ARM64，不能上传到 Ubuntu VPS。

登录 VPS 后确认：

~~~bash
uname -m
~~~

当前 Vultr 方案预期返回：

~~~text
x86_64
~~~

因此需要 PocketBase 的 linux_amd64 版本。

## 3. Vultr 控制台检查

### 3.1 实例

确认以下项目：

- 实例状态为 Running
- 有公网 IPv4
- SSH Key 是 energy-vultr
- 系统是 Ubuntu x64
- 登录用户是 linuxuser
- Instance Connectivity 是 Public IPv4
- VPC 暂时关闭
- Automatic Backups 当前可以关闭

### 3.2 Vultr Firewall Group

在 Vultr 控制台打开：

~~~text
Products → Network → Firewall → test
~~~

根据实际服务检查入站规则：

| 端口 | 用途 | 建议 |
|---:|---|---|
| 22/tcp | SSH | 最好限制为自己的公网 IP |
| 80/tcp | Caddy / Let's Encrypt | 允许公网 |
| 443/tcp | Caddy HTTPS | 允许公网 |
| Outline 实际端口 | Outline 代理 | 按实际配置保留 |
| 8090/tcp | PocketBase 原始端口 | 不开放公网 |

出站规则至少要允许 HTTPS 443，使 PocketBase 能访问 DeepSeek。

修改防火墙时保留当前 SSH 连接，并从第二个终端测试新的 SSH 连接成功后再关闭旧连接。

官方参考：[Vultr Firewall Groups](https://docs.vultr.com/products/network/firewall-groups/management/groups)

## 4. VPS 初始化

### 4.1 登录并确认系统

在 Mac 执行：

~~~bash
ssh -i ~/.ssh/id_ed25519 linuxuser@137.220.33.136
~~~

进入 VPS 后执行：

~~~bash
whoami
hostname
uname -m
cat /etc/os-release | grep PRETTY_NAME
~~~

### 4.2 更新系统

~~~bash
sudo apt update
sudo apt upgrade -y
~~~

如果更新了内核，可以稍后执行：

~~~bash
sudo reboot
~~~

重启后重新 SSH 登录。

### 4.3 安装基础工具

~~~bash
sudo apt install -y curl unzip rsync ca-certificates gnupg ufw jq
~~~

### 4.4 检查资源和端口

~~~bash
free -h
df -h
sudo ss -lntup
~~~

重点查看：

- Outline 已使用多少内存
- 磁盘剩余空间
- 80、443、8090 是否已被占用

1 GB 内存同时运行 Outline、PocketBase 和 Caddy 比较紧张。先观察实际使用情况；如果出现 OOM，再考虑增加 VPS 内存或配置 swap。

### 4.5 可选：配置 1 GB swap

先确认是否已有 swap：

~~~bash
swapon --show
~~~

只有确认没有 swap 且内存不足时再执行：

~~~bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
~~~

swap 只是内存不足时的缓冲，不等于真正增加内存。

## 5. Ubuntu UFW 防火墙

先查看状态：

~~~bash
sudo ufw status verbose
~~~

启用前必须先放行 SSH：

~~~bash
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP for Caddy'
sudo ufw allow 443/tcp comment 'HTTPS for Caddy'
~~~

Outline 的端口必须根据实际配置添加。例如确认端口是 12345 且需要 TCP 时：

~~~bash
sudo ufw allow 12345/tcp comment 'Outline'
~~~

不要把 12345 当成固定端口。

启用 UFW：

~~~bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw enable
sudo ufw status numbered
~~~

然后从 Mac 新开终端测试 SSH：

~~~bash
ssh -i ~/.ssh/id_ed25519 linuxuser@137.220.33.136
~~~

官方参考：[Ubuntu Firewall / UFW](https://ubuntu.com/server/docs/how-to/security/firewalls/)

## 6. 部署 PocketBase

### 6.1 创建服务用户和目录

~~~bash
sudo groupadd --system energy-pb
sudo useradd --system --gid energy-pb --home-dir /opt/energy/pocketbase --shell /usr/sbin/nologin energy-pb
sudo mkdir -p /opt/energy/pocketbase/pb_hooks
sudo mkdir -p /opt/energy/pocketbase/pb_data
sudo chown -R energy-pb:energy-pb /opt/energy/pocketbase
~~~

目录结构：

~~~text
/opt/energy/pocketbase/
├── pocketbase       # Linux x86_64 二进制
├── pb_hooks/        # main.pb.js 等 Hook
└── pb_data/         # PocketBase 数据，不能提交 Git
~~~

### 6.2 下载 Linux PocketBase

先在 Mac 查看开发版本：

~~~bash
cd /Users/allen/Documents/GitHub/energy_backend/pocketbase
./pocketbase --version
~~~

在 VPS 使用兼容的 PocketBase 版本。下面的版本号是示例，部署前应以实际版本为准：

~~~bash
cd /tmp
PB_VERSION='0.40.4'
curl -fL -o pocketbase.zip "https://github.com/pocketbase/pocketbase/releases/download/v$PB_VERSION/pocketbase_$PB_VERSION_linux_amd64.zip"
unzip -o pocketbase.zip pocketbase
sudo install -o energy-pb -g energy-pb -m 0755 pocketbase /opt/energy/pocketbase/pocketbase
/opt/energy/pocketbase/pocketbase --version
~~~

不要把 Mac ARM64 二进制覆盖到 VPS。

PocketBase 官方参考：[Going to production](https://pocketbase.io/docs/going-to-production/)

### 6.3 上传 pb_hooks

在 Mac 的另一个终端执行：

~~~bash
cd /Users/allen/Documents/GitHub/energy_backend/pocketbase
rsync -av --exclude 'pocketbase' --exclude 'pb_data' pb_hooks/ linuxuser@137.220.33.136:/home/linuxuser/energy-pb-hooks/
~~~

回到 VPS：

~~~bash
sudo rsync -av /home/linuxuser/energy-pb-hooks/ /opt/energy/pocketbase/pb_hooks/
sudo chown -R energy-pb:energy-pb /opt/energy/pocketbase/pb_hooks
sudo find /opt/energy/pocketbase/pb_hooks -maxdepth 2 -type f -print
~~~

这里只同步 Hook，不同步本地二进制和 pb_data。

### 6.4 配置 DeepSeek API Key

创建环境文件：

~~~bash
sudo touch /etc/energy-pb.env
sudo chown root:energy-pb /etc/energy-pb.env
sudo chmod 640 /etc/energy-pb.env
sudo nano /etc/energy-pb.env
~~~

文件内容：

~~~text
DEEPSEEK_API_KEY=你的真实APIKey
~~~

不要使用 echo 把真实 Key 写进命令行，避免进入 shell history。

### 6.5 创建 systemd 服务

~~~bash
sudo nano /etc/systemd/system/energy-pocketbase.service
~~~

写入：

~~~ini
[Unit]
Description=Energy PocketBase backend
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=energy-pb
Group=energy-pb
WorkingDirectory=/opt/energy/pocketbase
EnvironmentFile=/etc/energy-pb.env
ExecStart=/opt/energy/pocketbase/pocketbase serve --http=127.0.0.1:8090
Restart=always
RestartSec=5
LimitNOFILE=4096

[Install]
WantedBy=multi-user.target
~~~

加载并启动：

~~~bash
sudo systemctl daemon-reload
sudo systemctl enable energy-pocketbase
sudo systemctl start energy-pocketbase
sudo systemctl status energy-pocketbase --no-pager
~~~

查看日志：

~~~bash
sudo journalctl -u energy-pocketbase -n 100 --no-pager
~~~

本机检查：

~~~bash
curl -i http://127.0.0.1:8090/api/health
~~~

### 6.6 PocketBase 管理后台

管理后台路径：

~~~text
/_/
~~~

配置 Caddy 后，通过以下地址访问：

~~~text
https://api.example.com/_/
~~~

管理员密码不要和 SSH 密钥口令或 DeepSeek API Key 共用。

### 6.7 Hook 部署检查

确认 main.pb.js：

- 路由是 POST /api/analyze-food
- 接收 JSON 的 image 字段
- 使用 $os.getenv("DEEPSEEK_API_KEY")
- 使用 DeepSeek Responses API
- 使用 reasoning.effort: "none"
- 使用 tool_choice: "none"
- 返回统一的 Analysis JSON
- 不把完整 Base64 图片写入日志
- 不把完整 AI 原始响应写入生产日志

## 7. 域名和 HTTPS

### 7.1 配置 DNS

在域名服务商添加 A 记录：

~~~text
主机记录：api
类型：A
值：137.220.33.136
~~~

在 Mac 检查：

~~~bash
dig +short api.example.com
~~~

返回当前 VPS IP 后再继续。

### 7.2 检查端口冲突

~~~bash
sudo ss -lntup | grep -E ':(80|443|8090)\b'
~~~

推荐分工：

~~~text
Caddy       80 / 443
PocketBase  127.0.0.1:8090
Outline     自己的实际端口
~~~

如果 Outline 占用 80 或 443，不要直接杀进程；先调整代理方案。

### 7.3 安装 Caddy

~~~bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg
sudo chmod o+r /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
~~~

官方参考：[Caddy Install](https://caddyserver.com/docs/install)

### 7.4 配置反向代理

~~~bash
sudo nano /etc/caddy/Caddyfile
~~~

将域名替换为自己的真实域名：

~~~text
api.example.com {
    request_body {
        max_size 10MB
    }

    reverse_proxy 127.0.0.1:8090 {
        transport http {
            read_timeout 360s
        }
    }
}
~~~

验证并加载：

~~~bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
sudo systemctl enable caddy
sudo systemctl status caddy --no-pager
sudo journalctl -u caddy -n 100 --no-pager
~~~

Caddy 需要 DNS 正确，且 80 / 443 能从公网访问，才能申请和续期证书。

### 7.5 外部 HTTPS 测试

在 Mac 执行：

~~~bash
curl -i https://api.example.com/api/health
curl -i https://api.example.com/hello/world
~~~

调试 Key 状态接口只能临时使用：

~~~bash
curl -i https://api.example.com/api/debug/key-status
~~~

验证完成后应删除或限制该接口，避免向公网暴露服务器是否配置了 Key。

## 8. App 接入 VPS

### 8.1 修改 API 地址

当前 src/services/api.ts 使用的是：

~~~text
http://localhost:8090
~~~

TestFlight 必须使用：

~~~text
https://api.example.com
~~~

需要检查的请求包括：

- testConnection
- analyzeFood
- 后续新增的 PocketBase 请求

建议将 API 根地址集中管理，避免多个函数分别写 URL。

### 8.2 公网链路验证

先不要改首页 UI，使用当前调试页面验证：

~~~text
App
→ HTTPS 域名
→ Caddy
→ 127.0.0.1:8090
→ PocketBase
→ DeepSeek
→ Analysis JSON
→ App Console
~~~

确认一次真实图片分析成功后，再开始 v1.5 UI。

## 9. 执行 v1.5 前需要准备

### 9.1 前置清单

- [ ] 本地 npx tsc --noEmit 通过
- [ ] 本地图片压缩和 Base64 转换正常
- [ ] PocketBase VPS 服务正常运行
- [ ] Caddy HTTPS 正常
- [ ] App API 地址已从 localhost 改为 HTTPS 域名
- [ ] App 可以通过公网完成一次 AI 分析
- [ ] DeepSeek Key 只存在于 VPS
- [ ] Vultr Firewall 保留 Outline 端口
- [ ] PocketBase 8090 未暴露公网
- [ ] 当前稳定版本已保存

### 9.2 v1.5 范围

目标首页：

~~~text
Safe Area
├── CalFast + 设置入口占位
├── Today + 总热量
├── Take a photo
├── Recent meal
└── Home / History
~~~

推荐顺序：

1. 首页视觉骨架
2. 整合 Take a photo，删除 hi、test、Press Me
3. 将 Analysis 显示到首页
4. 显示 Recent meal 图片、热量和时间
5. 整理 Home / History 导航

每个任务后执行：

~~~bash
npx tsc --noEmit
~~~

### 9.3 当前暂不做

- JSON 校验
- 请求重试
- meal_logs 数据库
- 用户登录
- History 真实数据
- 订阅和付费墙

这些功能不应阻塞 v1.5 首页和真机链路验证。

## 10. TestFlight 准备

### 10.1 Apple 和 App Store Connect

需要：

- 付费 Apple Developer 账号
- App Store Connect 权限
- App Store Connect 中的 App 记录
- 唯一的 iOS Bundle Identifier

当前 app.json 的 ios 配置还缺少正式的 Bundle Identifier，例如：

~~~json
"bundleIdentifier": "com.yourname.calfast"
~~~

Bundle Identifier 必须和 App Store Connect 保持一致，且不能与其他 App 重复。

官方参考：[Expo SDK 57 App configuration](https://docs.expo.dev/versions/v57.0.0/config/app/)

### 10.2 ImagePicker 权限

确认 iOS 相册和相机权限说明。修改原生权限配置后，必须创建新的 iOS build，旧 TestFlight 包不会自动更新。

官方参考：[Expo SDK 57 ImagePicker](https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/)

### 10.3 EAS

完成：

- 登录 Expo / EAS
- 将项目关联到 EAS project
- 创建 eas.json
- 配置 production profile
- 配置 iOS build credentials
- 设置 App 版本号和 build number

官方参考：[EAS Build](https://docs.expo.dev/build/introduction/)

### 10.4 构建和提交

在 App 项目目录执行：

~~~bash
eas build --platform ios --profile production
eas submit --platform ios
~~~

构建前确认：

- API 地址是 HTTPS 域名
- 没有使用 localhost
- App 没有包含 DeepSeek API Key
- 每次新上传的 build number 已递增

### 10.5 真机验证

安装 TestFlight 后验证：

- [ ] App 可以安装和启动
- [ ] 相机权限正常
- [ ] 相册权限正常
- [ ] Take a photo 可以打开相机
- [ ] 可以完成 JPEG 压缩和 Base64 转换
- [ ] HTTPS 请求可以到达 VPS
- [ ] PocketBase 能调用 DeepSeek
- [ ] App 收到结构化 Analysis
- [ ] 首页显示总热量
- [ ] Recent meal 显示图片和结果

个人开发阶段先使用 TestFlight 内部测试，不需要马上邀请外部测试人员。

官方参考：[TestFlight](https://docs.expo.dev/submit/testflight/)

## 11. 监控

### 11.1 服务状态和日志

~~~bash
sudo systemctl is-active energy-pocketbase
sudo systemctl status energy-pocketbase --no-pager
sudo journalctl -u energy-pocketbase -n 100 --no-pager
sudo journalctl -u energy-pocketbase -f
~~~

Caddy：

~~~bash
sudo systemctl is-active caddy
sudo systemctl status caddy --no-pager
sudo journalctl -u caddy -n 100 --no-pager
curl -fsS https://api.example.com/api/health
~~~

### 11.2 资源监控

~~~bash
uptime
free -h
df -h
top
sudo ss -s
~~~

重点关注：

- 内存接近 100%
- OOM 或进程被杀死
- 磁盘超过 80%
- PocketBase / Caddy 频繁重启
- Outline 延迟明显增加

### 11.3 日志原则

应记录：

- 请求是否到达 PocketBase
- DeepSeek HTTP 状态码
- JSON 是否解析成功
- 请求耗时
- 错误类型

不应记录：

- 完整 Base64 图片
- API Key
- PocketBase 管理员 Token
- 不必要的完整 AI 原始响应

## 12. 维护

### 12.1 Hook 更新

本地修改 pb_hooks 后：

1. 本地测试并提交 Git
2. 只上传 pb_hooks
3. VPS 备份当前 Hook
4. 替换 Hook
5. 重启 PocketBase
6. 检查日志、健康接口和真实分析

备份当前 Hook：

~~~bash
sudo mkdir -p /opt/energy/backups
sudo cp -a /opt/energy/pocketbase/pb_hooks "/opt/energy/backups/pb_hooks-$(date +%Y%m%d-%H%M%S)"
~~~

重启：

~~~bash
sudo systemctl restart energy-pocketbase
sudo systemctl status energy-pocketbase --no-pager
sudo journalctl -u energy-pocketbase -n 100 --no-pager
~~~

### 12.2 PocketBase 二进制更新

更新前：

1. 查看当前版本
2. 阅读对应版本的变更说明
3. 备份 pb_data
4. 下载 Linux x86_64 新版本
5. 停止服务
6. 替换二进制
7. 启动服务
8. 检查日志和 API

不要删除 pb_data。二进制、Hook 和数据是三类不同内容：

~~~text
二进制更新 ≠ Hook 更新 ≠ 数据库迁移
~~~

### 12.3 PocketBase 数据备份

当前 v1.5 还没有保存 meal_logs，暂时不需要复杂备份策略。开始保存真实数据后，至少要有：

- PocketBase 内置备份，或
- 定期备份 pb_data，或
- 独立 S3 兼容对象存储

不要只把备份放在同一台 VPS 上。重要数据阶段最好测试过一次恢复流程。

官方参考：[PocketBase Backup and Restore](https://pocketbase.io/docs/going-to-production/)

### 12.4 Vultr Automatic Backups

当前可以关闭 Automatic Backups 以节省费用。后续开始保存真实用户数据、登录信息和历史记录后再开启。

~~~text
Vultr Backup       → 恢复整台 VPS
PocketBase Backup  → 恢复 PocketBase 数据
~~~

两者用途不同，不能完全互相替代。

### 12.5 API Key 轮换

~~~bash
sudo nano /etc/energy-pb.env
sudo systemctl restart energy-pocketbase
sudo journalctl -u energy-pocketbase -n 50 --no-pager
~~~

轮换后使用 App 重新执行一次分析，不要把新 Key 写入 Git 或日志。

### 12.6 App 更新

~~~bash
npx tsc --noEmit
eas build --platform ios --profile production
eas submit --platform ios
~~~

每次新的 TestFlight 构建都要递增 build number。

## 13. 故障排查顺序

### App 无法连接

~~~text
App API URL
  ↓
DNS
  ↓
Vultr Firewall
  ↓
UFW
  ↓
Caddy
  ↓
PocketBase
~~~

命令：

~~~bash
curl -i https://api.example.com/api/health
sudo systemctl status caddy --no-pager
sudo systemctl status energy-pocketbase --no-pager
sudo ss -lntup
~~~

### PocketBase 返回 500

~~~bash
sudo journalctl -u energy-pocketbase -n 200 --no-pager
~~~

依次检查：

- DEEPSEEK_API_KEY 是否存在
- systemd 是否读取 EnvironmentFile
- main.pb.js 是否成功加载
- DeepSeek URL、请求体和模型是否正确
- JSON 文本是否成功解析
- VPS 是否能访问外网 443

### 内存不足

~~~bash
free -h
top
sudo journalctl -k | grep -i -E 'oom|out of memory'
~~~

先检查 Outline 和 PocketBase 的资源使用，再决定配置 swap 或升级到 2 GB VPS。

## 14. 推荐执行顺序

不要一次执行全部命令，每完成一阶段就验证：

~~~text
1. SSH 登录 VPS
2. 系统更新和资源检查
3. Vultr Firewall + UFW
4. 部署 Linux PocketBase
5. 配置 DEEPSEEK_API_KEY
6. systemd 启动 PocketBase
7. 配置 DNS
8. Caddy + HTTPS
9. curl 测试公网 API
10. App API 地址改为 HTTPS 域名
11. App 完成一次公网 AI 分析
12. 配置 EAS / TestFlight
13. 真机完成完整流程
14. 开始执行 docs/v1.5.md
~~~

## 15. 官方文档

- [PocketBase Going to production](https://pocketbase.io/docs/going-to-production/)
- [PocketBase JavaScript routing](https://pocketbase.io/docs/js-routing/)
- [Caddy Install](https://caddyserver.com/docs/install)
- [Caddy Running](https://caddyserver.com/docs/running)
- [Ubuntu Firewall / UFW](https://ubuntu.com/server/docs/how-to/security/firewalls/)
- [Vultr Firewall Groups](https://docs.vultr.com/products/network/firewall-groups/management/groups)
- [Expo SDK 57 App configuration](https://docs.expo.dev/versions/v57.0.0/config/app/)
- [Expo SDK 57 ImagePicker](https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [Expo TestFlight](https://docs.expo.dev/submit/testflight/)

