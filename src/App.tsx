import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import AuthorsPage from "./pages/AuthorsPage";
import BrowsePage from "./pages/BrowsePage";
import DashboardPage from "./pages/DashboardPage";
import GroupDetailPage from "./pages/GroupDetailPage";
import GroupsPage from "./pages/GroupsPage";
import SettingsPage from "./pages/SettingsPage";
import TasksPage from "./pages/TasksPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/groups/:id" element={<GroupDetailPage />} />
        <Route path="/authors" element={<AuthorsPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
