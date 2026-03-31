import { isStoreActive } from "@/lib/store-utils";

interface StoreStatusProps {
  openTime: string;
  closeTime: string;
}

const StoreStatus = ({ openTime, closeTime }: StoreStatusProps) => {
  const active = isStoreActive(openTime, closeTime);

  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span
        className={`h-2 w-2 rounded-full ${active ? "bg-success" : "bg-muted-foreground"}`}
      />
      <span className={active ? "text-success" : "text-muted-foreground"}>
        {active ? "Active Now" : "Closed"}
      </span>
    </span>
  );
};

export default StoreStatus;
