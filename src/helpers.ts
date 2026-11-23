import {
	BlockList,
	EXCLUDED_URL,
	getOneStorageItem,
	isLockedGroupEntry,
	matchesUrlKeyword,
	normalizeGroupName,
	normalizeUrlKeyword,
} from "./const";

// NOTE: this module is shared by the popup, the options page and the
// background service worker. Never register chrome.* event listeners here.

export type BlockRule = BlockList;

export function isTheURLNative(url?: string) {
	if (!url) {
		return false;
	}
	return EXCLUDED_URL.some((item) => url.startsWith(item));
}

export function generateId() {
	return crypto.randomUUID();
}

export function isValidUrl(inputurl: string) {
	let u;
	try {
		u = new URL(inputurl);
	} catch (e) {
		return false;
	}
	return u.protocol === "https:" || u.protocol === "http:";
}

function isUrlBlockedBy(item: BlockRule | undefined, url: string) {
	if (!item?.blockedUrl || isLockedGroupEntry(item)) return false;
	return matchesUrlKeyword(normalizeUrlKeyword(item.blockedUrl), url);
}

function isGroupLockedBy(item: BlockRule | undefined, groupName: string) {
	return (
		isLockedGroupEntry(item) &&
		!!groupName &&
		normalizeGroupName(item?.groupName) === groupName
	);
}

export async function getBlocklist(): Promise<BlockList[]> {
	try {
		const stored = await getOneStorageItem("blocklist");
		const blocklist: unknown = stored?.blocklist;
		return Array.isArray(blocklist) ? blocklist : [];
	} catch {
		return [];
	}
}

async function saveBlocklist(blocklist: BlockList[]) {
	try {
		await chrome.storage.sync.set({ blocklist });
		return true;
	} catch {
		return false;
	}
}

// returns true if the url matches any domain entry in the blacklist
export async function withBlock(url?: string): Promise<boolean> {
	if (!url) {
		return false;
	}
	const blocklist = await getBlocklist();
	return blocklist.some((item) => isUrlBlockedBy(item, url));
}

// returns true if a tab group with this name is locked
export async function isGroupNameLocked(groupName?: string) {
	const name = normalizeGroupName(groupName);
	if (!name) return false;
	const blocklist = await getBlocklist();
	return blocklist.some((item) => isGroupLockedBy(item, name));
}

// returns true if the tab group with this id has a locked name
export async function isGroupLocked(groupId?: number) {
	if (groupId === undefined || groupId === -1) return false;
	try {
		const group = await chrome.tabGroups.get(groupId);
		return await isGroupNameLocked(group.title);
	} catch {
		return false;
	}
}

//returns true if blocklist has been added successfully
export async function addUrlToBlocklist(url?: string) {
	if (!url || !isValidUrl(url)) return false;

	const blockedUrl = normalizeUrlKeyword(new URL(url).hostname);
	if (!blockedUrl) return false;

	const blocklist = await getBlocklist();
	if (blocklist.some((item) => isUrlBlockedBy(item, url))) {
		return true; // already blacklisted
	}

	return saveBlocklist([
		...blocklist,
		{ id: generateId(), type: "domain", blockedUrl },
	]);
}

// removes every domain entry that blocks the given url
export async function deleteUrlFromBlocklist(url?: string) {
	if (!url) return false;

	const blocklist = await getBlocklist();
	return saveBlocklist(blocklist.filter((item) => !isUrlBlockedBy(item, url)));
}

export async function lockGroup(groupName?: string) {
	const trimmed = (groupName ?? "").trim();
	if (!trimmed) return false;

	const blocklist = await getBlocklist();
	if (blocklist.some((item) => isGroupLockedBy(item, normalizeGroupName(trimmed)))) {
		return true; // already locked
	}

	return saveBlocklist([
		...blocklist,
		{ id: generateId(), type: "group", groupName: trimmed },
	]);
}

export async function unlockGroup(groupName?: string) {
	const name = normalizeGroupName(groupName);
	if (!name) return false;

	const blocklist = await getBlocklist();
	return saveBlocklist(
		blocklist.filter((item) => !isGroupLockedBy(item, name))
	);
}

export function restoreSingleTab(tab: chrome.tabs.Tab) {
	const createProperties: chrome.tabs.CreateProperties = {
		url: tab.url,
		active: false, //don't move the focus
	};
	chrome.tabs.create(createProperties);
}
