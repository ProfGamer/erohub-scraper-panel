import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ParseKeys } from "i18next";
import { useI18n } from "../contexts/I18nContext";
import { useTheme } from "../contexts/ThemeContext";

type NavLinkEntry = {
  to: string;
  labelKey: ParseKeys;
  icon: string | string[];
};

const links: NavLinkEntry[] = [
  {
    to: "/",
    labelKey: "sidebar.dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4",
  },
  {
    to: "/groups",
    labelKey: "sidebar.groups",
    icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  },
  {
    to: "/authors",
    labelKey: "sidebar.authors",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    to: "/browse",
    labelKey: "sidebar.browse",
    icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    to: "/posts",
    labelKey: "sidebar.posts",
    icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z",
  },
  {
    to: "/tasks",
    labelKey: "sidebar.tasks",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  {
    to: "/settings",
    labelKey: "sidebar.settings",
    icon: [
      "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
      "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    ],
  },
];

const themeIcons: Record<string, string> = {
  dark: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z",
  light:
    "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z",
  bold: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
};

export default function Sidebar() {
  const { t } = useTranslation();
  const { lang, toggleLang } = useI18n();
  const { theme, cycleTheme, handleLogoClick, nsfw, toggleNsfw } = useTheme();

  return (
    <aside
      className="w-60 flex flex-col h-screen sticky top-0 border-r overflow-y-auto"
      style={{
        background: "var(--bg-sidebar)",
        borderColor: "var(--border-color)",
      }}
    >
      {/* Logo — brand name 'EroHub' is not translated */}
      <button
        onClick={handleLogoClick}
        className="p-4 text-xl border-b text-left select-none"
        style={{ borderColor: "var(--border-color)" }}
      >
        <span
          className="font-bold"
          style={{
            background: "linear-gradient(135deg, var(--accent-pink), var(--accent-blue))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Ero
        </span>
        <span
          style={{
            background: "linear-gradient(135deg, var(--accent-pink), var(--accent-blue))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            opacity: 0.6,
          }}
        >
          Hub
        </span>
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className="nav-glow"
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.625rem 1rem",
              marginBottom: "0.25rem",
              borderRadius: "0.5rem",
              transition: "all 150ms ease",
              borderLeft: "3px solid",
              color: isActive ? "var(--accent-pink)" : "var(--text-secondary)",
              background: isActive ? "var(--sidebar-active)" : "transparent",
              borderLeftColor: isActive ? "var(--accent-pink)" : "transparent",
            })}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {Array.isArray(link.icon) ? (
                link.icon.map((d, i) => <path key={i} d={d} />)
              ) : (
                <path d={link.icon} />
              )}
            </svg>
            <span>{t(link.labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom controls: NSFW → Lang → Theme */}
      <div className="p-3 border-t space-y-1" style={{ borderColor: "var(--border-color)" }}>
        <button
          onClick={toggleNsfw}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors"
          style={{ color: nsfw ? "var(--accent-pink)" : "var(--text-muted)" }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {nsfw ? (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </>
            ) : (
              <>
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </>
            )}
          </svg>
          <span className="text-sm">{nsfw ? t("sidebar.nsfw") : t("sidebar.sfw")}</span>
        </button>

        <button
          onClick={toggleLang}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors"
          style={{ color: "var(--text-secondary)" }}
          title={t("sidebar.language")}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
          <span className="text-sm">{lang === "zh-CN" ? "中文" : "English"}</span>
        </button>

        <button
          onClick={cycleTheme}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={themeIcons[theme]} />
          </svg>
          <span className="text-sm capitalize">{t("sidebar.themeMode", { theme })}</span>
        </button>
      </div>
    </aside>
  );
}
