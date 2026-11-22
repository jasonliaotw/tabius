import { ComponentChild, createContext } from "preact";
import { useContext, useEffect, useState } from "preact/hooks";
import {
	getLanguageSetting,
	isLanguageSetting,
	Language,
	LanguageSetting,
	MessageKey,
	resolveLanguage,
	translate,
	TranslateParams,
} from "../i18n";

type I18nContextValue = {
	lang: Language;
	setting: LanguageSetting;
	t: (key: MessageKey, params?: TranslateParams) => string;
};

export const I18nContext = createContext<I18nContextValue>({
	lang: "en",
	setting: "auto",
	t: (key, params) => translate("en", key, params),
});

export function useI18n() {
	return useContext(I18nContext);
}

// Loads the language setting before rendering (avoids an English flash) and
// follows changes made from any other page.
export default function I18nProvider({
	children,
}: {
	children: ComponentChild;
}) {
	const [setting, setSetting] = useState<LanguageSetting | undefined>();

	useEffect(() => {
		getLanguageSetting().then(setSetting);

		function onStorageChange(
			changes: { [key: string]: chrome.storage.StorageChange },
			areaName: string
		) {
			if (areaName === "sync" && changes.language) {
				const value = changes.language.newValue;
				setSetting(isLanguageSetting(value) ? value : "auto");
			}
		}
		chrome.storage.onChanged.addListener(onStorageChange);
		return () => chrome.storage.onChanged.removeListener(onStorageChange);
	}, []);

	const lang = resolveLanguage(setting);

	useEffect(() => {
		document.documentElement.lang = lang === "zh_TW" ? "zh-Hant-TW" : "en";
	}, [lang]);

	if (!setting) return null;

	return (
		<I18nContext.Provider
			value={{
				lang,
				setting,
				t: (key, params) => translate(lang, key, params),
			}}>
			{children}
		</I18nContext.Provider>
	);
}
