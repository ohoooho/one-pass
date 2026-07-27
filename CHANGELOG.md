# Changelog

All notable changes to one-pass are tracked here. Format: [Keep a Changelog](https://keepachangelog.com/),
project adheres (loosely) to [Semantic Versioning](https://semver.org/).

## [v8.0.0] — 2026-07-27

Web UI simplification + IM-sharing adaptations. **Milestone tag.**

### Added
- **"Copy IM message" card** on the Result page (v8.2). Pre-formatted block with title + link + oneTime/open hint + footer, designed to be pasted into any chat client.
- **Inline IM warning** on the `阅后即焚` checkbox when checked (v8.5). Explains the IM client auto-fetch gotcha in a single inline line.
- **"再发一个" Navbar CTA** appears on Create-flow Result pages too, not just Decrypt (v8.3). The Create-mode Result is an inline child of `TextSecretMode` / `SelfEncryptedFileMode`, so we emit `onepass:result:show` CustomEvent and Navbar listens.
- **"再发一个" handler** that actually resets Create-flow state (v8.3b). Bare `<a href="#/">` does nothing when the URL is already `/`; we preventDefault + dispatch `onepass:create-another` so the create child can clear its `result` state.
- **One-click reset path** for the IM message preview block (covered by the create-another handler above).
- **(i) info popover** body now includes a 4th note on burn-after-reading in IM context.

### Changed
- **All explanatory copy consolidated**: removed redundant `<label>你的明文</label>`; removed the right-column "About one-pass" block; collapsed `TrustStrip` to a single line (v8.1).
- **Page is one-screen at default viewport on desktop** (v8.1). Main padding tightened from `py-10/14` to `py-6/8/10`; action card from `p-6/10/12` to `p-5/8/10`; form `space-y-7/9` to `space-y-5/7`; EncryptButton `mt-8` to `mt-5`; textarea `rows=4 → 3`, `min-h-[120] → [100]`.
- **Responsive container width** (v8.1). `max-w-5xl wide:max-w-none` replaced with `max-w-[min(72rem,92%)] wide:max-w-[min(96rem,88%)]` — caps at 1152px on standard screens, 1536px on ≥1920 wide screens, while sharing available viewport as a percentage elsewhere.
- **Navbar "再发一个" CTA visual weight toned down** (v8.3). Solid blue gradient pill → `bg-[#4A95FF]/10 text-[#4A95FF]`, matching About/Settings weight instead of out-shouting the menu items.
- **Regenerate row moved to bottom** of Result page (v8.3) and **kept always visible** (v8.3a, after feedback that collapsing hid the feature). Now uses an outline button (white bg + blue border + blue text) instead of solid gradient.
- **IM message body strips `https://` from the link** (v8.4). IM clients pattern-match `http(s)://...` substrings for link unfurls and burn the one-time secret. We give the recipient a bare host-only URL and explain how to prepend the protocol manually.
- **English consistency**: "One-click link" → "One-click copy" on the Result row label (v8.3a).

### Fixed
- **Sticky bottom bar invisible white frame at desktop** (v8.1b). The mobile-only sticky button wrapper had `inline style background` overriding the lg `bg-transparent` className (inline specificity > className). Moved all styles into Tailwind classes so `lg:bg-transparent` actually applies.
- **"再发一个" did nothing on Create-flow Result** (v8.3b). See Added above.
- **Disabled-state button subtext "请先在上方输入明文" dropped** (v8.1a). The disabled button + textarea placeholder already say it; the extra line was visual noise.
- **English nav brand still said "Yopass"** (v8.7). The `header.appName` fallback in `en.json` was never updated when the brand became one-pass (zh-CN was already 'one-pass'). English visitors saw "[Yopass Secure secret sharing, made simple](...)" next to the logo.

### Removed
- **`buttonDisabledHint` i18n key** (en + zh-CN).
- **`inputSecretLabel` i18n key** (en + zh-CN) — was the redundant label.
- **`regenerateDisclosureHint` i18n key** (en + zh-CN) — was the "Advanced · same plaintext, new key" hint in the collapsed disclosure header.

## [Unreleased]

_(tracked in commit history until the next milestone)_

[v8.0.0]: https://git.dbhys.com/ohoooho/one-pass/compare/51ecc32...v8.0.0

## [v8.0.1] — 2026-07-27

Hotfix on top of the v8 milestone tag.

### Changed
- **oneTime checkbox default OFF** (v8.6). When the inline IM warning was rendered under the checked box, the Submit button dropped below the fold on default viewport. The warning still appears at decision time when the user opts in — only the default flipped.

### Fixed
- **English nav brand** (v8.7). See Fixed section in v8.0.0.

[v8.0.1]: https://git.dbhys.com/ohoooho/one-pass/compare/v8.0.0...v8.0.1
