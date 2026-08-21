import { PageHeading } from "@/shared/components/PageHeading/PageHeading";
import { useT } from "@/shared/i18n/useT";

export function FriendsPage() {
  const t = useT();
  return (
    <div>
      <PageHeading title={t("friendsTitle")} subtitle={t("friendsSub")} />
      <p>{t("friendsEmpty")}</p>
    </div>
  );
}
