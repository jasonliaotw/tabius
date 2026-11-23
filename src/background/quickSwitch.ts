// Quick switch to the previously used tab (keyboard shortcut, see the
// "quick-switch" command in manifest.json).
//
// Keeps a most-recently-used (MRU) list of tab ids across all windows.
// Pressing the shortcut once jumps to the previous tab; pressing it again
// within the "quickswitchdelay" setting (ms since the last press) keeps going
// further back in the list (like Alt+Tab). Once the presses stop, the tab you
// landed on becomes the most recent one, so the next press brings you back to
// where you started.

import {
	normalizeQuickSwitchDelay,
	QUICK_SWITCH_COMMAND,
	QUICK_SWITCH_DELAY_DEFAULT,
} from "../const";

const MRU_LIMIT = 200;

let cycleDelay = QUICK_SWITCH_DELAY_DEFAULT;

async function loadCycleDelay() {
	try {
		const { quickswitchdelay } = await chrome.storage.sync.get(
			"quickswitchdelay"
		);
		if (quickswitchdelay !== undefined) {
			cycleDelay = normalizeQuickSwitchDelay(quickswitchdelay);
		}
	} catch {}
}

chrome.storage.onChanged.addListener((changes, area) => {
	if (area === "sync" && changes.quickswitchdelay) {
		cycleDelay = normalizeQuickSwitchDelay(changes.quickswitchdelay.newValue);
	}
});
const MRU_SESSION_KEY = "quickswitch_mru";

let mru: number[] = [];

// cycling state while the shortcut is pressed repeatedly
let cycleIndex = 0;
let cycleTarget: number | undefined;
let cycleTimer: ReturnType<typeof setTimeout> | undefined;

// The service worker can be stopped at any time: the MRU list is kept in
// session storage (cleared when the browser closes) and rebuilt from the
// tabs' lastAccessed time when there is nothing saved.
const ready = Promise.all([restoreMru(), loadCycleDelay()]);

async function restoreMru() {
	try {
		const saved = await chrome.storage.session?.get(MRU_SESSION_KEY);
		const list = saved?.[MRU_SESSION_KEY];
		if (Array.isArray(list) && list.length) {
			mru = list;
			return;
		}
	} catch {}
	await seedFromOpenTabs();
}

async function seedFromOpenTabs() {
	try {
		const tabs = await chrome.tabs.query({});
		const lastAccessed = (tab: chrome.tabs.Tab) =>
			(tab as chrome.tabs.Tab & { lastAccessed?: number }).lastAccessed ?? 0;
		tabs.sort((a, b) => {
			// active tabs first (the focused window's one on top), then by last use
			if (a.active !== b.active) return a.active ? -1 : 1;
			return lastAccessed(b) - lastAccessed(a);
		});
		const [focused] = await chrome.tabs.query({
			active: true,
			lastFocusedWindow: true,
		});
		mru = tabs.map((tab) => tab.id!).filter((id) => id !== undefined);
		if (focused?.id !== undefined) moveToFront(focused.id);
		else persist();
	} catch {}
}

function persist() {
	try {
		chrome.storage.session?.set({ [MRU_SESSION_KEY]: mru });
	} catch {}
}

function moveToFront(tabId: number) {
	mru = [tabId, ...mru.filter((id) => id !== tabId)].slice(0, MRU_LIMIT);
	persist();
}

function removeTab(tabId: number) {
	const before = mru.length;
	mru = mru.filter((id) => id !== tabId);
	if (mru.length !== before) persist();
}

function stopCycling() {
	if (cycleTimer) clearTimeout(cycleTimer);
	cycleTimer = undefined;
	cycleIndex = 0;
	const landed = cycleTarget;
	cycleTarget = undefined;
	if (landed !== undefined) moveToFront(landed);
}

async function onTabActivated(tabId: number) {
	await ready;
	if (cycleTarget !== undefined) {
		if (tabId === cycleTarget) return; // our own switch, keep the order
		stopCycling(); // the user picked another tab in the middle of cycling
	}
	moveToFront(tabId);
}

async function quickSwitch() {
	await ready;
	if (cycleTimer) clearTimeout(cycleTimer);

	// try the next tab back in the list, skipping tabs that no longer exist
	while (mru.length > 1) {
		// wraps around to the tab where cycling started
		cycleIndex = (cycleIndex + 1) % mru.length;
		const tabId = mru[cycleIndex];
		try {
			cycleTarget = tabId;
			const tab = await chrome.tabs.update(tabId, { active: true });
			if (tab?.windowId !== undefined) {
				await chrome.windows.update(tab.windowId, { focused: true });
			}
			break;
		} catch {
			// tab was closed without us noticing
			cycleTarget = undefined;
			removeTab(tabId);
			cycleIndex--;
		}
	}

	cycleTimer = setTimeout(stopCycling, cycleDelay);
}

export function registerQuickSwitch() {
	chrome.commands.onCommand.addListener((command) => {
		if (command === QUICK_SWITCH_COMMAND) quickSwitch();
	});

	chrome.tabs.onActivated.addListener(({ tabId }) => {
		onTabActivated(tabId);
	});

	// switching windows does not fire tabs.onActivated
	chrome.windows.onFocusChanged.addListener(async (windowId) => {
		if (windowId === chrome.windows.WINDOW_ID_NONE) return;
		try {
			const [tab] = await chrome.tabs.query({ active: true, windowId });
			if (tab?.id !== undefined) onTabActivated(tab.id);
		} catch {}
	});

	chrome.tabs.onRemoved.addListener(async (tabId) => {
		await ready;
		removeTab(tabId);
	});

	// prerendered / discarded tabs can be swapped for a new tab id
	chrome.tabs.onReplaced.addListener(async (addedTabId, removedTabId) => {
		await ready;
		mru = mru.map((id) => (id === removedTabId ? addedTabId : id));
		persist();
	});
}
