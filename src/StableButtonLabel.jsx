// Reserve the space of every label without changing the accessible button name.
export default function StableButtonLabel({ labels, value }) {
  return <span className="stable-button-label">
    {labels.map(label => <span key={label} className="stable-button-size" aria-hidden="true">{label}</span>)}
    <span className="stable-button-value">{value}</span>
  </span>;
}
