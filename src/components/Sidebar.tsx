import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/groups", label: "Groups" },
  { to: "/authors", label: "Authors" },
  { to: "/browse", label: "Browse" },
  { to: "/tasks", label: "Tasks" },
  { to: "/settings", label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-60 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="p-4 text-xl font-bold border-b border-gray-700">
        X Media Scraper
      </div>
      <nav className="flex-1 p-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`
            }
          >
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
