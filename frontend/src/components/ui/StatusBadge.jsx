import { STATUS_META } from "../../lib/constants.js";
import Badge from "./Badge.jsx";

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.uploaded;

  return (
    <Badge className={meta.className}>
      <span className="h-1.5 w-1.5 rounded-full bg-current/70" aria-hidden />
      {meta.label}
    </Badge>
  );
}
