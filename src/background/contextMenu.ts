// Right-click menu: blacklist the current tab's domain, or lock its tab group.
// Only imported by the background service worker.

import { getHostname, normalizeUrlKeyword } from "../const";
import {
	lockGroup,
	addUrlToBlocklist,
	unlockGroup,
	deleteUrlFromBlocklist,
	isGroupNameLocked,
	isTheURLNative,
	isValidUrl,
	withBlock,
} from "../helpers";
import { getLanguage, MessageKey, translate, TranslateParams } from "../i18n";

async function tr(key: MessageKey, params?: TranslateParams) {
	return translate(await getLanguage(), key, params);
}

const MENU_DOMAIN = "tabius-blacklist-domain";
const MENU_GROUP = "tabius-blacklist-group";

// "page"/"frame": right-click inside a web page, "action": right-click the
// Tabius toolbar icon (also works on pages where "page" menus don't show).
const CONTEXTS: [
	chrome.contextMenus.ContextType,
	...chrome.contextMenus.ContextType[]
] = ["page", "frame", "action"];

function ignoreLastError() {
	void chrome.runtime.lastError;
}

async function createMenus() {
	const domainTitle = await tr("menu_domain_default");
	const groupTitle = await tr("menu_group_default");
	chrome.contextMenus.removeAll(() => {
		ignoreLastError();
		chrome.contextMenus.create(
			{ id: MENU_DOMAIN, title: domainTitle, contexts: CONTEXTS },
			ignoreLastError
		);
		chrome.contextMenus.create(
			{ id: MENU_GROUP, title: groupTitle, contexts: CONTEXTS },
			ignoreLastError
		);
		refreshActiveTab();
	});
}

function updateMenu(id: string, props: chrome.contextMenus.UpdateProperties) {
	chrome.contextMenus.update(id, props, ignoreLastError);
}

function domainKeyword(url?: string) {
	if (!url || !isValidUrl(url) || isTheURLNative(url)) return "";
	return normalizeUrlKeyword(getHostname(url) ?? "");
}

async function getGroupTitle(groupId?: number) {
	if (groupId === undefined || groupId === -1) return undefined;
	try {
		return (await chrome.tabGroups.get(groupId)).title ?? "";
	} catch {
		return undefined;
	}
}

// Updates both menu items so they describe what clicking will do for this tab.
async function refreshMenusForTab(tab?: chrome.tabs.Tab) {
	const url = tab?.url ?? tab?.pendingUrl;
	const domain = domainKeyword(url);
	if (!domain) {
		updateMenu(MENU_DOMAIN, {
			title: await tr("menu_domain_unavailable"),
			enabled: false,
		});
	} else if (await withBlock(url)) {
		updateMenu(MENU_DOMAIN, {
			title: await tr("menu_domain_remove", { domain }),
			enabled: true,
		});
	} else {
		updateMenu(MENU_DOMAIN, {
			title: await tr("menu_domain_add", { domain }),
			enabled: true,
		});
	}

	const groupTitle = await getGroupTitle(tab?.groupId);
	if (groupTitle === undefined) {
		updateMenu(MENU_GROUP, {
			title: await tr("menu_group_not_in_group"),
			enabled: false,
		});
	} else if (!groupTitle.trim()) {
		updateMenu(MENU_GROUP, {
			title: await tr("menu_group_no_name"),
			enabled: false,
		});
	} else if (await isGroupNameLocked(groupTitle)) {
		updateMenu(MENU_GROUP, {
			title: await tr("menu_group_remove", { group: groupTitle }),
			enabled: true,
		});
	} else {
		updateMenu(MENU_GROUP, {
			title: await tr("menu_group_add", { group: groupTitle }),
			enabled: true,
		});
	}
}

async function refreshActiveTab() {
	try {
		const [tab] = await chrome.tabs.query({
			active: true,
			lastFocusedWindow: true,
		});
		await refreshMenusForTab(tab);
	} catch {}
}

async function refreshTabById(tabId: number) {
	try {
		await refreshMenusForTab(await chrome.tabs.get(tabId));
	} catch {}
}

// short "✓" on the toolbar icon so the user sees the click did something
function flashBadge(tabId: number | undefined, text: string) {
	if (tabId === undefined) return;
	chrome.action.setBadgeBackgroundColor({ color: "#28c840", tabId }, ignoreLastError);
	chrome.action.setBadgeText({ text, tabId }, ignoreLastError);
	setTimeout(
		() => chrome.action.setBadgeText({ text: "", tabId }, ignoreLastError),
		1500
	);
}

async function handleMenuClick(
	info: chrome.contextMenus.OnClickData,
	clickedTab?: chrome.tabs.Tab
) {
	if (!clickedTab?.id) return;

	let tab: chrome.tabs.Tab;
	try {
		tab = await chrome.tabs.get(clickedTab.id); // fresh url / groupId
	} catch {
		return;
	}

	let changed = false;

	if (info.menuItemId === MENU_DOMAIN) {
		const url = tab.url ?? tab.pendingUrl;
		if (!domainKeyword(url)) return;
		changed = (await withBlock(url))
			? await deleteUrlFromBlocklist(url)
			: await addUrlToBlocklist(url);
	} else if (info.menuItemId === MENU_GROUP) {
		const groupTitle = await getGroupTitle(tab.groupId);
		if (!groupTitle?.trim()) return;
		changed = (await isGroupNameLocked(groupTitle))
			? await unlockGroup(groupTitle)
			: await lockGroup(groupTitle);
	}

	if (changed) {
		flashBadge(tab.id, "✓");
	}
	await refreshMenusForTab(tab);
}

export function registerContextMenus() {
	// menus persist across service worker restarts; (re)create them on
	// install/update/reload and on browser start
	chrome.runtime.onInstalled.addListener(createMenus);
	chrome.runtime.onStartup.addListener(createMenus);

	chrome.contextMenus.onClicked.addListener((info, tab) => {
		handleMenuClick(info, tab);
	});

	// keep the menu titles in sync with the active tab
	chrome.tabs.onActivated.addListener(({ tabId }) => refreshTabById(tabId));
	chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
		if (
			tab.active &&
			(changeInfo.url !== undefined || changeInfo.groupId !== undefined)
		) {
			refreshTabById(tabId);
		}
	});
	chrome.tabGroups.onUpdated.addListener(() => refreshActiveTab());
	chrome.windows.onFocusChanged.addListener(() => refreshActiveTab());
	chrome.storage.onChanged.addListener((changes, areaName) => {
		if (areaName === "sync" && (changes.blocklist || changes.language)) {
			refreshActiveTab();
		}
	});
}
