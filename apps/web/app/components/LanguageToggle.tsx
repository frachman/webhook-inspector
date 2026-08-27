"use client";

export type Language = "en" | "id";

export function LanguageToggle({ language, onChange }: { language: Language; onChange: (language: Language) => void }) {
  return (
    <div className="language-toggle" aria-label="Language">
      <button type="button" className={language === "en" ? "language-active" : "language"} onClick={() => onChange("en")}>EN</button>
      <button type="button" className={language === "id" ? "language-active" : "language"} onClick={() => onChange("id")}>ID</button>
    </div>
  );
}
