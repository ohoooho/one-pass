# CC 任务：one-pass fork

## 必读

1. `/root/.openclaw/workspace/one-pass/BRIEF.md`（10KB）— 业务 + UX + 改造清单
2. `/root/.openclaw/workspace/one-pass/PROMPT.md`（7KB）— 10 步执行命令
3. `/root/.openclaw/workspace/one-pass/CHECKLIST.md`（4KB）— 验收清单
4. `/root/.openclaw/workspace/one-pass/yopass-source/` — Yopass 源码（参考）

## 项目目录

`/root/.openclaw/workspace/one-pass/fork-work/` 已包含 yopass-source 的副本，从这里开始 fork。

## 推送目标

- 主仓：`git.dbhys.com/ohoooho/one-pass.git`（Gitea，已存在）
- 镜像：`github.com/ohoooho/one-pass.git`（GitHub，已存在）
- 推送前用 token：`git config --global http.sslVerify false`
- openclaw token: `1c381ade3cafc0cc1eae4251c3c6f85ee00c929e`
- GitHub token: 等用户提供（暂时只推 Gitea）

## 部署

按 PROMPT.md Step 7（**不用 Docker**，用 systemd + 静态二进制）。

## 完成时汇报

1. commit hash + 分支
2. 部署 URL + 健康检查
3. F12 验证截图（密文 vs 明文对比）
4. 任何未完成项

## 启动命令

```bash
cd /root/.openclaw/workspace/one-pass/fork-work
claude --model MiniMax-M3 --permission-mode auto "读 BRIEF.md 和 PROMPT.md 后开始"
```
