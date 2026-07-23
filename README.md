# one-pass — 一次性密钥分享

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Forked from](https://img.shields.io/badge/forked%20from-jhaals%2Fyopass-orange.svg)](https://github.com/jhaals/yopass)

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

## 与原版 Yopass 的区别

| 维度 | 原版 jhaals/yopass | one-pass（fork） |
|---|---|---|
| **加密 UI** | 黑盒（按钮 + 链接） | 4 步透明（输入 → 密钥 → 密文 → 链接） |
| **解密 UI** | 输入框 → 解密 | 2 步透明（密文 → 密钥） |
| **默认语言** | 英文 | 中文（zh-CN），英文 fallback |
| **/about 解释页** | 无 | 有（含 zero-knowledge 硬证据） |
| **零知识证明** | 架构师解释 | UI 直接展示 + F12 自验 |
| **部署** | Docker | 静态二进制 + systemd |
| **高级特性**（文件 / 请求 / 回执 / OIDC） | 都有 | **全删**（保持 zero-knowledge 简单） |

## 用户验证（F12）

1. 打开 <https://one-pass.ohoooho.com/>
2. F12 → Network → 勾选 Preserve log
3. 输入测试明文，点「生成一次性分享链接」
4. **必须看到**：
   - POST 请求 body 是 `-----BEGIN PGP MESSAGE-----` 开头的密文
   - 明文从未出现在任何请求里
5. 红色框里的密钥，浏览器从来没发给服务端（验证：`tcpdump` on 服务端网络接口）

## 部署（不用 Docker）

```bash
# Go 静态二进制
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
  go build -ldflags "-s -w" -o onepass-server ./cmd/onepass-server

# 前端
cd website && npm install --legacy-peer-deps && npm run build

# rsync 到目标机（把 $DEPLOY_HOST 换成你自己的服务器）
rsync -avz onepass-server root@$DEPLOY_HOST:/opt/onepass/onepass-server
rsync -avz website/dist/ root@$DEPLOY_HOST:/opt/onepass/public/

# systemd unit (/etc/systemd/system/onepass.service)
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

## 开源 & 协议

- **协议**：Apache-2.0（与原版 Yopass 一致）
- **原项目**：<https://github.com/jhaals/yopass>
- **本仓库**：<https://git.dbhys.com/ohoooho/one-pass>
- **GitHub 镜像**：<https://github.com/ohoooho/one-pass>
- **NOTICE 文件**：见 [NOTICE](NOTICE)

## 关联项目

- 桃仙品牌主站：<https://taoxian.ohoooho.com/>
- **AI 助理集成**：one-pass 提供标准 OpenPGP 接口 + HTTP API，任何 AI 助理都可以集成（参考实现：基于 SOPS + age + one-pass CLI 的 [OpenClaw workspace skill](https://git.dbhys.com/dbhys/xiandi-world))
