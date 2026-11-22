# Tabius - Automatic Tab Grouping Assistant

### Current version: 2.0.6 (this fork)

> This is a fork of [FaisalBinAhmed/tabius](https://github.com/FaisalBinAhmed/tabius). See [Changes in this fork](#changes-in-this-fork-v206) below. The store listings below are for the original extension.

Published at [Chrome Web Store](https://chrome.google.com/webstore/detail/tabius-automatic-tab-grou/enceimdjnaccoeikjobaeicfodlfnijp?hl=en) and [Microsoft Store](https://microsoftedge.microsoft.com/addons/detail/tabius-tab-grouping-ass/filcmnpmbooeiloehikfjlligcgnnibb)

![Tabius Icon](/public/icon.png "Tabius Icon")

An Automatic Tab Grouping Extension for Your Browser.
Tabius is a customizable and easy to use Tab Grouping assistant for Chrome.

## Installation

Works in Chrome, Edge, Brave and other Chromium-based browsers.

1. Download `tabius-x.y.z.zip` from the [latest release](https://github.com/jasonliaotw/tabius/releases/latest).
2. Extract it to a folder you will keep. The browser loads the extension from this folder, so don't delete or move it afterwards.
3. Open the extensions page and turn on **Developer mode**:

   | Browser | Address | Developer mode switch |
   |---|---|---|
   | Chrome | `chrome://extensions` | top right |
   | Edge | `edge://extensions` | left sidebar |
   | Brave | `brave://extensions` | top right |

4. Click **Load unpacked** and select the extracted `tabius-x.y.z` folder (the one that contains `manifest.json`).

**Updating**: extract the new zip over the same folder, then click **Reload** (↻) on the Tabius card in the extensions page. Unpacked extensions don't update automatically.

If the original Tabius from the Chrome Web Store is also installed, disable it, otherwise both versions group your tabs at the same time.

<details>
<summary><b>安裝說明（中文）</b></summary>

適用於 Chrome、Edge、Brave 等 Chromium 核心的瀏覽器。

1. 從 [最新版 Release](https://github.com/jasonliaotw/tabius/releases/latest) 下載 `tabius-x.y.z.zip`。
2. 解壓縮到一個固定的資料夾。瀏覽器會直接從這個資料夾載入擴充功能，之後請不要刪除或搬移。
3. 開啟擴充功能頁面，打開「**開發人員模式**」：

   | 瀏覽器 | 網址 | 開發人員模式開關 |
   |---|---|---|
   | Chrome | `chrome://extensions` | 右上角 |
   | Edge | `edge://extensions` | 左側選單 |
   | Brave | `brave://extensions` | 右上角 |

4. 點「**載入未封裝項目**」，選擇解壓縮後的 `tabius-x.y.z` 資料夾（裡面有 `manifest.json` 的那一層）。

**更新**：把新版 zip 解壓縮覆蓋到同一個資料夾，再到擴充功能頁面按 Tabius 卡片上的「**重新載入**」（↻）。未封裝的擴充功能不會自動更新。

如果同時裝了商店版的 Tabius，請先停用，否則兩個版本會同時對分頁分組。

</details>

![Tabius Features](/tabius-bento.png "Tabius Features")

If you use tab grouping or couldn't use it due to lack of options, Tabius is a must have extension for you.
The extension is packed with useful features like:

- Automatically create new tab groups when you open a link in a new tab.
- Auto Collapse inactive tab groups.
- Limit the browser to only create groups if the new tab matches the original tab's domain.
- Create custom tab grouping rules: always create tab groups with a specific name and color from your favorite websites!
- Save your favorite tab groups and restore them for later use!
- Don't want to create tab groups from a specific site? Create a blacklist from the settings or add the site to the blacklist right from the toolbar!
- Option to close an existing tab group when there is only 1 tab left in it.
- Limit maximum number of tabs allowed in a group.
- Automatically name tab groups based on domain/subdomain or the full URL.
- View current tab groups and act upon them by clicking on the extension icon right from the toolbar.
- Sync all your settings, tab groups, and custom lists with browser.
- ..and many more features.

I created this extension from my need. I use tab groups all the time and the extension helps enhance this feature.

## Changes in this fork (v2.0.6)

_2026-11-23_

### Custom rules

- **Keyword matching**: enter one or more comma-separated keywords, e.g. `facebook.com, instagram.com, threads.com` → `Social`. A keyword matches when the page's domain contains it (`jira` matches `jira.abc.com` and `jira.com`). Add a path (`atlassian.net/jira`) to match by domain + path. Query strings are ignored, so a Google search for "github" is not a GitHub page.
- **Applied when a page finishes loading**, including pages opened from other apps (LINE, Slack, Outlook…).
- **One group per rule**: several sites in one rule end up in a single group instead of creating a duplicate group with the same name.
- **Rules move tabs between groups**: a tab that navigates to a matching page is moved into the rule's group, even from another group. A plain reload keeps a tab where you put it. Pinned tabs are never touched.

### Links from other apps

- Chrome and Brave treat the currently active tab as the "opener" of a link opened from another app. Tabius now tells real link clicks apart from external links, so external links are no longer grouped with whatever tab happened to be active; only custom rules apply to them.

### Blacklist

- An entry can be a **domain** or a **tab group name**.
- A blacklisted group: tabs opened from links inside it don't follow it into the group. Custom rules for that group still apply.
- **Right-click menu** on any page or on the toolbar icon: blacklist or un-blacklist the current domain or tab group.

### Settings page and language

- **English / 繁體中文**, selectable on the settings page (follows the browser language by default). Applies to the settings page, the popup and the right-click menu.
- **One settings page**: Custom Rules and Blacklist are sections of the settings page (no more pop-up dialogs), with quick links at the top.
- Fixed dropdown options showing white text on a white background.

### Fixes

- Event listeners were also registered by the popup and settings pages, which could group tabs twice.
- Adding the first blacklist entry from the popup failed.
- Auto-collapse and "remove lonely group" used the wrong window.
- `about:` pages are no longer grouped.
- TypeScript strict-mode errors.

### Permissions

- Added `contextMenus` (right-click menu) and `webNavigation` (to tell link clicks apart from links opened by other apps).

<details>
<summary><b>中文摘要</b></summary>

**自訂規則**

- **關鍵字比對**：可輸入多個以逗號分隔的關鍵字，例如 `facebook.com, instagram.com, threads.com` → `社交`。網域包含關鍵字就算符合（`jira` 會比對到 `jira.abc.com`、`jira.com`）；加上路徑（`atlassian.net/jira`）則比對「網域＋路徑」。不比對查詢參數，所以在 Google 搜尋「github」不會被當成 GitHub 頁面。
- **頁面載入完成時套用**，包含從其他 App（LINE、Slack、Outlook…）開啟的連結。
- **一條規則只對應一個群組**：同一條規則的多個網站會進入同一個群組，不會重複建立同名群組。
- **規則會在群組間移動分頁**：分頁開啟符合規則的頁面時，即使在其他群組中也會被移到規則的群組；單純重新整理則留在原處。已釘選的分頁不會被移動。

**外部 App 開啟的連結**

- Chrome 和 Brave 會把「當下作用中的分頁」當成外部連結的來源分頁。現在 Tabius 會分辨「網頁裡點出的連結」和「外部開啟的連結」，外部連結不再被分進當時正在看的分頁的群組，只套用自訂規則。

**黑名單**

- 項目可以是**網域**或**分頁群組名稱**。
- 黑名單群組：從群組內分頁點連結開出的新分頁不會跟著加入；符合該群組自訂規則的網站仍會被加入。
- **右鍵選單**（網頁上或工具列圖示上）：將目前的網域或分頁群組加入／移出黑名單。

**設定頁與語言**

- **English／繁體中文**，可在設定頁切換（預設依瀏覽器語言），套用到設定頁、彈出視窗與右鍵選單。
- **所有設定整合在同一頁**：自訂規則與黑名單改為設定頁中的區塊（不再是彈出視窗），頁首有快速跳轉連結。
- 修正下拉選單白底白字看不到選項的問題。

**修正**

- 彈出視窗與設定頁也會註冊事件監聽器，可能導致分頁被重複分組。
- 從彈出視窗新增第一筆黑名單會失敗。
- 自動收合與「只剩 1 個分頁時解散群組」作用在錯誤的視窗。
- `about:` 頁面不再被分組。
- TypeScript strict 模式錯誤。

**權限**

- 新增 `contextMenus`（右鍵選單）與 `webNavigation`（分辨網頁點出的連結與外部 App 開啟的連結）。

</details>

### Special Thanks

- The open source icons are provided by [Iconoir](https://github.com/iconoir-icons/iconoir)
- Preact
- Vite

## Contribution guide

The extension is made with Preact and Vite bundler.
To start, first clone the repo and run `npm install` in the project directory.
Then run `npm run build` to build the extension. The dist folder will contain all the relevant bits after this step.

To install in your browser, go to your Chrome/Edge (or any Chromium based browsers) Extension page and click on `Load Unpacked` and then select the `dist` folder.
The extension is good to go.

### Publishing a release

Releases are built and published automatically by GitHub Actions ([`.github/workflows/release.yml`](.github/workflows/release.yml)):

1. Bump the version in `public/manifest.json` (and `package.json`), commit and push.
2. Push a matching tag:

   ```
   git tag v2.0.7
   git push origin v2.0.7
   ```

The workflow type-checks and builds the extension, then creates a GitHub Release with `tabius-<version>.zip` attached. It stops if the tag doesn't match the manifest version.

Please create an issue first before you make a pull request.

The goal of this extension is to be as simple as possible while providing the best tab grouping experience.
