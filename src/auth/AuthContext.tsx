import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { UserManager, type User } from "oidc-client-ts";
import { oidcConfig } from "./oidc-config";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  handleCallback: () => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const userManager = new UserManager(oidcConfig);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    userManager
      .getUser()
      .then((u) => {
        if (u && !u.expired) {
          setUser(u);
        }
      })
      .finally(() => setIsLoading(false));

    const onUserLoaded = (u: User) => setUser(u);
    const onUserUnloaded = () => setUser(null);

    userManager.events.addUserLoaded(onUserLoaded);
    userManager.events.addUserUnloaded(onUserUnloaded);
    userManager.events.addAccessTokenExpired(onUserUnloaded);

    return () => {
      userManager.events.removeUserLoaded(onUserLoaded);
      userManager.events.removeUserUnloaded(onUserUnloaded);
      userManager.events.removeAccessTokenExpired(onUserUnloaded);
    };
  }, []);

  const login = useCallback(() => userManager.signinRedirect(), []);
  const logout = useCallback(() => userManager.signoutRedirect(), []);
  const handleCallback = useCallback(async () => {
    const u = await userManager.signinRedirectCallback();
    console.log("[AUTH] id_token profile:", u.profile);
    console.log("[AUTH] roles claim:", u.profile["urn:zitadel:iam:org:project:roles"]);
    return u;
  }, []);

  const hasRole = useCallback(
    (role: string): boolean => {
      if (!user?.profile) return false;
      const roles = user.profile["urn:zitadel:iam:org:project:roles"] as
        | Record<string, unknown>
        | undefined;
      return roles != null && role in roles;
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user && !user.expired,
        hasRole,
        login,
        logout,
        handleCallback,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
