# CC 任务：one-pass UI 整体重审 + 调整

## 起点

用户对当前线上 (hash `index-DBY-p9ff.js`) 评价：**「丑」「整体让CC好好检查和调整一下」**。

之前所有 stage 已 commit：
- `625e561` 重做 CreateSecret 左右排 + 步骤条
- `2c88344` 同步 FileMode / Result / Decryptor
- `4e8f4e4` 扩宽度 (max-w-screen-2xl) + grid 4:8 + 密钥立即可见 + FileMode 文案改 gpg

## 你的总任务

**整体重审 UI，决定是否要更动。** 不是机械执行 brief——是真正审视当前线上版本，决定哪些需要改、改成什么样。

## 必读

1. 任务前 `read /root/.openclaw/workspace/MEMORY.md` §14-16 (用户 UI 偏好)
2. 用 playwright 截当前线上的 1920 / 1280 / mobile 三档，看清实际状态再决定
3. 用户原话："整体让CC好好检查和调整一下"——你有自由重做整个 layout，不必被之前 brief 限制

## 已知问题（用户拍板过的，按优先级）

### A. 丑（审美 + 布局）
- 1920 屏仍然两边空白 ~200px，整页感觉"小气"
- 左侧 zero-knowledge 解释栏占着 ~400px，"空话挤左边，右边操作卡"
- 步骤条 4 步在小屏可能挤

### B. 按钮位置
- 蓝色「加密消息」按钮在 text mode 右侧栏底部，用户第一屏看不到
- 三种方案任选或混合：
  - sticky 浮动（视口底部常驻）
  - 提到密钥区下面（高级设置折叠）
  - 两个都做

### C. 重复 UI
- text mode 下，KeyStep 已经有「自动生成 / 使用我自己的密钥」radio
- 但 SecretOptions 里还有「随机生成密钥」checkbox + 「自定义密码」输入框
- 两份 UI 控制同一个状态，用户看着混乱
- 建议：从 SecretOptions 删 generateKey + customPassword，保留 oneTime / requireAuth / readReceipt / expiration

### D. 🛡️ emoji 在 headless 浏览器渲染为 □
- Linux 截图时 □
- 用户在 macOS/Windows 浏览器看没事
- 改用文字 + 颜色编码（"🔒 服务端不可见" 之类纯文字）

## 约束

- ❌ 不要拆 `useSecretForm` hook / `useCopy` hook / `SecretOptions` 等可复用组件
- ❌ 不要换 i18n / react-router / Vite / React 19
- ❌ 不要碰 Go 服务端 / API endpoint
- ❌ 不要碰 npm 包 / yarn.lock
- ❌ 不要破坏 e2e 测试
- ❌ 不要重做 ABOUT 页
- ❌ 不要新增功能（filemode / receipt 流程保持不变）

## 推荐改的优先级

1. **A 美学（最影响用户感受）**：决定是砍左栏 / 改比例 / 换布局，自己定
2. **B 按钮位置**：A 改完后按你的新布局定
3. **C 重复 UI**：简单，10 行代码搞定
4. **D emoji 改文字**：简单

## 输出

- 一个 git commit（把所有改动合并提交）
- push 到 origin + github
- yarn build + rsync 部署到 140.143.246.15:/opt/onepass/public/
- 9 张截图（1920 / 1280 / mobile，empty / typed / result 三种状态）→ docs/IMPROVE-UI-SHOTS/v3/
- 报告：列改动清单 + 每张截图说明 + 哪里"美了" + 哪里仍有风险

## 命令参考

```bash
cd /root/.openclaw/workspace/one-pass/fork-work
git config --global http.sslVerify false
# 编辑文件
# yarn build → rsync
yarn build
rsync -az --delete -e "ssh -i ~/.ssh/id_ed25519_orangepi" website/dist/ root@140.143.246.15:/opt/onepass/public/
# git push
git push origin master
GITHUB_URL="https://x-access-token:\$(sops -d ~/secrets/github-secrets.yaml | grep -A1 one-pass | tail -1 | awk '{print \$2}')@github.com/ohoooho/one-pass.git"
git push "$GITHUB_URL" master
# 截图：playwright 写脚本截 1920/1280/mobile
```

## 完成后

报告列出：commit hash / push URL / deploy hash / 截图路径 / 你的判断（哪改了 / 哪保留 / 还有啥风险）。
