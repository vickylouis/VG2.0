import { Images } from "lucide-react";
import ComingSoonCard from "@/components/layout/ComingSoonCard";

export default function GalleryPlaceholder() {
  return (
    <ComingSoonCard
      icon={Images}
      message="The transformation gallery is being built. Progress photos and milestone snapshots will appear here soon."
      action={{ label: "View Journey Timeline", href: "/journey" }}
    />
  );
}
