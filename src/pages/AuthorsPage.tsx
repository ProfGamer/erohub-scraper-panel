import { useState } from "react";
import AuthorForm from "../components/AuthorForm";
import AuthorList from "../components/AuthorList";

export default function AuthorsPage() {
  const [showForm, setShowForm] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Authors</h1>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Add Author</button>
      </div>
      {showForm && <AuthorForm onClose={() => setShowForm(false)} />}
      <AuthorList />
    </div>
  );
}
