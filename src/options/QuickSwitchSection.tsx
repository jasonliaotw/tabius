import { useContext, useEffect, useState } from "preact/hooks";

import { useI18n } from "../context/I18nContext";
import { ToastContext } from "../context/ToastContext";
import {
	normalizeQuickSwitchDelay,
	QUICK_SWITCH_COMMAND,
	QUICK_SWITCH_DELAY_DEFAULT,
	QUICK_SWITCH_DELAY_MAX,
	QUICK_SWITCH_DELAY_MIN,
} from "../const";

// Chrome does not let extensions change their own shortcuts: show the current
// one and send the user to the browser's shortcut page to change it.
// The cycling delay is saved as soon as it is changed.
const QuickSwitchSection = () => {
	const { t } = useI18n();
	const { showToastNotification } = useContext(ToastContext);
	const [shortcut, setShortcut] = useState<string | undefined>();
	const [delay, setDelay] = useState(QUICK_SWITCH_DELAY_DEFAULT);

	function loadShortcut() {
		chrome.commands.getAll((commands) => {
			const command = commands.find((c) => c.name === QUICK_SWITCH_COMMAND);
			setShortcut(command?.shortcut || "");
		});
	}

	useEffect(() => {
		loadShortcut();
		chrome.storage.sync.get("quickswitchdelay", ({ quickswitchdelay }) => {
			if (quickswitchdelay !== undefined) {
				setDelay(normalizeQuickSwitchDelay(quickswitchdelay));
			}
		});
		// refresh when the user comes back from the shortcuts page
		window.addEventListener("focus", loadShortcut);
		return () => window.removeEventListener("focus", loadShortcut);
	}, []);

	function openShortcutsPage() {
		// chrome:// links can't be opened from a page link
		chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
	}

	// fires when the field loses focus or the arrows are used
	async function handleDelayChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const value = normalizeQuickSwitchDelay(
			input.value === "" ? QUICK_SWITCH_DELAY_DEFAULT : input.value
		);
		input.value = String(value); // show the clamped value
		setDelay(value);
		try {
			await chrome.storage.sync.set({ quickswitchdelay: value });
			showToastNotification(t("toast_settings_saved"), "green");
		} catch {
			showToastNotification(t("toast_error_saving"), "red");
		}
	}

	return (
		<section id="quickswitch" class="settings-section">
			<h2 class="sectiontitle">{t("quick_title")}</h2>
			<div class="oneoptioncontainer">
				<div id="langtext">{t("quick_current")}</div>
				<kbd class="shortcutkey">
					{shortcut === undefined
						? "…"
						: shortcut || t("quick_not_set")}
				</kbd>
				<button class="shortcutbutton" onClick={openShortcutsPage}>
					{t("quick_change")}
				</button>
			</div>
			<p>{t("quick_hint")}</p>

			<div class="oneoptioncontainer">
				<div id="langtext">{t("quick_delay")}</div>
				<input
					id="quickswitchdelay"
					type="number"
					value={delay}
					min={QUICK_SWITCH_DELAY_MIN}
					max={QUICK_SWITCH_DELAY_MAX}
					step="100"
					onChange={handleDelayChange}
				/>
				<span class="unitlabel">ms</span>
			</div>
			<p>
				{t("quick_delay_hint", {
					min: QUICK_SWITCH_DELAY_MIN,
					max: QUICK_SWITCH_DELAY_MAX,
					default: QUICK_SWITCH_DELAY_DEFAULT,
				})}
			</p>
		</section>
	);
};

export default QuickSwitchSection;
