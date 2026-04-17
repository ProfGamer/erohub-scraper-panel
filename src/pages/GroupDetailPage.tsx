import { useParams } from "react-router-dom";
import GroupDetail from "../components/GroupDetail";

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <GroupDetail groupId={Number(id)} />;
}
