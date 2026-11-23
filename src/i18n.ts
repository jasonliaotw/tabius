// Simple i18n for Tabius. The language is a user setting stored in
// chrome.storage.sync ("language"): "auto" follows the browser UI language.
// Shared by the popup, the options page and the background service worker.

export type Language = "en" | "zh_TW";
export type LanguageSetting = "auto" | Language;

export const LANGUAGE_SETTINGS: LanguageSetting[] = ["auto", "en", "zh_TW"];

const en = {
	// language setting
	settings_language: "Language",
	settings_language_auto: "Auto (browser language)",
	settings_language_hint:
		"Applies to the settings page, the popup and the right-click menu.",
	toast_language_saved: "Language updated",

	// common
	common_close: "Close",
	common_add: "Add",
	common_edit: "Edit",
	common_save: "Save",
	common_cancel: "Cancel",
	common_delete_rule: "Delete this rule",
	common_random: "Random",
	toast_error_saving: "Error saving item",
	toast_error_deleting: "Error deleting item",
	toast_error_editing: "Error editing item",
	toast_storage_error: "Storage error",

	// colors
	color_grey: "grey",
	color_blue: "blue",
	color_red: "red",
	color_yellow: "yellow",
	color_green: "green",
	color_pink: "pink",
	color_purple: "purple",
	color_cyan: "cyan",
	color_orange: "orange",

	// popup
	popup_rate: "Rate it",
	popup_settings: "Tabius settings",
	popup_block_tooltip:
		"Quickly blacklist or unblacklist this site from creating new tab groups",
	popup_enable_domain: "Enable for this domain",
	popup_disable_domain: "Disable for this domain",
	popup_current: "Current",
	popup_saved: "Saved",
	popup_minimize_all: "Minimize all tab groups",
	popup_maximize_all: "Maximize all tab groups",
	popup_nothing: "Nothing to see here",
	toast_group_saved: "Tab group saved",
	toast_tab_saved_to_group: "Saved tab to group",
	toast_tab_deleted: "Tab deleted from storage",

	// tab group cards
	card_click_to_open: "Click to open",
	card_minimize: "Minimize tab group",
	card_open: "Open tab group",
	card_close_all: "Close all tabs in the group",
	card_save_group: "+ Save this tab group",
	saved_restore: "Restore this tab group",
	saved_delete: "Delete this saved group",
	saved_add_current: "+ Add current tab to this group",
	saved_open_separately: "Open this tab separately",
	saved_delete_tab: "Delete this tab",
	details_eject: "Eject this tab from the group",
	details_close: "Close this tab",

	// settings page
	settings_subtitle: "Automatic Tab Grouping Assistant",
	settings_coffee: "☕ Buy me a coffee",
	settings_website: "🌐 Visit Website",
	settings_rate: "💬 Rate/Review",
	settings_groupby: "Group By Option",
	settings_groupby_sot: "same opening tab",
	settings_groupby_sd: "same domain",
	settings_groupby_hint:
		"Hint: by default tabs will be grouped together with the tab that opened it. However you can restrict this behavior to only group them when the new tab is from the same domain.",
	settings_regardless:
		"Combine tabs inside existing groups regardless of domain",
	settings_regardless_hint:
		'Hint: if you want to put new tabs opened from an existing group to reside in the group regardless of the "group by same domain" policy. Only applicable when "same domain" has been chosen as the group by option.',
	settings_naming: "Group Naming Convention",
	naming_dom: "domain",
	naming_subdom: "subdomain.domain",
	naming_subdomtld: "subdomain.domain.tld",
	naming_title: "Group opener's title",
	naming_nameless: "nameless (no name)",
	settings_naming_hint:
		"Hint: by default the group will be named after domain: dev.facebook.com -> facebook.",
	settings_maximum: "Maximum number of tabs per group",
	settings_maximum_hint_1: "0 (default) = no restrictions ~ unlimited tabs.",
	settings_maximum_hint_bold: "1 = Tabius has no effects",
	settings_maximum_hint_2: "(not applicable). 2 - 999 = maximum number of tabs.",
	settings_lonely: "Remove group when there is only 1 tab left",
	settings_lonely_hint:
		"Hint: If the number of tab in a group becomes 1, this will ungroup the remaining 'lonely' tab. Locked tab groups are never removed.",
	settings_autocollapse: "Auto collapse inactive tab groups",
	settings_autocollapse_hint:
		"Hint: if the current tab is not part of a tab group, the extension will collapse all other tab groups automatically.",
	settings_section_general: "General Settings",
	settings_save: "Save Settings",
	settings_save_hint:
		"The button above saves the general settings. Custom rules, blacklisted sites, locked tab groups and quick tab switch changes below are saved automatically.",
	toast_settings_saved: "Settings Saved",

	// custom rules
	custom_title: "Custom Tab Grouping Rules",
	custom_url_label: "URL keywords",
	custom_alias_label: "Short Name or Alias",
	custom_color_label: "Group Color",
	custom_hint:
		'Enter one or more comma-separated keywords (for example: github, youtube, docs.example.com). You do not need to include https://. A loaded page whose domain contains a keyword uses this rule\'s name and color. Add a path (e.g. "github.com/myorg") to match only pages under that path. Query strings are ignored, matching is case-insensitive and duplicate keywords are ignored. A tab that navigates to a matching page is moved to this group even if it is in another group; reloading a page keeps its current group. Pinned tabs and tabs in locked groups are left untouched; a rule can still add tabs to a locked group.',
	custom_existing: "Modify Existing Rules",
	custom_empty: "No Custom rules yet. Create a rule for a specific site above.",
	toast_enter_keyword: "Please enter at least one URL keyword.",
	toast_enter_group_name: "Please enter a group name.",
	toast_rule_saved: "New rule saved",
	toast_rule_deleted: "Custom rule deleted",
	toast_rule_updated: "Custom Rule updated.",

	// blacklisted sites
	block_title: "Blacklisted Sites",
	block_label_domain: "Domain or URL",
	block_hint:
		'Enter a website domain or URL, e.g. "wikipedia.org" or "https://www.wikipedia.org" (https:// and www. are optional). A site is blacklisted when its domain contains the entry, so "wikipedia.org" also covers "en.wikipedia.org". Add a path (e.g. "github.com/myorg") to only match pages under that path. Tabs opened from, or loaded on, blacklisted sites are not grouped (except inside a locked group). You can also right-click any page and use the Tabius menu.',
	block_list: "Blacklisted sites",
	block_empty: "No blacklisted sites yet. Add a site above.",
	toast_invalid_domain: "Please enter a valid domain or url.",
	toast_site_already_blocked: "This site is already blacklisted.",
	toast_block_site_saved: "Blacklisted site saved.",
	toast_block_deleted: "Blacklisted site deleted.",

	// locked tab groups
	lock_title: "Locked Tab Groups",
	lock_label: "Tab group name",
	lock_hint:
		'Enter a tab group name (case-insensitive). Tabius never moves tabs out of a locked group: tabs opened from links inside it stay in it, even for blacklisted sites, a full group or a different domain under "same domain" grouping; other custom rules do not move its tabs away, and it is not dissolved when only one tab is left. Only custom rules add tabs to it: pages matching a custom rule for that group are still added to it. You can also right-click a tab in the group and use the Tabius menu.',
	lock_list: "Locked groups",
	lock_empty: "No locked tab groups yet. Add a group name above.",
	toast_enter_lock_group: "Please enter a tab group name.",
	toast_group_already_locked: "This tab group is already locked.",
	toast_lock_saved: "Locked tab group saved.",
	toast_lock_deleted: "Locked tab group deleted.",

	// quick switch shortcut
	quick_title: "Quick Tab Switch",
	quick_current: "Keyboard shortcut",
	quick_not_set: "Not set",
	quick_change: "Change shortcut",
	quick_hint:
		"Press the shortcut to jump back to the tab you used before (in any window). Press it again quickly to keep going further back through your recently used tabs; stop pressing and the tab you landed on becomes the current one, so the next press takes you back. The default is Alt+Q; if it is not set, another extension may already use it. Shortcuts are changed on the browser's extension shortcuts page.",
	quick_delay: "Consecutive press window",
	quick_delay_hint:
		"Presses within this time (counted from the previous press) keep going further back through your recent tabs; after it passes, the next press goes back to the previous tab again. {min} - {max} ms, default {default} ms. Saved automatically.",

	// right-click menu
	menu_domain_default: "Blacklist this domain",
	menu_domain_unavailable: "Blacklist this domain (not available on this page)",
	menu_domain_add: 'Blacklist domain "{domain}"',
	menu_domain_remove: 'Remove "{domain}" from blacklist',
	menu_group_default: "Lock this tab group",
	menu_group_not_in_group: "Lock this tab group (tab is not in a group)",
	menu_group_no_name: "Lock this tab group (group has no name)",
	menu_group_add: 'Lock group "{group}"',
	menu_group_remove: 'Unlock group "{group}"',
};

export type MessageKey = keyof typeof en;

const zh_TW: Record<MessageKey, string> = {
	settings_language: "語言",
	settings_language_auto: "自動（依瀏覽器語言）",
	settings_language_hint: "套用至設定頁、彈出視窗與右鍵選單。",
	toast_language_saved: "已切換語言",

	common_close: "關閉",
	common_add: "新增",
	common_edit: "編輯",
	common_save: "儲存",
	common_cancel: "取消",
	common_delete_rule: "刪除此規則",
	common_random: "隨機",
	toast_error_saving: "儲存時發生錯誤",
	toast_error_deleting: "刪除時發生錯誤",
	toast_error_editing: "編輯時發生錯誤",
	toast_storage_error: "儲存空間錯誤",

	color_grey: "灰色",
	color_blue: "藍色",
	color_red: "紅色",
	color_yellow: "黃色",
	color_green: "綠色",
	color_pink: "粉紅色",
	color_purple: "紫色",
	color_cyan: "青色",
	color_orange: "橘色",

	popup_rate: "給個評價",
	popup_settings: "Tabius 設定",
	popup_block_tooltip: "快速將此網站加入或移出黑名單（加入後不再自動建立群組）",
	popup_enable_domain: "對此網域啟用",
	popup_disable_domain: "對此網域停用",
	popup_current: "目前",
	popup_saved: "已儲存",
	popup_minimize_all: "收合所有分頁群組",
	popup_maximize_all: "展開所有分頁群組",
	popup_nothing: "這裡什麼都沒有",
	toast_group_saved: "已儲存分頁群組",
	toast_tab_saved_to_group: "已將分頁存入群組",
	toast_tab_deleted: "已從儲存中刪除分頁",

	card_click_to_open: "點擊展開",
	card_minimize: "收合分頁群組",
	card_open: "展開分頁群組",
	card_close_all: "關閉群組內所有分頁",
	card_save_group: "+ 儲存此分頁群組",
	saved_restore: "還原此分頁群組",
	saved_delete: "刪除此已儲存的群組",
	saved_add_current: "+ 將目前分頁加入此群組",
	saved_open_separately: "單獨開啟此分頁",
	saved_delete_tab: "刪除此分頁",
	details_eject: "將此分頁移出群組",
	details_close: "關閉此分頁",

	settings_subtitle: "自動分頁分組助手",
	settings_coffee: "☕ 請我喝杯咖啡",
	settings_website: "🌐 造訪網站",
	settings_rate: "💬 評分／評論",
	settings_groupby: "分組依據",
	settings_groupby_sot: "相同的來源分頁",
	settings_groupby_sd: "相同網域",
	settings_groupby_hint:
		"提示：預設會把新分頁和開啟它的分頁分在同一組。你也可以限制成只有新分頁與來源分頁是相同網域時才分組。",
	settings_regardless: "不論網域，都將新分頁併入既有群組",
	settings_regardless_hint:
		"提示：從既有群組開出的新分頁，不受「相同網域」規則限制，一律留在該群組中。僅在分組依據選擇「相同網域」時有效。",
	settings_naming: "群組命名方式",
	naming_dom: "網域",
	naming_subdom: "子網域.網域",
	naming_subdomtld: "子網域.網域.頂級網域",
	naming_title: "來源分頁的標題",
	naming_nameless: "不命名",
	settings_naming_hint:
		"提示：預設以網域命名群組，例如 dev.facebook.com -> facebook。",
	settings_maximum: "每個群組的分頁數上限",
	settings_maximum_hint_1: "0（預設）= 不限制分頁數。",
	settings_maximum_hint_bold: "1 = Tabius 不會有任何作用",
	settings_maximum_hint_2: "（不適用）。2 - 999 = 分頁數上限。",
	settings_lonely: "群組只剩 1 個分頁時自動解散",
	settings_lonely_hint:
		"提示：當群組中的分頁數降到 1 個時，會將剩下的那個分頁移出群組。鎖定群組不會被解散。",
	settings_autocollapse: "自動收合未使用的分頁群組",
	settings_autocollapse_hint:
		"提示：切換分頁時，會自動收合目前分頁所在群組以外的所有群組。",
	settings_section_general: "一般設定",
	settings_save: "儲存設定",
	settings_save_hint:
		"上方按鈕只儲存一般設定；下方的自訂規則、黑名單網站、鎖定群組與快速切換分頁的變更會自動儲存。",
	toast_settings_saved: "設定已儲存",

	custom_title: "自訂分組規則",
	custom_url_label: "網址關鍵字",
	custom_alias_label: "群組名稱",
	custom_color_label: "群組顏色",
	custom_hint:
		"輸入一個或多個以逗號分隔的關鍵字（例如：github, youtube, docs.example.com），不需要加 https://。網域包含關鍵字的頁面載入後，會套用這條規則的群組名稱與顏色。加上路徑（例如「github.com/myorg」）則只比對該路徑底下的頁面。不比對網址的查詢參數（?後面的部分），不分大小寫，重複的關鍵字會被忽略。分頁開啟符合的頁面時，即使已在其他群組中也會被移到此群組；單純重新整理頁面則會留在原本的群組。已釘選的分頁和鎖定群組中的分頁不會被移動；但規則仍可把分頁加入鎖定群組。",
	custom_existing: "修改現有規則",
	custom_empty: "目前還沒有自訂規則，請在上方為特定網站建立規則。",
	toast_enter_keyword: "請至少輸入一個網址關鍵字。",
	toast_enter_group_name: "請輸入群組名稱。",
	toast_rule_saved: "已儲存新規則",
	toast_rule_deleted: "已刪除自訂規則",
	toast_rule_updated: "已更新自訂規則。",

	block_title: "黑名單網站",
	block_label_domain: "網域或網址",
	block_hint:
		"輸入網站網域或網址，例如「wikipedia.org」或「https://www.wikipedia.org」（https:// 和 www. 可省略）。網域包含此項目的網站都會被列入黑名單，所以「wikipedia.org」也涵蓋「en.wikipedia.org」。加上路徑（例如「github.com/myorg」）則只比對該路徑底下的頁面。從黑名單網站開出或在黑名單網站上載入的分頁不會被分組（鎖定群組內除外）。你也可以在任何網頁上按右鍵，使用 Tabius 選單。",
	block_list: "黑名單網站列表",
	block_empty: "目前還沒有黑名單網站，請在上方加入網站。",
	toast_invalid_domain: "請輸入有效的網域或網址。",
	toast_site_already_blocked: "這個網站已經在黑名單中。",
	toast_block_site_saved: "已將網站加入黑名單。",
	toast_block_deleted: "已刪除黑名單網站。",

	lock_title: "鎖定群組",
	lock_label: "分頁群組名稱",
	lock_hint:
		"輸入分頁群組名稱（不分大小寫）。Tabius 不會把分頁移出鎖定群組：從群組內的分頁點連結開出的新分頁會留在群組中，即使是黑名單網站、群組已達分頁數上限，或在「相同網域」分組下開到不同網域也一樣；其他自訂規則也不會把群組內的分頁移走，只剩 1 個分頁時也不會被解散。只有自訂規則會把分頁加入該群組：符合該群組自訂規則的網站仍會被加入。你也可以在群組內的分頁上按右鍵，使用 Tabius 選單。",
	lock_list: "鎖定群組列表",
	lock_empty: "目前還沒有鎖定群組，請在上方輸入群組名稱。",
	toast_enter_lock_group: "請輸入分頁群組名稱。",
	toast_group_already_locked: "這個分頁群組已經鎖定。",
	toast_lock_saved: "已鎖定分頁群組。",
	toast_lock_deleted: "已刪除鎖定群組。",

	quick_title: "快速切換分頁",
	quick_current: "快速鍵",
	quick_not_set: "未設定",
	quick_change: "變更快速鍵",
	quick_hint:
		"按下快速鍵即可切換回上一個使用的分頁（可跨視窗）。在短時間內連續按，會依序往更早使用過的分頁切換；停止按鍵後，停留的分頁就成為目前分頁，再按一次即可切回原本的分頁。預設為 Alt+Q；若顯示未設定，可能已被其他擴充功能占用。快速鍵需在瀏覽器的擴充功能快速鍵頁面中變更。",
	quick_delay: "連續按鍵間隔",
	quick_delay_hint:
		"在這段時間內（從上一次按鍵起算）再按，會繼續往更早使用過的分頁切換；超過這段時間後再按，則會切回上一個分頁。範圍 {min} - {max} 毫秒，預設 {default} 毫秒，變更後會自動儲存。",

	menu_domain_default: "將此網域加入黑名單",
	menu_domain_unavailable: "將此網域加入黑名單（此頁面無法使用）",
	menu_domain_add: "將網域「{domain}」加入黑名單",
	menu_domain_remove: "將「{domain}」移出黑名單",
	menu_group_default: "鎖定此分頁群組",
	menu_group_not_in_group: "鎖定此分頁群組（分頁不在群組中）",
	menu_group_no_name: "鎖定此分頁群組（群組沒有名稱）",
	menu_group_add: "鎖定群組「{group}」",
	menu_group_remove: "解除鎖定群組「{group}」",
};

const messages: Record<Language, Record<MessageKey, string>> = { en, zh_TW };

// language names are always shown in their own language
export const LANGUAGE_NAMES: Record<Language, string> = {
	en: "English",
	zh_TW: "繁體中文",
};

export function isLanguageSetting(value: unknown): value is LanguageSetting {
	return LANGUAGE_SETTINGS.includes(value as LanguageSetting);
}

function browserLanguage(): Language {
	let ui = "";
	try {
		ui = chrome.i18n.getUILanguage();
	} catch {
		ui = typeof navigator !== "undefined" ? navigator.language : "";
	}
	return ui.toLowerCase().startsWith("zh") ? "zh_TW" : "en";
}

export function resolveLanguage(setting?: LanguageSetting): Language {
	return setting && setting !== "auto" ? setting : browserLanguage();
}

export type TranslateParams = Record<string, string | number>;

export function translate(
	lang: Language,
	key: MessageKey,
	params?: TranslateParams
) {
	const text = messages[lang][key] ?? messages.en[key] ?? key;
	if (!params) return text;
	return text.replace(/\{(\w+)\}/g, (match, name: string) =>
		name in params ? String(params[name]) : match
	);
}

export async function getLanguageSetting(): Promise<LanguageSetting> {
	try {
		const { language } = await chrome.storage.sync.get("language");
		return isLanguageSetting(language) ? language : "auto";
	} catch {
		return "auto";
	}
}

export async function getLanguage(): Promise<Language> {
	return resolveLanguage(await getLanguageSetting());
}
