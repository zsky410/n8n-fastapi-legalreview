import { STATUS_META } from "../../lib/constants.js";
import Badge from "./Badge.jsx";

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.uploaded;

  return <Badge className={meta.className}>{meta.label}</Badge>;
}
