import { render } from "preact";
import { useContext, useEffect, useState } from "preact/hooks";

import CustomRulesSection from "./CustomRulesSection";
import {
	GROUP_BY,
	GROUP_NAMING,
	getMultipleStorageItems,
	tabiusAscii,
} from "../const";
import BlacklistSection from "./BlacklistSection";
import QuickSwitchSection from "./QuickSwitchSection";
import ToastContextProvider, { ToastContext } from "../context/ToastContext";
import I18nProvider, { useI18n } from "../context/I18nContext";
import {
	isLanguageSetting,
	LANGUAGE_NAMES,
	LANGUAGE_SETTINGS,
	resolveLanguage,
	translate,
} from "../i18n";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// ACTUAL SETTINGS COMPONENT BELOW

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const Settings = () => {
	//Boolean values
	const [lonely, setLonely] = useState(false);
	const [autocollapse, setAutocollapse] = useState(false);
	const [regardless, setRegardless] = useState(false);

	//string values
	const [groupby, setGroupby] = useState<GROUP_BY>("sot");
	const [naming, setNaming] = useState<GROUP_NAMING>("dom");
	//number
	const [maximum, setMaximum] = useState(0);

	//toast notification

	const { showToastNotification } = useContext(ToastContext);
	const { t, setting: languageSetting } = useI18n();

	// the language is saved right away so the whole UI switches immediately
	function handleLanguage(e: Event) {
		const value = (e.currentTarget as HTMLSelectElement).value;
		if (!isLanguageSetting(value)) return;
		chrome.storage.sync.set({ language: value }, () => {
			showToastNotification(
				translate(resolveLanguage(value), "toast_language_saved"),
				"green"
			);
		});
	}

	useEffect(() => {
		restoreValues();
	}, []);

	async function restoreValues() {
		const items = await getMultipleStorageItems([
			"autocollapse",
			"blocklist",
			"customrules",
			"groupby",
			"lonely",
			"maximum",
			"naming",
			"regardless",
			"savedgroups",
			"savedgroupids",
		]);

		console.log(tabiusAscii, "\n", "USER SETTINGS: \n");
		chrome.storage.sync.get(console.log);

		setLonely(items.lonely);
		setAutocollapse(items.autocollapse);
		setRegardless(items.regardless);
		setMaximum(items.maximum);

		setGroupby(items.groupby);
		setNaming(items.naming);
	}

	async function saveSettings() {
		// setOneStorageObject("lonely", lonelyValue);
		// setOneStorageObject("autocollapse", autoCollapse);
		// setOneStorageObject("regardless", regardless);

		try {
			chrome.storage.sync.set(
				{
					groupby: groupby,
					naming: naming,
					regardless: regardless,
					maximum: maximum,
					lonely: lonely,
					autocollapse: autocollapse,
				},
				function () {
					// Update status to let user know options were saved.
					showToastNotification(t("toast_settings_saved"), "green");
				}
			);
		} catch (error) {
			showToastNotification(t("toast_error_saving"), "red");
		}
	}

	function toggleLonelyValue() {
		setLonely((prev) => !prev);
	}
	function toggleCollapseValue() {
		setAutocollapse((prev) => !prev);
	}
	function toggleRegardlessValue() {
		setRegardless((prev) => !prev);
	}

	
	function handleMaximum(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.value) {
			setMaximum(parseInt(target.value));
		}
	}

	function handleGroupBy(e: Event) {
		const target = e.target as HTMLSelectElement;
		if (target.value) {
			setGroupby(target.value as GROUP_BY);
		}
	}

	function handleNaming(e: HTMLElementEventMap["select"]) {
		const target = e.target as HTMLSelectElement;
		if (target.value) {
			setNaming(target.value as GROUP_NAMING);
		}
	}

	return (
		<div id="main">
			<div id="settingsmain">
				<div id="settingsheader">
					<div id="logocontainer">
						<img src="/icon.png" width="128px" height="128px" />
						<div id="textcontainer">
							<div id="title">Tabius 2</div>
							<div id="subtitle">{t("settings_subtitle")}</div>
						</div>
					</div>
					<div class="promocontainer">
						<a
							class="headerbutton"
							href="https://www.buymeacoffee.com/faisalbin"
							target="_blank">
							{t("settings_coffee")}
						</a>
						<a
							class="headerbutton"
							href="https://faisalbin.com"
							target="_blank">
							{t("settings_website")}
						</a>
						<a
							class="headerbutton"
							href="https://chrome.google.com/webstore/detail/tabius-tab-grouping-assis/enceimdjnaccoeikjobaeicfodlfnijp"
							target="_blank">
							{t("settings_rate")}
						</a>
					</div>
				</div>
				<nav class="sectionnav">
					<a href="#general">{t("settings_section_general")}</a>
					<a href="#customrules">{t("custom_title")}</a>
					<a href="#blacklist">{t("block_title")}</a>
					<a href="#quickswitch">{t("quick_title")}</a>
				</nav>

				<section id="general">
				<h2 class="sectiontitle">{t("settings_section_general")}</h2>
				<div class="oneoptioncontainer">
					<div id="langtext">{t("settings_language")}</div>
					<select
						id="uilanguage"
						value={languageSetting}
						onChange={handleLanguage}>
						{LANGUAGE_SETTINGS.map((value) => (
							<option value={value}>
								{value === "auto"
									? t("settings_language_auto")
									: LANGUAGE_NAMES[value]}
							</option>
						))}
					</select>
				</div>
				<p>{t("settings_language_hint")}</p>

				<div class="oneoptioncontainer">
					<div id="langtext">{t("settings_groupby")}</div>
					<select id="groupby" value={groupby} onChange={handleGroupBy}>
						<option value="sot">{t("settings_groupby_sot")}</option>
						<option value="sd">{t("settings_groupby_sd")}</option>
					</select>
				</div>
				<p>{t("settings_groupby_hint")}</p>

				<div id="alttext">
					<label>
						<input
							type="checkbox"
							id="regardless"
							checked={regardless}
							onClick={toggleRegardlessValue}
						/>
						{t("settings_regardless")}
					</label>
				</div>
				<p>{t("settings_regardless_hint")}</p>

				<div class="oneoptioncontainer">
					<div id="langtext">{t("settings_naming")}</div>
					<select id="naming" value={naming} onChange={handleNaming}>
						<option value="dom">{t("naming_dom")}</option>
						<option value="subdom">{t("naming_subdom")}</option>
						<option value="subdomtld">{t("naming_subdomtld")}</option>
						<option value="title">{t("naming_title")}</option>
						<option value="nameless">{t("naming_nameless")}</option>
					</select>
				</div>
				<p>{t("settings_naming_hint")}</p>

				<div class="oneoptioncontainer">
					<div id="langtext">{t("settings_maximum")}</div>
					<input
						id="maximum"
						type="number"
						onInput={handleMaximum}
						value={maximum}
						min="0"
						max="999"
					/>
				</div>
				<p>
					{t("settings_maximum_hint_1")}{" "}
					<b>{t("settings_maximum_hint_bold")}</b>{" "}
					{t("settings_maximum_hint_2")}
				</p>
				<div id="popuptext">
					<label>
						<input
							type="checkbox"
							onClick={toggleLonelyValue}
							id="lonely"
							checked={lonely}
						/>
						{t("settings_lonely")}
					</label>
				</div>
				<p>{t("settings_lonely_hint")}</p>

				<div id="popuptext">
					<label>
						<input
							type="checkbox"
							onClick={toggleCollapseValue}
							id="autocollapse"
							checked={autocollapse}
						/>
						{t("settings_autocollapse")}
					</label>
				</div>
				<p>{t("settings_autocollapse_hint")}</p>

				<div style="display: flex">
					<div style="flex: 1"></div>
					<button id="save" onClick={saveSettings}>
						{t("settings_save")}
					</button>
					<div style="flex: 1"></div>
				</div>
				<p class="savehint">{t("settings_save_hint")}</p>
				</section>

				<CustomRulesSection />
				<BlacklistSection />
				<QuickSwitchSection />
			</div>
		</div>
	);
};

// context needs to be set one level above the consuming components to work !!! IMPORTANT
render(
	<I18nProvider>
		<ToastContextProvider>
			<Settings />
		</ToastContextProvider>
	</I18nProvider>,
	document.getElementById("settings")!
);
