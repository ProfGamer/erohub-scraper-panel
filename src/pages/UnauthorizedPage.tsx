import { useTranslation, Trans } from "react-i18next";
import { useAuth } from "../auth/AuthContext";

export default function UnauthorizedPage() {
  const { t } = useTranslation();
  const { logout, user } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
        <div className="text-5xl mb-4">🚫</div>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">{t("auth.unauthorized.title")}</h1>
        <p className="text-gray-500 text-sm mb-1">
          {t("auth.unauthorized.loggedInAs", { name: user?.profile?.name || user?.profile?.preferred_username || t("auth.unauthorized.unknownUser") })}
        </p>
        <p className="text-gray-500 text-sm mb-6">
          <Trans
            i18nKey="auth.unauthorized.roleRequired"
            components={{ 0: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono" /> }}
          />
        </p>
        <button
          onClick={() => logout()}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t("auth.unauthorized.logoutAndRetry")}
        </button>
      </div>
    </div>
  );
}
