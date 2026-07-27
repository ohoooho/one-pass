# one-pass — 一次性密钥分享

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Forked from](https://img.shields.io/badge/forked%20from-jhaals%2Fyopass-orange.svg)](https://github.com/jhaals/yopass)
[![Demo](https://img.shields.io/badge/demo-one--pass.ohoooho.com-brightgreen)](https://one-pass.ohoooho.com)
[![i18n](https://img.shields.io/badge/i18n-zh--CN%20%2B%208%20others-blue)](website/src/shared/locales)

> **Secure secret sharing, made simple.**
> 浏览器本地 OpenPGP 加密，密钥不到服务端；一行命令自托管；
> IM 友好（飞书/钉钉/Slack/Telegram 直接发）。
> Fork 自 [jhaals/yopass](https://github.com/jhaals/yopass)，**默认中文** + 8 种语言。

🔐 **one-pass** 是 [jhaals/yopass](https://github.com/jhaals/yopass) 的 fork，
专门为桃仙 / Dopple 客户打造。核心改动是 **透明加密 UI**：用户在浏览器里
**亲眼看到**密钥（红框 ❌ 不到服务端）和密文（绿框 ✅ 只传这段），
**服务端永远拿不到明文**。

**zero-knowledge 保证**：
- 加密在浏览器本地完成（OpenPGP / openpgp.js）
- 服务端只存密文，永远看不到密钥
- 密钥在 URL `#` 后（fragment），按 HTTP 协议（RFC 3986 §3.5）服务端拿不到
- 服务端日志只记 uuid，不记 IP / UA

**演示 / 部署**：<https://one-pass.ohoooho.com>

---

## 目录

1. [快速开始](#快速开始) — 三种用法：发 / 收 / 自部署
2. [客户端要求](#客户端要求) — 浏览器、OpenPGP 库版本
3. [HTTP API](#http-api) — 服务端的全部端点
4. [服务端命令行](#服务端命令行) — onepass-server 启动参数
5. [自部署](#自部署) — Go 静态二进制 + systemd + Caddy
6. [安全模型](#安全模型) — 4 个保证 + 攻击场景 + 不承诺
7. [故障排查](#故障排查) — 5 个常见 FAQ
8. [i18n 翻译](#i18n-翻译) — 加新语言
9. [贡献](#贡献) — PR 流程 + 测试
10. [开源 & 协议](#开源--协议)

---

## 快速开始

### 与原版 Yopass 的区别

| 维度 | 原版 `jhaals/yopass` | `one-pass`（本 fork） |
|---|---|---|
| **加密 UI** | 黑盒（按钮 + 链接） | 4 步透明（输入 → 密钥 → 密文 → 链接） |
| **解密 UI** | 输入框 → 解密 | 2 步透明（密文 → 密钥） |
| **默认语言** | 英文 | 中文（zh-CN），英文 fallback |
| **`/about` 解释页** | 无 | 有（含 zero-knowledge 硬证据） |
| **零知识证明** | 架构师解释 | UI 直接展示 + F12 自验 |
| **部署** | Docker | 静态二进制 + systemd |

### 用户验证（F12）

1. 打开 <https://one-pass.ohoooho.com/>
2. F12 → Network → 勾选 Preserve log
3. 输入测试明文，点「生成一次性分享链接」
4. **必须看到**：
   - POST 请求 body 是 `-----BEGIN PGP MESSAGE-----` 开头的密文
   - 明文从未出现在任何请求里
5. 红色框里的密钥，浏览器从来没发给服务端（验证：`tcpdump` on 服务端网络接口）

### ① 发送一个 secret（AI / 工程师）

打开 <https://one-pass.ohoooho.com/> → 输入明文 → 点「生成一次性分享链接」→ 把链接给同事。

### ② 接收一个 secret（普通用户）

收到同事发来的链接（形如 `https://one-pass.ohoooho.com/#/s/<uuid>/<key>`）→ 点开 → 看到明文 → 关页面（一次性，已焚）。

### ③ CLI / API（自动化）

```bash
# 一行装（Yopass 官方 CLI）
npm install -g yopass-cli
export YOPASS_URL=https://one-pass.ohoooho.com
echo "sk-abc-12345" | yopass-cli encrypt -   # 输出链接
```

或在 CI / 脚本里直接调 HTTP API（见下）。

---

## 客户端要求

| 项 | 要求 |
|---|---|
| 浏览器 | Chromium / Firefox / Safari 最近 2 年版本（需 Web Crypto + Streams API） |
| JavaScript | 必须开（关 JS 就用不了） |
| OpenPGP 库 | openpgp.js v5.11.3（vendored，浏览器自动加载） |
| 移动端 | iOS Safari 14+ / Android Chrome 90+（已实测） |

不做老 IE 支持、不做 WebView in WeChat。

---

## HTTP API

所有 `/secret` `/file` `/request` 端点都遵循 zero-knowledge 原则——**只接密文 / 文件 / 配置，从来不接明文**。

### 文本 secret / 文件 / pull request

| 类型 | 端点 | 方法 | 说明 |
|---|---|---|---|
| 文本 secret 创建 | `/secret` `/create/secret` | POST | 接收加密后的密文（OIDC-only 路由可配） |
| 文本 secret 读取 | `/secret/<key>` | GET | 返回密文，one_time=true 焚毁 |
| 文本 secret 删除 | `/secret/<key>` | DELETE | |
| secret 状态 | `/secret/<key>/status` | GET | 没去拿就知是不是 one_time |
| 回执（receipt）| `/secret/<key>/receipt` `/file/<key>/receipt` | GET | 阅后回执 |
| 文件上传 | `/create/file` | POST | multipart，base64 编码 |
| 文件下载 | `/file/<key>` | GET |  |
| pull request 创建 | `/request` | POST | A 请求 → B 收到通知 → B 回填 secret |
| pull request 状态 | `/request/<key>` | GET / DELETE |  |
| pull request 回填 | `/request/<key>/secret` | POST | 持有者写入密文 |
| 密钥轮换 | `/request/<key>/key` | PUT |  |

### 创建示例

```bash
# 文本 secret：POST 明文加密后的密文
curl -X POST https://one-pass.ohoooho.com/secret \
  -H "Content-Type: application/json" \
  -d '{
    "message": "-----BEGIN PGP MESSAGE-----\n...\n-----END PGP MESSAGE-----",
    "expiration": 3600,
    "one_time": true
  }'
# → {"message": "<uuid>"}

# 读取：一次返回密文，one_time=true 立刻焚毁
curl https://one-pass.ohoooho.com/secret/<uuid>
# → {"message": "<ciphertext>", "expiration": 3600, "one_time": true}
```

### 管理端点

| 端点 | 方法 | 用途 |
|---|---|---|
| `/health` | GET | 健康检查：`{"server":"one-pass","status":"healthy"}` |
| `/ready` | GET | memcached 是否连接：`{"status":"ready"}` |
| `/config` | GET | 客户端 UI 配置（默认 TTL / max length 等） |
| `/version` | GET | 服务端 commit hash |
| `/logo` | GET | 自定义 logo 二进制（如果有） |
| `/auth/{login,callback,logout,me}` | * | OIDC 流程（可选） |

### 错误码

| 码 | 含义 |
|---|---|
| 400 | 密文格式错、长度超限 |
| 404 | secret 不存在 / 已焚 / 已过期 |
| 413 | 上传文件超 `--max-file-size` |
| 503 | memcached 不可用 |

---

## 服务端命令行

```bash
onepass-server \
  --address 0.0.0.0 \
  --port 1338 \
  --database memcached \      # 或 redis
  --asset-path /opt/onepass/public \
  --memcached 127.0.0.1:11211 \
  --max-length 10000 \
  --max-file-size 1MB \
  --cors-allow-origin "*" \
  --prefetch-secret=true \
  --no-language-switcher=false
```

完整参数：`onepass-server --help`（基于 `pflag`）。

**配置文件**：暂不支持（fork 简化了）。如果要改端口/memcached 就改 systemd unit。

---

## 自部署

### 系统要求

| 项 | 要求 |
|---|---|
| OS | Linux / macOS（amd64 / arm64） |
| Go | 1.21+（仅编译用） |
| Node.js | 18+（仅前端构建） |
| memcached | 1.6+（或 Redis，可选） |
| 磁盘 | 200MB（前端 dist + 二进制） |

### 编译

```bash
# 后端
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
  go build -ldflags "-s -w" -o onepass-server ./cmd/onepass-server

# 前端
cd website && npm install --legacy-peer-deps && npm run build

# 部署
rsync -avz onepass-server root@$DEPLOY_HOST:/opt/onepass/onepass-server
rsync -avz website/dist/ root@$DEPLOY_HOST:/opt/onepass/public/
```

### systemd unit

```ini
[Unit]
Description=one-pass server
After=network.target memcached.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/onepass
ExecStart=/opt/onepass/onepass-server \
  --address 0.0.0.0 --port 1338 \
  --asset-path /opt/onepass/public \
  --memcached 127.0.0.1:11211 \
  --max-length 10000
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### Caddy 反代

```caddy
one-pass.example.com {
  reverse_proxy 127.0.0.1:1338
}
```

memcached 必须跟 onepass-server 在同一台或 LAN，不暴露公网。

---

## 安全模型

### 4 个保证（架构层保证）

1. **加密在客户端**：openpgp.js 在浏览器 Web Crypto 子系统里跑，服务端拿不到 key
2. **fragment 防泄漏**：URL `#` 后 fragment 由浏览器保留（RFC 3986 §3.5），不会发到 server
3. **服务端只存密文**：POST body 的 `message` 字段已经是密文（PGP packet），服务端没法解密
4. **一次性 / 过期**：阅后即焚 + 1h 过期（默认），泄露窗口期短

### 攻击场景 & one-pass 的应对

| 攻击 | 应对 |
|---|---|
| **服务端被攻破** | 攻击者只能拿到密文，没有密钥解不出 |
| **网络中间人** | TLS（Caddy 自动 ACME）保证；客户端 F12 可验 |
| **链接截图分享** | 默认 1h 过期 + 一次性；不在公网长期存 |
| **XSS in our UI** | 客户端 CSP 严格（默认 `script-src 'self'`），用户密钥不进 DOM 持久层 |
| **服务端日志泄漏** | audit log 只记 uuid，不记密钥 / 不记 IP / 不记 UA（除非开启 `--trusted-proxies`） |

### 不承诺

- **服务端代码**本身的安全（请审 PR / 用上游 stable tag）
- **客户端浏览器 / OS** 的安全（自己装 OS update）
- **链接分享的 social engineering** —— 链接一旦转给非预期的人，神仙难救

### 推荐操作

- ✅ TLS（HTTPS）
- ✅ memcached 不暴露公网
- ✅ URL fragment 视为密钥 —— 不要二次截屏
- ✅ 自部署 → 自审代码 + 自动更新 upstream

---

## 故障排查

### Q1: 创建时报 "Message must be PGP encrypted"

说明 `message` 字段不是 PGP 格式。常见原因：
- 前端 build 没跑（dist 里还是旧版）→ `cd website && npm run build`
- 自己 curl POST 时忘记用客户端 encrypt

### Q2: `onepass-server` 启动后日志报 "memcached connection refused"

memcached 没启动 / 端口错。验证：`memcached -d -m 64 -p 11211 -l 127.0.0.1` 然后 `ss -tlnp | grep 11211`。

### Q3: 链接打开是白屏

大概率是浏览器太老（IE 11）或 JS 禁了。F12 看 Console。

### Q4: 服务端报 "prefetch failed"

`--prefetch-secret=true`（默认）让前端 pre-fetch secret 元数据。如果 origin 配置错，CORS 会拦。看 `/config` 的 CORS log。

### Q5: 文件上传 1MB 限制

`--max-file-size` 默认 512KB，调到 `--max-file-size 1MB`。再大需要 license key（上游规则）。

---

## i18n 翻译

`website/src/i18n/locales/` 下每语言一个 JSON。

加新语言：
1. `cp zh-CN.json <new-lang>.json` → 翻译所有 key
2. `website/src/i18n/index.ts` 注册新语言
3. `website/src/components/LanguageSwitcher.tsx` 加按钮
4. PR 给我

key 命名约定：`{Page}.{Component}.{action}`，例 `Create.TextStep.SubmitButton`。

---

## 贡献

### PR 流程

1. fork → 改 → `git commit -m "feat(<scope>): <subject>"` → push → PR
2. CI 跑：`yarn build` + `yarn test` + `go test ./...`
3. 至少一个 reviewer approve
4. squash merge

### 测试

```bash
# 前端
cd website && yarn test       # Vitest
cd website && yarn test:e2e   # Playwright

# 后端
go test ./...                  # 单元测试
go test -tags integration ./...   # 集成测试（要 memcached）
```

### 开发期运行

```bash
# 后端 + memcached
docker run -d --name memcached -p 11211:11211 memcached:1.6
go run ./cmd/onepass-server --memcached localhost:11211 --asset-path website/dist

# 前端
cd website && yarn dev   # http://localhost:5173
```

---

## 开源 & 协议

- **协议**：Apache-2.0（与原版 Yopass 一致）
- **原项目**：<https://github.com/jhaals/yopass>
- **本仓库**：<https://git.dbhys.com/ohoooho/one-pass>
- **GitHub 镜像**：<https://github.com/ohoooho/one-pass>
- **NOTICE 文件**：见 [NOTICE](NOTICE)

## 关联项目

- **桃仙品牌主站**：<https://taoxian.ohoooho.com/>
- **OpenClaw AI 助理 skill**：[one-pass skill](https://git.dbhys.com/dbhys/xiandi-world/src/branch/master/skills/one-pass)（CLI 集成）
- **dotca 监控**：<https://ohoooho.com/>
