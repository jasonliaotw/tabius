import { useContext, useEffect, useState } from "preact/hooks";
import {
	Colors,
	CustomRule,
	getCustomRuleSearchTerms,
	getOneStorageItem,
} from "../const";
import { TrafficLightButton } from "../components/TrafficLightButton";
import { generateId } from "../helpers";
import { IconButton } from "../components/TrafficLightButton";
import { ToastContext } from "../context/ToastContext";
import { useI18n } from "../context/I18nContext";
import { MessageKey } from "../i18n";

function inputValue(e: Event) {
	return (e.currentTarget as HTMLInputElement | HTMLSelectElement).value;
}

export default function CustomRulesSection() {
	const [url, setUrl] = useState("");
	const [alias, setAlias] = useState("");
	const [color, setColor] = useState<chrome.tabGroups.ColorEnum | "">(""); //random??

	const [customRules, setCustomRules] = useState<CustomRule[]>([]);

	const { showToastNotification } = useContext(ToastContext);
	const { t } = useI18n();

	useEffect(() => {
		restoreCustomRules();
	}, []);

	async function restoreCustomRules() {
		const cr = await getOneStorageItem("customrules");
		if (cr?.customrules?.length) {
			setCustomRules(cr.customrules); //TODO type safe this
		}
	}

	function addNewRule() {
		const id = generateId();
		const searchTerms = getCustomRuleSearchTerms(url);

		if (!searchTerms.length) {
			showToastNotification(t("toast_enter_keyword"), "red");
		} else if (!alias.trim()) {
			showToastNotification(t("toast_enter_group_name"), "red");
		} else {
			const newRule: CustomRule = {
				id: id,
				url: searchTerms.join(", "),
				alias: alias.trim(),
				color: color || undefined, // undefined = random
			};

			let newCustomRules = [...customRules, newRule];

			try {
				chrome.storage.sync.set(
					{
						customrules: newCustomRules,
					},
					function () {
						setCustomRules(newCustomRules);
						// Update status to let user know options were saved.
						showToastNotification(t("toast_rule_saved"), "green");
						setUrl("");
						setAlias("");
						setColor("");
					}
				);
			} catch (error) {
				showToastNotification(t("toast_error_saving"), "red");
			}
		}
	}

	function deleteRule(id: string) {
		let newArray = customRules.filter((item) => item.id !== id); // replace this with actually deleting the rule in the localstorage

		try {
			chrome.storage.sync.set(
				{
					customrules: newArray,
				},
				function () {
					setCustomRules(newArray);
					showToastNotification(t("toast_rule_deleted"), "green");
				}
			);
		} catch (error) {
			showToastNotification(t("toast_storage_error"), "red");
		}
	}

	function editRule(
		id: string,
		newUrl: string,
		newAlias: string,
		newColor: chrome.tabGroups.ColorEnum | ""
	) {
		const searchTerms = getCustomRuleSearchTerms(newUrl);
		if (!searchTerms.length) {
			showToastNotification(t("toast_enter_keyword"), "red");
			return;
		}
		if (!newAlias.trim()) {
			showToastNotification(t("toast_enter_group_name"), "red");
			return;
		}

		const editedRule: CustomRule = {
			id: id,
			url: searchTerms.join(", "),
			alias: newAlias.trim(),
			color: newColor || undefined, // undefined = random
		};
		const newRules = customRules.map((item) =>
			item.id === id ? editedRule : item
		);

		try {
			chrome.storage.sync.set(
				{
					customrules: newRules,
				},
				function () {
					showToastNotification(t("toast_rule_updated"), "green");
					setCustomRules(newRules);
				}
			);
		} catch (error) {
			showToastNotification(t("toast_error_editing"), "red");
		}
	}

	function onUrlChange(e: Event) {
		setUrl(inputValue(e));
	}
	function onAliasChange(e: Event) {
		setAlias(inputValue(e));
	}

	function handleColor(e: Event) {
		setColor(inputValue(e) as chrome.tabGroups.ColorEnum | "");
	}

	return (
		<section id="customrules" class="settings-section">
			<div>
				<div className="headercontainer">
					<div className="pophead">
						<div class="title">{t("custom_title")}</div>
					</div>
					<div id="ruleinputcontainer">
						<div class="inputblock" style="flex: 1">
							<label for="groupsite">{t("custom_url_label")}</label>
							<input
								type="text"
								placeholder="github, youtube, docs.example.com"
								name="groupsite"
								id="customUrl"
								value={url}
								onInput={onUrlChange}
							/>
						</div>
						<div class="inputGap">
							<span>&#10132;</span>
						</div>

						<div class="inputblock">
							<label for="groupalias">{t("custom_alias_label")}</label>
							<input
								type="text"
								id="customAlias"
								placeholder="FB"
								name="groupalias"
								value={alias}
								onInput={onAliasChange}
							/>
						</div>

						<div class="inputblock" style="margin-left: 5px">
							<label for="groupcolor">{t("custom_color_label")}</label>
							<select
								id="colors"
								name="groupcolor"
								value={color}
								onChange={handleColor}>
								<option value="">{t("common_random")}</option>
								{Object.entries(Colors).map(([k, v]) => (
									<option value={k} style={{ backgroundColor: v }}>
										{t(`color_${k}` as MessageKey)}
									</option>
								))}
							</select>
						</div>

						<div class="inputblock">
							<button onClick={addNewRule} id="addbutton">
								{t("common_add")}
							</button>
						</div>
					</div>
					<p>{t("custom_hint")}</p>
				</div>
				<div>
					<h3>{t("custom_existing")}</h3>
					<div id="rulescontainer">
						{customRules?.length ? (
							customRules.map((rule, index) => (
								<CustomRuleCard
									key={rule.id}
									index={index + 1}
									rule={rule}
									editRule={editRule}
									deleteRule={deleteRule}
								/>
							))
						) : (
							<p>{t("custom_empty")}</p>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}

function CustomRuleCard({
	index,
	rule,
	editRule,
	deleteRule,
}: {
	index: number;
	rule: CustomRule;
	editRule: (
		id: string,
		newUrl: string,
		newAlias: string,
		newColor: chrome.tabGroups.ColorEnum | ""
	) => void;
	deleteRule: (id: string) => void;
}) {
	const [url, setUrl] = useState(rule.url);
	const [alias, setAlias] = useState(rule.alias);
	const [color, setColor] = useState<chrome.tabGroups.ColorEnum | "">(
		rule.color ?? ""
	); //random??

	const [showEdit, setShowEdit] = useState(false);

	const { showToastNotification } = useContext(ToastContext);
	const { t } = useI18n();

	function onUrlChange(e: Event) {
		setUrl(inputValue(e));
	}
	function onAliasChange(e: Event) {
		setAlias(inputValue(e));
	}

	function handleColor(e: Event) {
		setColor(inputValue(e) as chrome.tabGroups.ColorEnum | "");
	}

	function confirmEdit() {
		if (!getCustomRuleSearchTerms(url).length) {
			showToastNotification(t("toast_enter_keyword"), "red");
			return;
		}
		if (!alias.trim()) {
			showToastNotification(t("toast_enter_group_name"), "red");
			return;
		}
		// if (!alias.length) {
		// 	showToastNotification("Alias can't be empty.", "red");
		// 	return;
		// }
		//everything should be valid here:

		editRule(rule.id, url, alias, color); // is "" set it uses random color as it is falsy. TODO: typesafe
		setShowEdit(false);
	}

	function cancelEdit() {
		//restore any unsaved changes
		setUrl(rule.url);
		setAlias(rule.alias);
		setShowEdit(false);
		setColor(rule.color ?? "");
	}

	return (
		<div
			class="rulecard"
			style={{
				backgroundColor: rule.color ? Colors[rule.color] : "#fff",
			}}>
			<div className="blockcardDetails" style={{ opacity: showEdit ? 1 : 0.8 }}>
				<h1>{index}</h1>
				<input
					type="text"
					size={42}
					value={url}
					onInput={onUrlChange}
					readOnly={!showEdit}
				/>

				<span>
					{"   "} &#10132; {"   "}
				</span>

				<input
					type="text"
					value={alias}
					onInput={onAliasChange}
					readOnly={!showEdit}
				/>

				{showEdit && (
					<select id="colormodifier" value={color} onChange={handleColor}>
						<option value="">{t("common_random")}</option>
						{Object.entries(Colors).map(([k, v]) => (
							<option value={k} style={{ backgroundColor: v }}>
								{t(`color_${k}` as MessageKey)}
							</option>
						))}
					</select>
				)}
			</div>
			<div class="trafficLights">
				{showEdit ? (
					<span className="trafficSpan">
						<IconButton
							tooltip={t("common_save")}
							icon="/icons/save-floppy-disk.svg"
							onClick={confirmEdit}
							color="#28c840"
							title={" " + t("common_save")}
						/>
						<TrafficLightButton
							tooltip={t("common_cancel")}
							icon="/icons/cancel.svg"
							onClick={cancelEdit}
							color="orange"
						/>
					</span>
				) : (
					<span className="trafficSpan">
						<TrafficLightButton
							icon="/icons/edit-pencil.svg"
							color="#febc30"
							onClick={() => setShowEdit(true)}
							tooltip={t("common_edit")}
						/>
						<TrafficLightButton
							icon="/icons/trash.svg"
							color="#fe5f58"
							onClick={() => deleteRule(rule.id)}
							tooltip={t("common_delete_rule")}
						/>
					</span>
				)}
			</div>
		</div>
	);
}
