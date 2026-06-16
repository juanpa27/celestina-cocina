import { STATUS_META } from '../../lib/orderStatus'

export default function StatusBadge({ status }) {
  const s = STATUS_META[status] ?? STATUS_META.pendiente
  const Icon = s.Icon
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
      style={{ background: s.bg, color: s.text, boxShadow: `inset 0 0 0 1px ${s.text}1a` }}
    >
      <Icon size={11} strokeWidth={2.5} />
      {s.label}
    </span>
  )
}
