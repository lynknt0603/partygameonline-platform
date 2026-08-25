import { useParams } from "react-router-dom";
import { ProfilePage } from "@/pages/ProfilePage";

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  return <ProfilePage profileUsername={username} />;
}
