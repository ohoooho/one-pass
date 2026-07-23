# one-pass v0.2 UI 重做 BRIEF

**目标**：解决用户拍板的 6 个问题（A 美学 3 个 + B 功能 3 个），重做 fork 的 React UI。

**线上**：https://one-pass.ohoooho.com
**源码**：`/root/.openclaw/workspace/one-pass/fork-work/`
**当前 UI 文件**（已读）：
- `website/src/features/create/TextSecretMode.tsx`（315 行，太胖）
- `website/src/features/create/SelfEncryptedFileMode.tsx`（342 行，太胖）
- `website/src/features/display-secret/Result.tsx`（171 行）
- `website/src/features/display-secret/Decryptor.tsx`（159 行）
- `website/src/shared/components/KeyBox.tsx`（红框）
- `website/src/shared/components/CiphertextBox.tsx`（绿框）

**用户原话**：「UI 丑的问题，我认为体现在UI审美，一页可见，css样式，中间拥挤而两边空白等等」「加密密钥不能重新生成和填写；如你所说的实时加密，而没有用点击加密的时候再加密等等，我用的 pc，移动我还没看」

---

## 改进 A：UI 审美 + 布局（3 个问题）

### A1. 中间拥挤两边空白

**现象**：现在 `max-w-2xl`（~672px），1920 显示器两边空白 600px+，显得窄小局促。

**改法**：
- ✅ **去掉窄 max-w 限制**。改用 `max-w-4xl`（896px）或不用 max-w
- ✅ **两边不要浪费**。左右排：左侧标题 + 4 步说明，右侧白色操作卡
- ✅ 1920 屏布局示例：
  ```
  ┌──────────────────── 1920px ────────────────────┐
  │              桃仙 / one-pass 品牌区              │
  │                                               │
  │  ┌─ 左 1/3 ─┐  ┌────── 右 2/3 ──────┐         │
  │  │ 标语       │  │ 文本 │ 文件  tabs │         │
  │  │ 4 步说明    │  │  步骤 1 输入明文  │         │
  │  │ zero-knowledge │  步骤 2 密钥   │         │
  │  │ 解释        │  │  步骤 3 加密按钮 │         │
  │  │ 用户偏好    │  │  选项         │         │
  │  │              │  │  [🔒 加密消息] │         │
  │  └───────────┘  └──────────────────┘         │
  └─────────────────────────────────────────────────┘
  ```
- ✅ ≤768px 移动端：左/右堆叠成单列

### A2. 整体视觉太"工程师风格"

**现象**：步骤标号 1/2/3 是 Tailwind 默认蓝/红/绿色块 + 红框警告密钥（视觉上像错误） + 整个页面只有白卡片。

**改法**（按 MEMORY §14-16 用户偏好：明亮 / 圆润 / 蓝绿主调）：

| 当前 | 改成 |
|---|---|
| ❌ 红框框密钥（像警告） | ✅ 柔红边框 + 圆角 16px + 小 🛡️ icon（不是 ❌） |
| ❌ 绿框框密文 | ✅ 柔绿边框 + 圆角 16px + 小 ✅ icon（保留） |
| ❌ 步骤标号 1/2/3 大色块 | ✅ 数字步骤条（横向/纵向 stepper），用品牌蓝 #4A95FF |
| ❌ 字号层级不清 | ✅ h1 大标题（text-4xl/5xl）+ 描述 text-base + 步骤 h3 text-lg + 注释 text-sm text-base-content/60 |
| ❌ 缺图标 | ✅ 每个步骤一个小 icon（钥匙 / 锁 / 信封 / 链接） |
| ❌ 卡片是死白 | ✅ 卡片用淡渐变背景（#F7F9FB → #FAFAFA）或 backdrop-blur |
| ❌ 按钮朴素 | ✅ 主按钮：圆角 12px、阴影、加 hover scale 1.02 |
| ❌ 全是技术语 | ✅ 加入"桃仙 / one-pass"品牌叙事（"桃仙是你身边的孙悟空"金句可放首页或 /about） |

**配色锁定**：
- 主蓝 `#4A95FF`
- 浅蓝 `#A5D8FF`
- 薄荷绿 `#7DD3C0` / `#B8E6C1`
- 奶油黄 `#FFD89C`
- 警告柔红 `#FCA5A5`（不是 #EF4444）
- 文字 `#3A2E5C`（深紫墨，非纯黑）
- 背景 `#F7F9FB` / `#FAFAFA`

**圆角统一**：12px 按钮 / 16px 卡片 / 24px 大容器

### A3. 步骤指示器太朴素

**现象**：3 个独立 section 各带一个圆点编号，没连贯感。

**改法**：用 **横向步骤条**（步骤之间用线连起来）：
```
●━━━━━━━●━━━━━━━●━━━━━━━○  (3/3 已完成)
1        2        3        4
明文     密钥     密文     链接
```
- 当前步骤蓝高亮、已完成步骤绿打勾、未完成步骤灰圈
- 步骤条放每个 section 顶部
- ≤768px：横向 → 纵向（每个 section 顶上一个步骤气泡）

---

## 改进 B：功能 / 行为（3 个问题）

### B1. 加密时机：移除实时加密

**现象**：现在 useEffect 监听 plaintext → 250ms debounce → 实时算 OpenPGP 密文。结果：
- 浏览器 CPU 一直在跑
- 用户看着密文在变（吓人）
- 5KB 以上明文会卡顿

**改法**：
- ✅ **点击「加密消息」按钮时才加密**
- ✅ 步骤 2/3 在加密前**只显示"等待加密"**占位（不显示实际密钥/密文）
- ✅ 点击按钮 → 显示 loading → 完成后切换到「Result」组件
- ✅ 步骤 2 的密钥 = 一次性生成的（不预先展示，点按钮时再算）
- ✅ 用户选"用我的密钥" → 输入框 + 切换开关

### B2. 密钥可重新生成 + 用户可填写

**现象**：现在 live preview 用 `randomString()` 但没法手动重生；"用我的密钥" toggle 存在但位置怪。

**改法**：
- ✅ **去掉"自动生成密钥 + live preview"**（跟 B1 一起改）
- ✅ 步骤 2 改成两个并列的 sub-option（用 radio 或 segmented control）：
  ```
  ○ 自动生成密钥（推荐）—— 点击加密时生成
  ● 用我自己的密钥 —— 输入密钥：[__________]
  ```
- ✅ 选"自动生成"时，点加密按钮才生成并显示
- ✅ 选"用我自己"时，输入框直接生效
- ✅ 加 **"重新生成"按钮**在 Result 页面（用户已分享完发现密钥不够随机？让他重传）

### B3. 移动端（≤768px 完整可用）

**改法**：
- ✅ 所有 section 在 ≤768px 下垂直堆叠
- ✅ 步骤条从横向改纵向
- ✅ 按钮固定底部（不滚动）
- ✅ input / textarea 字号 ≥16px（避免 iOS 自动放大）
- ✅ 长 link / key 用 word-break: break-all（避免溢出）

---

## 不要做的事 ❌

- ❌ 不要拆 useSecretForm hook / useCopy hook / SecretOptions 等可复用组件（除非明显胖到 > 200 行）
- ❌ 不要换 i18n / react-router / Vite / React 19
- ❌ 不要碰 Go 服务端 / API endpoint
- ❌ 不要碰 npm 包 / yarn.lock
- ❌ 不要把 Redact 风格的"❌ 密钥不到服务端"红色警告换掉（信息对，只是视觉调一下别用 #EF4444）
- ❌ 不要重新设计 ABOUT 页（已经做了）
- ❌ 不要新增功能（filemode、receipt 流程保持不变）
- ❌ 不要破坏 e2e 测试（如有）

---

## 文件拆分建议（不强制）

| 当前（胖文件） | 建议拆成 |
|---|---|
| `TextSecretMode.tsx`（315 行）| `TextSecretMode.tsx`（~150）+ `PlaintextStep.tsx` + `KeyStep.tsx` + `EncryptButton.tsx` |
| `SelfEncryptedFileMode.tsx`（342 行）| `SelfEncryptedFileMode.tsx`（~180）+ `FileDropZone.tsx` + `CiphertextInput.tsx` |
| `KeyBox.tsx` / `CiphertextBox.tsx` | 保留，但调色板 + 圆角 |

**拆分原则**：每个组件 < 150 行；每个组件只干一件事。

---

## 验收标准（按用户原话）

| 项 | 标准 |
|---|---|
| 中间拥挤两边空白 | ✅ 1920 屏左右排，宽度用上 75% 以上 |
| 圆角 / 配色 / 字号层级 | ✅ 按 MEMORY §14-16 锁定：圆角 12-24px / 主蓝 #4A95FF / 紫墨文字 |
| 实时加密 → 点按钮才加密 | ✅ useEffect 监听 plaintext 的代码删掉，按钮触发 encryptMessage |
| 密钥可重生成 | ✅ Result 页面有"重新生成并重新上传"按钮 |
| 密钥可用户填写 | ✅ "用我自己的密钥" radio 切换，输入框直接生效 |
| 移动端 | ✅ ≤768px 全功能可用，无横向滚动 |

---

## 任务清单（按顺序）

1. **先动 `TextSecretMode.tsx`**——核心页面，最影响用户感知
2. **改 `KeyBox.tsx` / `CiphertextBox.tsx`**——调色板 + 圆角
3. **改 `SelfEncryptedFileMode.tsx`**——同步风格
4. **改 `Result.tsx`**——加"重新生成"按钮
5. **改 `Decryptor.tsx`**——同步风格
6. **加 `StepBar.tsx` / `StepItem.tsx`**——共用组件
7. **改 `SecretOptions.tsx`**——保留，加一层包装
8. **i18n** — zh-CN / en 同步新文案
9. **build** — yarn build → 输出到 `/opt/onepass/public/`
10. **commit + push** — 推到 fork 仓库
11. **截图** — playwright 截 4 个关键状态：home / 输入中 / 加密后 / 移动端

---

## 约束 / 上下文（CC 必读）

- 任务前请 `read /root/.openclaw/workspace/MEMORY.md` §14-16（用户 UI 偏好）
- 任务前请 `read /root/.openclaw/workspace/one-pass/fork-work/website/src/features/create/TextSecretMode.tsx`（核心组件）
- 任务前请 `read /root/.openclaw/workspace/one-pass/fork-work/website/src/shared/components/KeyBox.tsx` + `CiphertextBox.tsx`
- 任务前请 `read /root/.openclaw/workspace/one-pass/fork-work/website/src/shared/locales/zh-CN.json` + `en.json`（文案）
- 部署 / 推送 / 截图脚本已就绪：
  - 构建：`cd website && yarn build`
  - 部署：`rsync -e "ssh -i ~/.ssh/id_ed25519_orangepi" website/dist/ root@140.143.246.15:/opt/onepass/public/`
  - 截图：playwright 在 `/tmp/uicompare/` 已有，路径照抄

---

## 反馈机制

每个 commit 后停下来报告：
1. 改了哪些文件
2. 截图（playwright 截 home + create + result + decrypt 4 个状态，desktop 1280x800 + mobile 375x812）
3. 自检（页面没报红、按钮能点、加密流程通）

**不要全部改完一次性提交**——分批，每批可独立 deploy 验证。