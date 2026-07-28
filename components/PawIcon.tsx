export function PawIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor" aria-hidden="true">
      <ellipse cx="15" cy="25" rx="7"   ry="9.2" transform="rotate(-22 15 25)" />
      <ellipse cx="27" cy="17" rx="7.2" ry="9.8" transform="rotate(-8 27 17)" />
      <ellipse cx="40" cy="17" rx="7.2" ry="9.8" transform="rotate(8 40 17)" />
      <ellipse cx="52" cy="25" rx="7"   ry="9.2" transform="rotate(22 52 25)" />
      <ellipse cx="33.5" cy="45" rx="16.5" ry="13.5" />
    </svg>
  );
}

export default PawIcon;
