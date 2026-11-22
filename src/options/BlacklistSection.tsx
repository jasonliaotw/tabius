import { useContext, useEffect, useState } from "preact/hooks";
import {
	BlockList,
	BlockListType,
	getOneStorageItem,
	isGroupBlockEntry,
	normalizeGroupName,
	normalizeUrlKeyword,
} from "../const";
import { generateId } from "../helpers";
import { TrafficLightButton } from "../components/TrafficLightButton";
import { ToastContext } from "../context/ToastContext";
import { useI18n } from "../context/I18nContext";

export default function BlacklistSection() {
	const [blockedSites, setBlockedSites] = useState<BlockList[]>([]);
	const [url, setUrl] = useState("");
	const [type, setType] = useState<BlockListType>("domain");

	const { showToastNotification } = useContext(ToastContext);
	const { t } = useI18n();

	useEffect(() => {
		restoreBlockSites();

		// entries can also be added from the right-click menu or the popup
		function onStorageChange(
			changes: { [key: string]: chrome.storage.StorageChange },
			areaName: string
		) {
			if (areaName === "sync" && changes.blocklist) {
				const list = changes.blocklist.newValue;
				setBlockedSites(Array.isArray(list) ? list : []);
			}
		}
		chrome.storage.onChanged.addListener(onStorageChange);
		return () => chrome.storage.onChanged.removeListener(onStorageChange);
	}, []);

	function onUrlChange(e: Event) {
		const target = e.target as HTMLInputElement;
		setUrl(target.value);
	}

	function onTypeChange(e: Event) {
		setType((e.currentTarget as HTMLSelectElement).value as BlockListType);
	}

	async function restoreBlockSites() {
		const bl = await getOneStorageItem("blocklist");
		if (bl?.blocklist?.length) {
			setBlockedSites(bl.blocklist); //TODO type safe this
		}
	}

	function buildEntry(): BlockList | string {
		if (type === "group") {
			const groupName = url.trim();
			if (!groupName) {
				return t("toast_enter_block_group");
			}
			const normalized = normalizeGroupName(groupName);
			if (
				blockedSites.some(
					(site) =>
						isGroupBlockEntry(site) &&
						normalizeGroupName(site.groupName) === normalized
				)
			) {
				return t("toast_group_already_blocked");
			}
			return { id: generateId(), type: "group", groupName };
		}

		const blockedUrl = normalizeUrlKeyword(url);
		if (!blockedUrl || /[\s,]/.test(blockedUrl)) {
			return t("toast_invalid_domain");
		}
		if (
			blockedSites.some(
				(site) =>
					!isGroupBlockEntry(site) &&
					normalizeUrlKeyword(site.blockedUrl ?? "") === blockedUrl
			)
		) {
			return t("toast_site_already_blocked");
		}
		return { id: generateId(), type: "domain", blockedUrl };
	}

	function addNewBlock() {
		const entry = buildEntry();
		if (typeof entry === "string") {
			showToastNotification(entry, "red");
			return;
		}

		const newBlockList = [...blockedSites, entry];

		try {
			chrome.storage.sync.set(
				{
					blocklist: newBlockList,
				},
				function () {
					setBlockedSites(newBlockList);
					setUrl("");
					showToastNotification(
						type === "group"
							? t("toast_block_group_saved")
							: t("toast_block_site_saved"),
						"green"
					);
				}
			);
		} catch (error) {
			showToastNotification(t("toast_error_saving"), "red");
		}
	}

	function deleteRule(id: string) {
		let newArray = blockedSites.filter((item) => item.id !== id); // replace this with actually deleting the rule in the localstorage

		try {
			chrome.storage.sync.set(
				{
					blocklist: newArray,
				},
				function () {
					setBlockedSites(newArray);
					showToastNotification(t("toast_block_deleted"), "green");
				}
			);
		} catch (error) {
			showToastNotification(t("toast_storage_error"), "red");
		}
	}

	return (
		<section id="blacklist" class="settings-section">
			<div>
				<div className="headercontainer">
					<div className="pophead">
						<div class="title">{t("block_title")}</div>
					</div>
					<div id="ruleinputcontainer">
						<div class="inputblock" style="margin-right: 5px">
							<label for="blocktype">{t("block_type")}</label>
							<select
								id="colors"
								name="blocktype"
								value={type}
								onChange={onTypeChange}>
								<option value="domain">{t("block_type_domain")}</option>
								<option value="group">{t("block_type_group")}</option>
							</select>
						</div>
						<div class="inputblock" style="flex: 1">
							<label for="groupsite">
								{type === "group" ? t("block_label_group") : t("block_label_domain")}
							</label>
							<input
								type="text"
								placeholder={type === "group" ? "Work" : "facebook.com"}
								name="groupsite"
								id="urlToBeBlocked"
								value={url}
								onInput={onUrlChange}
							/>
						</div>

						<div class="inputblock">
							<button onClick={addNewBlock} id="blockaddbutton">
								{t("common_add")}
							</button>
						</div>
					</div>
					<p>{t("block_hint")}</p>
				</div>

				{/* <!-- existing rules --> */}

				<div>
					<h3>{t("block_list")}</h3>
					<div id="blockcontainer">
						{blockedSites?.length ? (
							blockedSites.map((site, index) => (
								<div key={site.id} class="blockcard">
									<div className="blockcardDetails">
										<h1>{index + 1}</h1>
										<span
											style={{
												marginLeft: "8px",
												padding: "0 6px",
												lineHeight: "20px",
												fontSize: "smaller",
												borderRadius: "4px",
												backgroundColor: isGroupBlockEntry(site)
													? "#EA80FC"
													: "#82B1FF",
											}}>
											{isGroupBlockEntry(site) ? t("block_type_group") : t("block_type_domain")}
										</span>
										<span style={{ paddingLeft: "5px" }}>
											{isGroupBlockEntry(site)
												? site.groupName
												: site.blockedUrl}
										</span>
									</div>
									<div class="trafficLights">
										<TrafficLightButton
											icon="/icons/trash.svg"
											color="red"
											onClick={() => deleteRule(site.id)}
											tooltip={t("common_delete_rule")}
										/>
									</div>
								</div>
							))
						) : (
							<p>{t("block_empty")}</p>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}
