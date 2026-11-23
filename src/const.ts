type ColorMap = {
	[key in chrome.tabGroups.ColorEnum]: string;
};

export const Colors: ColorMap = {
	grey: "#E0E0E0",
	blue: "#82B1FF",
	red: "#E57373",
	yellow: "#FFF176",
	green: "#81C784",
	pink: "#FF80AB",
	purple: "#EA80FC",
	cyan: "#84FFFF",
	orange: "#FC9B51",
};

export const EXCLUDED_URL = [
	"chrome://",
	"chrome-extension://",
	"edge://",
	"extensions://",
	"about:",
];

// storage keys

export type SavedGroup = {
	id: string; //unique id for storage
	chromeId: number; //from chrome when saving
	title?: string;
	color: chrome.tabGroups.ColorEnum;
	// count: number;
	// tabs: UsefulTabInfo[];
	tabs: chrome.tabs.Tab[];
};

// keyboard command for switching to the previously used tab (manifest.json)
export const QUICK_SWITCH_COMMAND = "quick-switch";

// how long (ms) after a press another press keeps going further back
export const QUICK_SWITCH_DELAY_DEFAULT = 500;
export const QUICK_SWITCH_DELAY_MIN = 200;
export const QUICK_SWITCH_DELAY_MAX = 3000;

export function normalizeQuickSwitchDelay(value: unknown) {
	const ms = Number(value);
	if (!Number.isFinite(ms)) return QUICK_SWITCH_DELAY_DEFAULT;
	return Math.min(
		QUICK_SWITCH_DELAY_MAX,
		Math.max(QUICK_SWITCH_DELAY_MIN, Math.round(ms))
	);
}

export type StorageKey =
	| "lonely"
	| "autocollapse"
	| "blocklist"
	| "customrules"
	| "maximum"
	| "groupby"
	| "naming"
	| "regardless"
	| "savedgroups"
	| "savedgroupids"
	| "language"
	| "quickswitchdelay";

export async function getOneStorageItem(itemKey: StorageKey) {
	try {
		return await chrome.storage.sync.get(itemKey);
	} catch (error) {}
}
//TODO: make the return value typesafe. DONE

export async function setOneStorageObject(
	itemKey: StorageKey,
	value: boolean | number | string
) {
	try {
		chrome.storage.sync.set({ [itemKey]: value });
	} catch (error) {}
}

export async function getMultipleStorageItems(itemKeys: StorageKey[]) {
	return chrome.storage.sync.get([...itemKeys]);
}

type StorageObject = {
	itemKey: StorageKey;
	value: boolean | number | string;
};

export async function setMultipleStorageObjects(items: StorageObject[]) {
	const data: Record<string, boolean | number | string> = {};
	for (const { itemKey, value } of items) {
		data[itemKey] = value;
	}
	try {
		await chrome.storage.sync.set(data);
	} catch (error) {}
}

export type GROUP_BY = "sot" | "sd";
export type GROUP_NAMING =
	| "dom"
	| "subdom"
	| "subdomtld"
	| "nameless"
	| "title";

// A blacklist entry is either a domain/url keyword (the original format,
// `type` is missing on entries saved by older versions) or a tab group name.
export type BlockListType = "domain" | "group";

export type BlockList = {
	id: string;
	type?: BlockListType; // undefined = "domain"
	blockedUrl?: string; // domain entries
	groupName?: string; // group entries
};

export function isGroupBlockEntry(item?: BlockList) {
	return item?.type === "group";
}

// group names are compared trimmed and case-insensitively
export function normalizeGroupName(name?: string) {
	return (name ?? "").trim().toLowerCase();
}

export type CustomRule = {
	id: string;
	url: string;
	alias: string;
	color?: chrome.tabGroups.ColorEnum;
};

export function getHostname(url?: string) {
	if (!url) return;
	try {
		return new URL(url).hostname;
	} catch {
		return;
	}
}

// Normalizes a user-entered keyword/URL: lowercase, no protocol, no "www.",
// no trailing slash or dot. "https://www.GitHub.com/" -> "github.com"
export function normalizeUrlKeyword(term: string) {
	return term
		.trim()
		.toLowerCase()
		.replace(/^https?:\/\//, "")
		.replace(/^www\./, "")
		.replace(/\/+$/, "")
		.replace(/\.$/, "");
}

// A keyword without "/" is matched against the hostname only.
// A keyword with "/" (e.g. "github.com/myorg") is matched against hostname + path.
// Query strings and fragments are never matched, so a search for "github"
// on google.com does not count as a GitHub page.
export function matchesUrlKeyword(term: string, url?: string) {
	if (!term || !url) return false;
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return false;
	}
	const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
	if (!term.includes("/")) {
		return hostname.includes(term);
	}
	return (hostname + parsed.pathname.toLowerCase()).includes(term);
}

export function getCustomRuleSearchTerms(ruleUrl: string) {
	return Array.from(
		new Set(
			ruleUrl
				.split(",")
				.map(normalizeUrlKeyword)
				.filter(Boolean)
		)
	);
}

export function findCustomRule(
	rules: CustomRule[] | undefined,
	url?: string
): CustomRule | undefined {
	if (!url || !Array.isArray(rules)) {
		return;
	}

	return rules.find(
		(rule) =>
			typeof rule?.url === "string" &&
			getCustomRuleSearchTerms(rule.url).some((term) =>
				matchesUrlKeyword(term, url)
			)
	);
}

export const tabiusAscii = `
████████╗ █████╗ ██████╗ ██╗██╗   ██╗███████╗    ██████╗     ██████╗ 
╚══██╔══╝██╔══██╗██╔══██╗██║██║   ██║██╔════╝    ╚════██╗   ██╔═████╗
   ██║   ███████║██████╔╝██║██║   ██║███████╗     █████╔╝   ██║██╔██║
   ██║   ██╔══██║██╔══██╗██║██║   ██║╚════██║    ██╔═══╝    ████╔╝██║
   ██║   ██║  ██║██████╔╝██║╚██████╔╝███████║    ███████╗██╗╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝╚═════╝ ╚═╝ ╚═════╝ ╚══════╝    ╚══════╝╚═╝ ╚═════╝ 
                                                                     
`;
