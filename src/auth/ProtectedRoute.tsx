import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "./AuthContext";

const REQUIRED_ROLE = import.meta.env.VITE_OIDC_REQUIRED_ROLE || "bot_admin";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { isLoading, isAuthenticated, hasRole, login } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    login();
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-500">{t("auth.redirectingToLogin")}</p>
      </div>
    );
  }

  if (!hasRole(REQUIRED_ROLE)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
