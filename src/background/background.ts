// Background Script Code

import {
	CustomRule,
	findCustomRule,
	getHostname,
	GROUP_NAMING,
	getOneStorageItem,
	normalizeGroupName,
} from "../const";
import {
	isGroupLocked,
	isGroupNameLocked,
	isTheURLNative,
	withBlock,
} from "../helpers";
import { registerContextMenus } from "./contextMenu";
import { registerQuickSwitch } from "./quickSwitch";

registerContextMenus();
registerQuickSwitch();

const TAB_DRAG_ERROR =
	"Tabs cannot be edited right now (user may be dragging a tab).";
const MAX_RETRIES = 10;

function isTabDragError(error: unknown) {
	return String(error).includes(TAB_DRAG_ERROR);
}

// All grouping work runs through one serial queue. This prevents two tabs that
// finish loading at the same time from each creating their own group with the
// same title, and guarantees that onCreated (opener based grouping) is handled
// before the onUpdated (custom rule) pass for the same tab.
let taskQueue: Promise<void> = Promise.resolve();
function enqueue(task: () => Promise<void>) {
	taskQueue = taskQueue.then(task).catch(() => {});
}

function retryLater(task: () => Promise<void>, attempt: number, delay = 100) {
	if (attempt >= MAX_RETRIES) return;
	setTimeout(() => enqueue(task), delay);
}

chrome.tabs.onCreated.addListener((tab) => enqueue(() => createTab(tab)));

// Tabs opened *by a web page* (link click, middle click, "open link in new tab",
// window.open). Chrome also sets openerTabId on tabs opened by external apps
// (LINE, Slack, Outlook...) - it uses whatever tab happened to be active - so
// openerTabId alone can't tell a real opener apart. This event only fires for
// tabs a page opened.
const NAV_TARGET_WAIT_MS = 500;
const pageOpenedTabs = new Set<number>();
const pageOpenedWaiters = new Map<number, () => void>();

chrome.webNavigation.onCreatedNavigationTarget.addListener(({ tabId }) => {
	pageOpenedTabs.add(tabId);
	pageOpenedWaiters.get(tabId)?.();
});
chrome.tabs.onRemoved.addListener((tabId) => pageOpenedTabs.delete(tabId));

// resolves true if the tab was opened by a web page; the event can arrive a
// little after tabs.onCreated, so wait briefly for it
function wasOpenedByPage(tabId: number): Promise<boolean> {
	if (pageOpenedTabs.delete(tabId)) return Promise.resolve(true);
	return new Promise((resolve) => {
		const finish = (value: boolean) => {
			clearTimeout(timer);
			pageOpenedWaiters.delete(tabId);
			pageOpenedTabs.delete(tabId);
			resolve(value);
		};
		const timer = setTimeout(() => finish(false), NAV_TARGET_WAIT_MS);
		pageOpenedWaiters.set(tabId, () => finish(true));
	});
}

// Tabs whose URL changed since their last "complete" event. Only these may be
// moved out of an existing group by a custom rule, so a plain reload keeps a
// tab where the user put it.
const navigatedTabs = new Set<number>();

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
	if (changeInfo.url) {
		navigatedTabs.add(tabId);
	}
	if (changeInfo.status !== "complete") {
		return;
	}
	const navigated = navigatedTabs.delete(tabId);
	enqueue(() => applyRulesToLoadedTab(tabId, navigated));
});

chrome.tabs.onRemoved.addListener((tabId) => navigatedTabs.delete(tabId));

async function applyRulesToLoadedTab(
	tabId: number,
	navigated: boolean,
	attempt = 0
) {
	let tab: chrome.tabs.Tab;
	try {
		// re-fetch: the tab may have been grouped/closed while waiting in the queue
		tab = await chrome.tabs.get(tabId);
	} catch {
		return; // tab was closed
	}

	if (!tab.url || isTheURLNative(tab.url) || tab.pinned) {
		// grouping a pinned tab would unpin it
		return;
	}

	try {
		// Tabius never moves a tab out of a locked group - not for a
		// blacklisted site, and not to follow a custom rule into another group.
		if (await isGroupLocked(tab.groupId)) {
			return;
		}

		if (await withBlock(tab.url)) {
			if (tab.groupId !== -1) {
				await chrome.tabs.ungroup(tabId);
			}
			return;
		}

		// A tab that is already grouped is only moved by a custom rule when it
		// navigated to a new URL (not on reload).
		if (tab.groupId !== -1 && !navigated) {
			return;
		}

		// Custom rules are explicit, so they may also move tabs *into* a
		// locked group: only the rule decides, the group lock is not checked.
		const rule = await withCustomRule(tab.url);
		if (!rule) {
			return;
		}

		const matchingGroup = await findGroupByTitle(tab.windowId, rule.alias);

		if (matchingGroup) {
			if (tab.groupId === matchingGroup.id) {
				return; // already where it belongs
			}
			if (await isGroupFull(matchingGroup.id)) {
				return;
			}
			await chrome.tabs.group({ tabIds: tabId, groupId: matchingGroup.id });
		} else {
			const groupId = await chrome.tabs.group({
				tabIds: tabId,
				createProperties: { windowId: tab.windowId },
			});
			const updateProperties: chrome.tabGroups.UpdateProperties = {
				title: rule.alias,
			};
			if (rule.color) {
				updateProperties.color = rule.color;
			}
			await chrome.tabGroups.update(groupId, updateProperties);
		}
	} catch (error) {
		if (isTabDragError(error)) {
			retryLater(
				() => applyRulesToLoadedTab(tabId, navigated, attempt + 1),
				attempt
			);
		}
	}
}

// the existing group in this window with the given title (trimmed, case-insensitive)
async function findGroupByTitle(windowId: number, title?: string) {
	const wanted = normalizeGroupName(title);
	if (!wanted) return undefined;
	const groups = await chrome.tabGroups.query({ windowId });
	return groups.find((group) => normalizeGroupName(group.title) === wanted);
}

// true when the user's "maximum tabs per group" limit has been reached
async function isGroupFull(groupId: number) {
	const maximum = await getOneStorageItem("maximum");
	const limit = parseInt(maximum?.maximum);
	if (!(limit > 1)) {
		return false;
	}
	return (await getSingleGroupNumberOfTab(groupId)) >= limit;
}

//UnGroup an existing tab from its group
function ungroupOneTab(tabId: chrome.tabs.Tab["id"]) {
	// const tabIds = parseInt(tab);
	if (!tabId) {
		return;
	}

	chrome.tabs.ungroup(tabId, () => {
		// console.log("tab was ungrouped")
	});
}

async function createTab(newtab: chrome.tabs.Tab, attempt = 0) {
	// console.log("new tab created");

	if (!newtab.id) {
		return;
	}

	//fetching the new tab info again
	// workaround for tab sometimes not having pending or url for some some seconds.
	let tab: chrome.tabs.Tab;
	try {
		tab = await chrome.tabs.get(newtab.id);
	} catch {
		return; // tab was closed before we got to it
	}

	//TODO: handle no openertab

	let getout = false;
	let newGroup = true;
	let maximumAchieved = false;
	// to stop propagating the function

	//this options is used to create a new tab group down the road

	const options: chrome.tabs.GroupOptions = {
		tabIds: [tab.id!, tab.openerTabId!] //creates a new tab group with the new tab and the opener tab
	};

	// if(tab.id){options.tabIds}

	//getting the original tab to see if it's a member of a group already, for some reason the groupId in tab was always set to -1
	let openerTabInfo: chrome.tabs.Tab;
	if (tab.openerTabId) {
		try {
			openerTabInfo = await chrome.tabs.get(tab.openerTabId);
		} catch {
			return; // opener tab was already closed
		}
		// console.log("opener tab info", getTabPromise);
		if (openerTabInfo.pinned) return; //if the opener tab is pinned, we don't put the tabs in a group
	} else {
		// no opener at all: custom rules are handled by chrome.tabs.onUpdated
		// as soon as the final URL is known.
		return;
	}

	// new tab page, chrome:// pages, about:blank... are never grouped
	const newTabUrl = tab.pendingUrl ?? tab.url;
	if (!newTabUrl || isTheURLNative(newTabUrl)) {
		return;
	}

	// Opened by an external app (or a bookmark): openerTabId is just the tab
	// that was active. Don't group it with that tab - onUpdated applies the
	// custom rules once the page has loaded.
	if (!(await wasOpenedByPage(tab.id!))) {
		return;
	}

	// The opener is in a locked tab group: the new tab stays in that group
	// (chrome adds tabs opened from a grouped tab to it by itself), whatever the
	// blacklisted sites, the maximum tabs per group or the same domain option say.
	if (await isGroupLocked(openerTabInfo.groupId)) {
		try {
			await chrome.tabs.group({
				tabIds: tab.id!,
				groupId: openerTabInfo.groupId,
			});
		} catch (error) {
			if (isTabDragError(error)) {
				retryLater(() => createTab(tab, attempt + 1), attempt, 50);
			}
		}
		return;
	}

	// checking if a blocking rule exists if yes stop running the function
	const blockFound = await withBlock(openerTabInfo?.url);
	if (blockFound) {
		// it is possible that a blocksite can be opened from an already existing group, in that case it will be
		// part of a group already, so this function will exit, and wont let maximum calculation to happen
		// console.log("block found");
		try {
			ungroupOneTab(tab.id);
		} catch (error) {}
		return;
	}

	//checking if it is not included in a group, else creates a new group
	if (openerTabInfo?.groupId !== -1) {
		options.groupId = openerTabInfo?.groupId;
		newGroup = false;
	}
	// console.log(newGroup, "new group");
	// console.log(options);

	// checking maximum limitation

	const maximumPropmise = await getOneStorageItem("maximum");

	if (maximumPropmise?.maximum && parseInt(maximumPropmise.maximum) > 1) {
		if (!newGroup) {
			//checking if its a new group
			const tabsNumber = await getSingleGroupNumberOfTab(
				openerTabInfo?.groupId
			);
			// console.log("number of tabs", tabsNumber, maximumPropmise.maximum);

			if (tabsNumber > parseInt(maximumPropmise.maximum)) {
				// console.log("no group should be created");
				maximumAchieved = true;

				// chrome will include the tab in the existing group anyway, so we have to ungroup it manually
				ungroupOneTab(tab.id);
			}
		}
	}

	try {
		// checking if any of the url exists at all first, sometimes the urls are empty but it still gets a name :S
		// console.log("I was run", tab, maximumAchieved);
		// const newnewtab = await chrome.tabs.get(tab.id);
		// console.log("new  new tab after", tab);
		// ?? should also check origin url

		if (
			(tab.url || tab.pendingUrl) &&
			!isTheURLNative(tab.pendingUrl ?? tab.url) &&
			!isTheURLNative(openerTabInfo?.url) &&
			!maximumAchieved
		) {
			// console.log("max ach", maximumAchieved);
			// excluding all native chrome protocol pages
			// has side effects. looks like some time tabs are opened without having a pendingURL property
			// results in error when pendingUrl is not found while opening the tab directly.
			// this can however be used to control whether tab group should be created by right clicking or just by target _blank

			const groupByPropmise = await getOneStorageItem("groupby"); //chrome.storage.sync.get([K_GROUP_BY_RULE]);
			const originalURL = openerTabInfo?.url;
			const newUrl = tab.pendingUrl ?? tab.url;
			if (
				groupByPropmise?.groupby === "sd" &&
				getHostname(originalURL) !== getHostname(newUrl)
			) {
				// console.log("true, domain didnt match");
				getout = true;
				// this will be uncommented, it will prevent tab from being group together if they are not from the same domain when sd is on
				// question is where to put this check??
			}
			if (getout) {
				// let tabIds = tab.id;

				const regardlessPropmise = await getOneStorageItem("regardless");

				// console.log("regardless", regardlessPropmise);
				if (regardlessPropmise?.regardless !== true) {
					ungroupOneTab(tab.id);
				}
				// now I have option to combine new tab from a group to always be in the group regardless of domain
				// to be implemented. IMPLEMENTED!
				return;
				// by default chrome will group the tab anyway if it was opened from a group, NOT ANYMORE
			}
			// For a new group, work out its name first so we never create a group
			// whose name is locked - unless a custom rule named it: custom
			// rules may put tabs into a locked group.
			let naming: chrome.tabGroups.UpdateProperties | undefined;
			if (newGroup) {
				const resolved = await resolveGroupProperties(openerTabInfo);
				naming = resolved.properties;
				if (
					!resolved.fromCustomRule &&
					(await isGroupNameLocked(naming.title))
				) {
					return;
				}

				// A custom rule names one shared group ("facebook.com, instagram.com"
				// -> "Social"): if that group already exists in this window, join it
				// instead of creating a second group with the same name.
				if (resolved.fromCustomRule) {
					const ruleGroup = await findGroupByTitle(
						openerTabInfo.windowId,
						naming.title
					);
					if (ruleGroup) {
						if (!(await isGroupFull(ruleGroup.id))) {
							await chrome.tabs.group({
								tabIds: options.tabIds,
								groupId: ruleGroup.id,
							});
						}
						return;
					}
				}
			}

			//creating the group
			const groupId = await chrome.tabs.group(options); //returns group id

			//only name the group if it doesn't have a title already
			const existingTabGroup = await chrome.tabGroups.get(groupId);

			if (!existingTabGroup.title) {
				naming ??= (await resolveGroupProperties(openerTabInfo)).properties;
				// updating the group after creation
				try {
					await chrome.tabGroups.update(groupId, naming);
				} catch (error) {
					// console.log(error, groupId, naming);
				}
			}
		}
	} catch (error) {
		if (isTabDragError(error)) {
			retryLater(() => createTab(tab, attempt + 1), attempt, 50);
		}
	}
}

// Title (and color) for a group created from the opener tab: a matching custom
// rule wins, otherwise the user's naming setting decides.
async function resolveGroupProperties(openerTab: chrome.tabs.Tab): Promise<{
	properties: chrome.tabGroups.UpdateProperties;
	fromCustomRule: boolean;
}> {
	// custom rules are matched against the original (opener) tab
	const crule = await withCustomRule(openerTab.url);
	if (crule) {
		return {
			properties: crule.color
				? { title: crule.alias, color: crule.color }
				: { title: crule.alias },
			fromCustomRule: true,
		};
	}
	const title = await getDomain(
		openerTab.pendingUrl ?? openerTab.url,
		openerTab
	); //getting original tab's url and checking if it's pending
	return { properties: { title }, fromCustomRule: false };
}

async function getDomain(url?: string, openerTab?: chrome.tabs.Tab) {
	if (!url) {
		return;
	}

	const domain = new URL(url).hostname;
	const fragments = domain.split(".");
	// console.log("url pieces", fragments);
	// let groupname = justDomain();
	const groupnamePropmise = (await getOneStorageItem("naming")) as {
		naming: GROUP_NAMING;
	}; //chrome.storage.sync.get<StorageKey>([K_NAMING_RULE]);
	// console.log(groupnamePropmise);

	switch (groupnamePropmise?.naming) {
		case "dom":
			return justDomain();

		case "subdom":
			return fragments.length > 2
				? fragments[0] + "." + fragments[1]
				: fragments[0];

		case "subdomtld":
			return domain;

		case "nameless":
			return "";

		case "title":
			return openerTab?.title ? getOgSiteTitle(openerTab) : justDomain(); //in case the title is empty, we return the domain

		default:
			return justDomain();
	}

	function justDomain() {
		if (fragments.length > 2) {
			return fragments[1];
		}
		return fragments[0];
	}
}

function getOgSiteTitle(tab: chrome.tabs.Tab) {
	//have to limit the title to some chars in future version?
	//currently Chrome will truncate it anyway
	return tab.title;
}

//return the rule if it exists for the said url
async function withCustomRule(url?: string): Promise<CustomRule | false> {
	if (!url) {
		return false;
	}

	try {
		const rules = await getOneStorageItem("customrules"); //chrome.storage.sync.get([K_CUSTOM_RULES]);
		return findCustomRule(rules?.customrules, url) ?? false;
	} catch (error) {
		// console.log(error);
		return false;
	}
}

async function getSingleGroupNumberOfTab(tabGroupId?: number) {
	if (!tabGroupId) return 0; //with no groupId, chrome will return the number of all tabs that are open

	const queryInfo = {
		groupId: tabGroupId,
	};
	const tabNumbers = await chrome.tabs.query(queryInfo);
	//Gets all tabs that have the specified properties, or all tabs if no properties are specified.
	return tabNumbers.length;
}

// group event related

chrome.tabs.onRemoved.addListener(async (_tabId, removeInfo) => {
	if (removeInfo.isWindowClosing) return; // the whole window is going away

	const lonely = await getOneStorageItem("lonely"); //chrome.storage.sync.get([K_LONELY]);
	if (!lonely?.lonely) return;

	const tabGroups = await chrome.tabGroups.query({
		windowId: removeInfo.windowId,
	});

	await Promise.all(tabGroups.map((group) => ungroupIfLonely(group.id)));
});

// ungroups the tab if it is the only one left in its group
// (a locked group is never dissolved)
async function ungroupIfLonely(tabGroupId: number) {
	const tabs = await chrome.tabs.query({ groupId: tabGroupId });
	if (tabs.length !== 1) {
		return false;
	}
	if (await isGroupLocked(tabGroupId)) {
		return false;
	}
	const tabId = tabs[0].id;
	if (tabId) {
		try {
			await chrome.tabs.ungroup(tabId);
		} catch {}
	}
	return true;
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
	//check if I should autocollapse tabs in the groups

	const autocollapse = await getOneStorageItem("autocollapse"); //chrome.storage.sync.get([K_AUTO_COLLAPSE]);

	if (!autocollapse?.autocollapse) return; //we don't have to do anything

	//handle if current tab is already inside a tabgroup
	let currentTab: chrome.tabs.Tab;
	try {
		currentTab = await chrome.tabs.get(activeInfo.tabId);
	} catch {
		return;
	}

	const currentTabGroup = currentTab.groupId;
	//if currentTab.groupId === -1, the tab is not part of any tab groups

	//find tab groups in the window where the tab was activated
	const tabGroups = await chrome.tabGroups.query({
		windowId: activeInfo.windowId,
	});

	// console.log("tabgroups", tabGroups);

	for (const group of tabGroups) {
		if (group.id === currentTabGroup || group.collapsed) {
			continue;
		}
		const groupId = group.id;
		const updateProperties = {
			collapsed: true,
		};

		try {
			// console.log("collapsing group", groupId, group.title);
			await chrome.tabGroups.update(groupId, updateProperties);
		} catch (error) {
			if (isTabDragError(error)) {
				setTimeout(() => collapseTabGroup(groupId), 200); //closing this after 0.2 seconds
			}
		}
	} //for of
	// in that case, don't close that
});

async function collapseTabGroup(groupId: number) {
	try {
		await chrome.tabGroups.update(groupId, { collapsed: true });
	} catch {}
}
