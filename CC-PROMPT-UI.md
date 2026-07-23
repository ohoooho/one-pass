# CC 任务：one-pass v0.2 UI 重做

## 必读

1. **`/root/.openclaw/workspace/one-pass/fork-work/docs/IMPROVE-UI-BRIEF.md`**（6KB）— 任务书（用户拍板）
2. **`/root/.openclaw/workspace/one-pass/fork-work/docs/PROMPT-UI.md`**（4KB）— 5 阶段执行命令
3. **`/root/.openclaw/workspace/MEMORY.md` §14-16** — 用户 UI 偏好（明亮 / 圆润 / 蓝绿主调）

## 项目目录

`/root/.openclaw/workspace/one-pass/fork-work/` — yopass fork（React 19 + Vite + TS）

## 必读组件

- `website/src/features/create/TextSecretMode.tsx`（315 行，核心）
- `website/src/features/create/SelfEncryptedFileMode.tsx`（342 行）
- `website/src/features/display-secret/Result.tsx`（171 行）
- `website/src/features/display-secret/Decryptor.tsx`（159 行）
- `website/src/shared/components/KeyBox.tsx` + `CiphertextBox.tsx`
- `website/src/shared/locales/zh-CN.json` + `en.json`

## 推送 + 部署

- 主仓：`git.dbhys.com/ohoooho/one-pass.git`（origin）
- 镜像：`github.com/ohoooho/one-pass.git`（github）
- push 前：`git config --global http.sslVerify false`
- 部署：`rsync -e "ssh -i ~/.ssh/id_ed25519_orangepi" website/dist/ root@140.143.246.15:/opt/onepass/public/`
- 服务器 systemd 已配好，不需要重启服务（前端是静态文件）

## 完成时汇报

每阶段完成后报告：
1. commit hash
2. 改了哪些文件
3. 截图路径（playwright 截 1280x800 + 375x812 两个 viewport）
4. 自检（页面没报红、按钮能点、加密流程通）
5. 部署后的 URL

## 关键约束（再强调一次）

- ❌ 不要拆 useSecretForm hook / SecretOptions 等可复用组件
- ❌ 不要换框架 / i18n / Vite / React
- ❌ 不要碰 Go 服务端 / API
- ❌ 不要全部改完一次性 commit——按 PROMPT-UI.md 5 阶段分批
- ❌ 不要做 v0.3 的功能（这次只做 UI 重做 + 6 个用户拍板问题）
- ✅ 每个阶段 deploy + 截图 + 报告，再做下一个