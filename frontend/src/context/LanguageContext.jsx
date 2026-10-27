import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { translations } from "../i18n/translations";

const LanguageContext = createContext(null);

const STORAGE_KEY = "veda_language";

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "hi" || saved === "en") return saved;
    } catch {
      // Ignore localStorage errors (e.g. private browsing)
    }
    return "en";
  });

  const setLanguage = useCallback((lang) => {
    if (lang !== "en" && lang !== "hi") return;
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Sync <html lang="..."> attribute for accessibility and screen readers
  useEffect(() => {
    document.documentElement.lang = language;
    if (language === "hi") {
      document.body.classList.add("lang-hindi");
    } else {
      document.body.classList.remove("lang-hindi");
    }
  }, [language]);

  /**
   * Translate a key path with optional parameter interpolation
   * @param {string} path - Dot-separated path like "common.login" or "dashboard.welcome"
   * @param {object} [params] - Key-value replacements like { name: "Meera" }
   * @param {string} [fallback] - Fallback string if key not found
   */
  const t = useCallback(
    (path, params = null, fallback = "") => {
      if (!path) return fallback;

      const resolve = (langObj, keyPath) => {
        const parts = keyPath.split(".");
        let curr = langObj;
        for (const p of parts) {
          if (curr === undefined || curr === null) return undefined;
          curr = curr[p];
        }
        return curr;
      };

      let val = resolve(translations[language], path);

      // Fallback to English if not found in current language
      if (val === undefined && language !== "en") {
        val = resolve(translations.en, path);
      }

      if (val === undefined) {
        return fallback || path;
      }

      if (typeof val === "string" && params && typeof params === "object") {
        return Object.entries(params).reduce(
          (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), v !== undefined && v !== null ? String(v) : ""),
          val
        );
      }

      return val;
    },
    [language]
  );

  /**
   * Format an ISO date string in the active locale
   */
  const formatDate = useCallback(
    (isoStr, options = { day: "2-digit", month: "short", year: "numeric" }) => {
      if (!isoStr) return "—";
      try {
        const d = new Date(isoStr);
        return d.toLocaleDateString(language === "hi" ? "hi-IN" : "en-IN", options);
      } catch {
        return isoStr;
      }
    },
    [language]
  );

  /**
   * Helper to format application category code into localized text
   */
  const formatCategory = useCallback(
    (cat) => {
      if (!cat) return t("common.categories.general");
      const mapped = t(`common.categories.${cat}`);
      return mapped !== `common.categories.${cat}` ? mapped : cat;
    },
    [t]
  );

  /**
   * Helper to format decision code into localized text
   */
  const formatDecision = useCallback(
    (code) => {
      if (!code) return t("common.decisions.pending");
      const mapped = t(`common.decisions.${code}`);
      return mapped !== `common.decisions.${code}` ? mapped : code.replace(/_/g, " ");
    },
    [t]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      formatDate,
      formatCategory,
      formatDecision,
      isHindi: language === "hi",
    }),
    [language, setLanguage, t, formatDate, formatCategory, formatDecision]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
