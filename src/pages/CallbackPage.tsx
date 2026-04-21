import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";

export default function CallbackPage() {
  const { t } = useTranslation();
  const { handleCallback } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    handleCallback()
      .then(() => navigate("/", { replace: true }))
      .catch((err) => setError(String(err)));
  }, [handleCallback, navigate]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">{t("auth.callback.loginFailed")}</h2>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <a href="/" className="text-blue-600 hover:underline text-sm">
            {t("auth.callback.backToHome")}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
    </div>
  );
}
