import { useEffect, useState } from "preact/hooks";
import { Colors } from "../const";
import GroupDetails from "./GroupDetails";
import { TrafficLightButton } from "./TrafficLightButton";
import { useI18n } from "../context/I18nContext";

export function truncateText(text?: string, length = 18) {
	if (!text) return;

	if (text.length > length) {
		return text.slice(0, length) + " ...";
	} else {
		return text;
	}
}

type TabgroupCardProps = {
	id: number;
	name?: string;
	color: chrome.tabGroups.ColorEnum;
	collapsed: boolean;
	saveHandler: (
		id: number,
		color: chrome.tabGroups.ColorEnum,
		name?: string
	) => Promise<void>;
	closeHandler: (id: number) => void;
};

export default function TabgroupCard({
	id,
	name,
	color,
	collapsed = false,
	saveHandler,
	closeHandler,
}: // count,
TabgroupCardProps) {
	const [count, setCount] = useState(0);
	const { t } = useI18n();
	const [groupDetailIsOpen, setGroupDetailOpen] = useState(!collapsed);

	useEffect(() => {
		fetchTabGroupCount();
	}, []);

	async function fetchTabGroupCount() {
		const queryInfo = {
			groupId: id,
		};
		const tabNumbers = await chrome.tabs.query(queryInfo);
		setCount(tabNumbers.length);
	}

	function toggleGroupDetails() {
		setGroupDetailOpen((prev) => !prev);
	}

	async function minimizeGroup(e?: MouseEvent) {
		e?.stopImmediatePropagation(); //prevents parent event getting triggered
		const updateProperties = {
			collapsed: true,
		};
		try {
			await chrome.tabGroups.update(id, updateProperties);
			setGroupDetailOpen(false);
		} catch (error) {}
	}
	async function maximizeGroup(e?: MouseEvent) {
		e?.stopImmediatePropagation();
		const updateProperties = {
			collapsed: false,
		};
		try {
			await chrome.tabGroups.update(id, updateProperties);
			setGroupDetailOpen(true);
		} catch (error) {}
	}

	function closeGroup(e?: MouseEvent) {
		e?.stopImmediatePropagation();
		closeHandler(id);
	}

	return (
		<div
			className="tabgroupContainer"
			style={{
				backgroundColor: Colors[color],
				marginBottom: groupDetailIsOpen ? 0 : -13,
			}}>
			<div
				className="tabgroupCard"
				title={t("card_click_to_open")}
				onClick={toggleGroupDetails}>
				<div className="tabgroupData">
					<span className="tabgroupName">{truncateText(name)}</span>
					<span className="tabgroupCount">{count}</span>
				</div>
				<div className="trafficLights">
					<TrafficLightButton
						onClick={minimizeGroup}
						icon="/icons/minus.svg"
						color="#febc30"
						tooltip={t("card_minimize")}
					/>
					<TrafficLightButton
						onClick={maximizeGroup}
						icon="/icons/enlarge.svg"
						color="#28c840"
						tooltip={t("card_open")}
					/>
					<TrafficLightButton
						onClick={closeGroup}
						icon="/icons/cancel.svg"
						color="#fe5f58"
						tooltip={t("card_close_all")}
					/>
				</div>
			</div>
			{groupDetailIsOpen && (
				<div className="addButton" onClick={() => saveHandler(id, color, name)}>
					{t("card_save_group")}
				</div>
			)}
			{groupDetailIsOpen && <GroupDetails id={id} />}
		</div>
	);
}
