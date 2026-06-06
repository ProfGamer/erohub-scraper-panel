import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import Layout from "./components/Layout";
import AuthorsPage from "./pages/AuthorsPage";
import BrowsePage from "./pages/BrowsePage";
import CallbackPage from "./pages/CallbackPage";
import DashboardPage from "./pages/DashboardPage";
import GroupDetailPage from "./pages/GroupDetailPage";
import GroupsPage from "./pages/GroupsPage";
import SettingsPage from "./pages/SettingsPage";
import TasksPage from "./pages/TasksPage";
import PostsPage from "./pages/PostsPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth/callback" element={<CallbackPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected routes — require bot_admin role */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/groups/:id" element={<GroupDetailPage />} />
        <Route path="/authors" element={<AuthorsPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/posts" element={<PostsPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
