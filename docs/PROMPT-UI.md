# one-pass v0.2 UI 重做 — CC 执行 PROMPT

**目标**：按 `IMPROVE-UI-BRIEF.md` 重做 one-pass UI，解决用户拍板的 6 个问题（中间拥挤两边空白 / 整体视觉 / 实时加密 / 密钥重生成 / 密钥用户填 / 移动端）。

**所有约束在 BRIEF 里**。本文件只是执行顺序。

---

## 阶段 1：读上下文（5 min）

**执行**：
```bash
cd /root/.openclaw/workspace/one-pass/fork-work
# 读 MEMORY §14-16（用户 UI 偏好）
head -200 /root/.openclaw/workspace/MEMORY.md
# 读 BRIEF（你的任务书）
cat /root/.openclaw/workspace/one-pass/IMPROVE-UI-BRIEF.md
# 读当前核心组件（已看过但要再 confirm）
cat website/src/features/create/TextSecretMode.tsx
cat website/src/features/create/SelfEncryptedFileMode.tsx
cat website/src/shared/components/KeyBox.tsx
cat website/src/shared/components/CiphertextBox.tsx
cat website/src/shared/locales/zh-CN.json | head -100
```

**输出**：在 commit message 里说"已读 MEMORY §14-16 + BRIEF + 4 组件 + zh-CN locale"

---

## 阶段 2：拆 + 重做 `TextSecretMode.tsx`（30 min）

**这是最影响用户感知的页面，先干这个。**

按 BRIEF §"文件拆分建议" 拆成：
- `TextSecretMode.tsx`（~150 行，编排）
- `PlaintextStep.tsx`（输入明文 section）
- `KeyStep.tsx`（密钥 section + "自动生成 / 用我自己的" 切换）
- `EncryptButton.tsx`（点击加密按钮 + loading 状态）

**关键变化**：
- ❌ 删 useEffect 实时加密（plaintext 变化时算密文）→ ✅ 点按钮才加密
- ✅ 步骤 2 改 radio 切换（自动 / 用户）
- ✅ 加密前步骤 2/3 显示"等待加密"占位
- ✅ 1920 屏：左右排（左：标题 + 4 步骤 + zero-knowledge 解释；右：操作卡）
- ✅ ≤768px：单列堆叠

**新组件**：
- `StepBar.tsx`（横向步骤条 → ≤768 纵向）
- `StepItem.tsx`（单个步骤气泡）

**改 KeyBox / CiphertextBox**：
- 边框色：柔红 `#FCA5A5` 替代 `#EF4444`
- 圆角：16px
- 背景：超淡渐变
- ❌ 移除 "❌" 改 "🛡️" / ✅

**commit**：
```bash
git -c user.email=dev@ohoooho.local -c user.name=one-pass-bot commit -am "feat(ui): 重做 CreateSecret 页面（左右排 + 步骤条 + 点按钮加密）

BREAKING:
- 移除实时加密（plaintext 变化时不再自动算密文）
- 改点「加密消息」按钮才触发 OpenPGP 加密

视觉：
- 主色 #4A95FF / 紫墨文字 / 圆角 12-16px
- 1920 屏左右排（左：品牌 + 4 步骤；右：操作卡）
- 步骤条横向 → ≤768px 纵向

新组件：
- StepBar.tsx / StepItem.tsx
- PlaintextStep.tsx / KeyStep.tsx / EncryptButton.tsx
"
```

**deploy + 截图**：
```bash
cd website && yarn build
rsync -e "ssh -i ~/.ssh/id_ed25519_orangepi" dist/ root@140.143.246.15:/opt/onepass/public/
# 截图
mkdir -p /tmp/uiv2 && cd /tmp/uiv2 && cp /tmp/uicompare/shoot.js .
node shoot.js  # 修改 shoot.js 加 1280x800 + 375x812 两个 viewport
```

---

## 阶段 3：`SelfEncryptedFileMode.tsx` + `Result.tsx` + `Decryptor.tsx`（20 min）

**同步视觉**（同样的色板 + 圆角 + 步骤条），加 Result 页面**"重新生成"按钮**：

```tsx
<button onClick={async () => {
  const newKey = randomString();
  const newCipher = await encryptMessage(plaintext, newKey, config.ARGON2);
  await postSecret(...);  // 重新上传
  setResult({ password: newKey, uuid: ... });
}}>
  🔄 重新生成密钥并重新上传
</button>
```

i18n：zh-CN + en 同步新文案。

**commit**：
```bash
git -c user.email=dev@ohoooho.local -c user.name=one-pass-bot commit -am "feat(ui): 同步 FileMode / Result / Decryptor 视觉 + 重新生成按钮

- SelfEncryptedFileMode 用同一套色板 + 步骤条
- Result 加「重新生成密钥并重新上传」按钮
- Decryptor 用同一套样式（解锁区 + copy / QR）

i18n:
- zh-CN: 加 regenerate / encryptButton / stepTitles 文案
- en: 同步
"
```

---

## 阶段 4：build + 部署 + 4 张截图（10 min）

```bash
cd /root/.openclaw/workspace/one-pass/fork-work/website && yarn build
rsync -avz -e "ssh -i ~/.ssh/id_ed25519_orangepi" \
  dist/ root@140.143.246.15:/opt/onepass/public/
# 4 张截图：home / create（输入中）/ result / decrypt
# 2 个 viewport: 1280x800 desktop + 375x812 mobile
```

截图完成后保存到 `/root/.openclaw/workspace/one-pass/IMPROVE-UI-SHOTS/`。

---

## 阶段 5：报告（2 min）

**输出格式**：
```
✅ 阶段 N 完成

改了：<文件列表>
部署：https://one-pass.ohoooho.com
截图：
- desktop-1280x800-home.png
- desktop-1280x800-create.png
- desktop-1280x800-result.png
- desktop-1280x800-decrypt.png
- mobile-375x812-home.png
- mobile-375x812-create.png
- mobile-375x812-result.png
- mobile-375x812-decrypt.png

待审：
- <任何用户需要看的决策点>

下一个阶段：<阶段 N+1 是什么>
```

---

## 重要约束

- ❌ 不要全部改完一次性 commit——按阶段分批
- ❌ 不要改 Go 服务端 / API
- ❌ 不要换 i18n / react-router / Vite / React
- ✅ 每阶段 deploy + 截图 + 报告
- ✅ 任务前 read MEMORY §14-16 + BRIEF + 4 组件 + zh-CN locale

---

## 失败兜底

- 如果 deploy 失败 → 滚回旧 dist（保留 .bak）
- 如果 build 失败 → git stash + 回滚 + 报告
- 如果 截图脚本失败 → 用 curl 看 HTML + 报告"截图脚本待修"

---

开始阶段 1。