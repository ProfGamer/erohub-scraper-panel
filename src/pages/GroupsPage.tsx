import { useState } from "react";
import GroupForm from "../components/GroupForm";
import GroupList from "../components/GroupList";

export default function GroupsPage() {
  const [showForm, setShowForm] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Groups</h1>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ New Group</button>
      </div>
      {showForm && <GroupForm onClose={() => setShowForm(false)} />}
      <GroupList />
    </div>
  );
}
