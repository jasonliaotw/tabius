import { useContext, useEffect, useState } from "preact/hooks";
import {
	BlockList,
	BlockListType,
	getOneStorageItem,
	isLockedGroupEntry,
	normalizeGroupName,
	normalizeUrlKeyword,
} from "../const";
import { generateId } from "../helpers";
import { TrafficLightButton } from "../components/TrafficLightButton";
import { ToastContext } from "../context/ToastContext";
import { useI18n } from "../context/I18nContext";
import { MessageKey } from "../i18n";

// Blacklisted sites ("domain") and locked tab groups ("group") are both stored
// in "blocklist" (told apart by `type`), but each has its own settings section.
type Kind = BlockListType;

const TEXT: Record<
	Kind,
	{
		sectionId: string;
		title: MessageKey;
		label: MessageKey;
		placeholder: string;
		hint: MessageKey;
		list: MessageKey;
		empty: MessageKey;
		saved: MessageKey;
		deleted: MessageKey;
	}
> = {
	domain: {
		sectionId: "blacklist",
		title: "block_title",
		label: "block_label_domain",
		placeholder: "facebook.com",
		hint: "block_hint",
		list: "block_list",
		empty: "block_empty",
		saved: "toast_block_site_saved",
		deleted: "toast_block_deleted",
	},
	group: {
		sectionId: "lockedgroups",
		title: "lock_title",
		label: "lock_label",
		placeholder: "Work",
		hint: "lock_hint",
		list: "lock_list",
		empty: "lock_empty",
		saved: "toast_lock_saved",
		deleted: "toast_lock_deleted",
	},
};

function isKind(entry: BlockList, kind: Kind) {
	return isLockedGroupEntry(entry) === (kind === "group");
}

// the stored list with both kinds of entries
async function readBlocklist(): Promise<BlockList[]> {
	const stored = await getOneStorageItem("blocklist");
	const list: unknown = stored?.blocklist;
	return Array.isArray(list) ? list : [];
}

export default function BlacklistSection({ kind }: { kind: Kind }) {
	// the whole stored list, so saving keeps the other kind's entries
	const [blocklist, setBlocklist] = useState<BlockList[]>([]);
	const [value, setValue] = useState("");

	const { showToastNotification } = useContext(ToastContext);
	const { t } = useI18n();
	const text = TEXT[kind];
	const entries = blocklist.filter((entry) => isKind(entry, kind));

	useEffect(() => {
		readBlocklist().then(setBlocklist);

		// entries can also be changed from the right-click menu, the popup or
		// the other section
		function onStorageChange(
			changes: { [key: string]: chrome.storage.StorageChange },
			areaName: string
		) {
			if (areaName === "sync" && changes.blocklist) {
				const list = changes.blocklist.newValue;
				setBlocklist(Array.isArray(list) ? list : []);
			}
		}
		chrome.storage.onChanged.addListener(onStorageChange);
		return () => chrome.storage.onChanged.removeListener(onStorageChange);
	}, []);

	function onValueChange(e: Event) {
		setValue((e.target as HTMLInputElement).value);
	}

	function buildEntry(): BlockList | string {
		if (kind === "group") {
			const groupName = value.trim();
			if (!groupName) {
				return t("toast_enter_lock_group");
			}
			const normalized = normalizeGroupName(groupName);
			if (
				entries.some((entry) => normalizeGroupName(entry.groupName) === normalized)
			) {
				return t("toast_group_already_locked");
			}
			return { id: generateId(), type: "group", groupName };
		}

		const blockedUrl = normalizeUrlKeyword(value);
		if (!blockedUrl || /[\s,]/.test(blockedUrl)) {
			return t("toast_invalid_domain");
		}
		if (
			entries.some(
				(entry) => normalizeUrlKeyword(entry.blockedUrl ?? "") === blockedUrl
			)
		) {
			return t("toast_site_already_blocked");
		}
		return { id: generateId(), type: "domain", blockedUrl };
	}

	async function addEntry() {
		const entry = buildEntry();
		if (typeof entry === "string") {
			showToastNotification(entry, "red");
			return;
		}

		try {
			// re-read so entries just changed elsewhere are not lost
			const newList = [...(await readBlocklist()), entry];
			await chrome.storage.sync.set({ blocklist: newList });
			setBlocklist(newList);
			setValue("");
			showToastNotification(t(text.saved), "green");
		} catch (error) {
			showToastNotification(t("toast_error_saving"), "red");
		}
	}

	async function deleteEntry(id: string) {
		try {
			const newList = (await readBlocklist()).filter((item) => item.id !== id);
			await chrome.storage.sync.set({ blocklist: newList });
			setBlocklist(newList);
			showToastNotification(t(text.deleted), "green");
		} catch (error) {
			showToastNotification(t("toast_storage_error"), "red");
		}
	}

	const inputId = `${text.sectionId}-input`;

	return (
		<section id={text.sectionId} class="settings-section">
			<div>
				<div className="headercontainer">
					<div className="pophead">
						<div class="title">{t(text.title)}</div>
					</div>
					<div id="ruleinputcontainer">
						<div class="inputblock" style="flex: 1">
							<label for={inputId}>{t(text.label)}</label>
							<input
								type="text"
								placeholder={text.placeholder}
								id={inputId}
								value={value}
								onInput={onValueChange}
							/>
						</div>

						<div class="inputblock">
							<button onClick={addEntry} class="blockaddbutton">
								{t("common_add")}
							</button>
						</div>
					</div>
					<p>{t(text.hint)}</p>
				</div>

				<div>
					<h3>{t(text.list)}</h3>
					<div>
						{entries.length ? (
							entries.map((entry, index) => (
								<div key={entry.id} class="blockcard">
									<div className="blockcardDetails">
										<h1>{index + 1}</h1>
										<span style={{ paddingLeft: "5px" }}>
											{kind === "group" ? entry.groupName : entry.blockedUrl}
										</span>
									</div>
									<div class="trafficLights">
										<TrafficLightButton
											icon="/icons/trash.svg"
											color="red"
											onClick={() => deleteEntry(entry.id)}
											tooltip={t("common_delete_rule")}
										/>
									</div>
								</div>
							))
						) : (
							<p>{t(text.empty)}</p>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}
