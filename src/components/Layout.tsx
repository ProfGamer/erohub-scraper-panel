import { Outlet } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTaskWebSocket } from "../hooks/useWebSocket";
import FetchActivityBar from "./FetchActivityBar";
import Sidebar from "./Sidebar";

export default function Layout() {
  const queryClient = useQueryClient();
  const tasks = useTaskWebSocket({
    onTaskCompleted: () => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["media"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  return (
    <div className="flex h-screen transition-colors duration-300" style={{ background: "var(--bg-primary)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <FetchActivityBar tasks={tasks} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
