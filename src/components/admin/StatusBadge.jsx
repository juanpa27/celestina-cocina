const STYLES = {
  pendiente:  { bg: '#fef9c3', text: '#854d0e', label: 'Pendiente' },
  preparando: { bg: '#dbeafe', text: '#1e40af', label: 'Preparando' },
  enviado:    { bg: '#ede9fe', text: '#6d28d9', label: 'Enviado' },
  entregado:  { bg: '#dcfce7', text: '#166534', label: 'Entregado' },
  cancelado:  { bg: '#f3f4f6', text: '#6b7280', label: 'Cancelado' },
}

export default function StatusBadge({ status }) {
  const s = STYLES[status] ?? STYLES.pendiente
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  )
}
