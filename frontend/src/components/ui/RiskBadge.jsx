import { RISK_META } from "../../lib/constants.js";
import Badge from "./Badge.jsx";

export default function RiskBadge({ level }) {
  const meta = RISK_META[level] || RISK_META.medium;

  return (
    <Badge className={meta.className}>
      <span className="h-1.5 w-1.5 rounded-full bg-current/70" aria-hidden />
      {meta.label}
    </Badge>
  );
}
