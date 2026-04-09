import { RISK_META } from "../../lib/constants.js";
import Badge from "./Badge.jsx";

export default function RiskBadge({ level }) {
  const meta = RISK_META[level] || RISK_META.medium;

  return <Badge className={meta.className}>{meta.label}</Badge>;
}
