import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { fetchSettings, updateSettings } from "../api/tasks";

export default function Settings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const [interval, setInterval] = useState<number | null>(null);
  const [concurrency, setConcurrency] = useState<number | null>(null);
  const mutation = useMutation({ mutationFn: updateSettings, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }) });
  if (isLoading || !settings) return <div>Loading...</div>;
  return (
    <div className="max-w-lg">
      <div className="bg-white rounded-xl shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fetch Interval (minutes)</label>
          <div className="flex gap-2">
            <input type="number" min={1} className="border rounded-lg px-3 py-2 flex-1" value={interval ?? settings.fetch_interval_minutes} onChange={(e) => setInterval(Number(e.target.value))} />
            <button onClick={() => { if (interval) mutation.mutate({ fetch_interval_minutes: interval }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save</button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Concurrent Fetches</label>
          <div className="flex gap-2">
            <input type="number" min={1} max={10} className="border rounded-lg px-3 py-2 flex-1" value={concurrency ?? settings.max_concurrent_fetches} onChange={(e) => setConcurrency(Number(e.target.value))} />
            <button onClick={() => { if (concurrency) mutation.mutate({ max_concurrent_fetches: concurrency }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save</button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data Directory</label>
          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{settings.data_dir}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cookies Directory</label>
          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{settings.cookies_dir}</div>
        </div>
      </div>
    </div>
  );
}
