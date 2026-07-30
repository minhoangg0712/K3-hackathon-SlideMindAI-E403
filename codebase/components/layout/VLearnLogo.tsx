/**
 * Dấu hiệu thương hiệu VLearn — dựng lại đúng theo /brand/vinuni-mark.svg
 * của bản gốc (tam giác đỏ + chữ V navy, mọi cạnh 45° hoặc dọc).
 */
export function VinUniMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 613 613"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon fill="#c72127" points="126,115 213.5,202.5 126,290" />
      <polygon
        fill="#134d8b"
        points="486,113 486,296 306,476 133.5,303.5 225,212 306,293 387,212"
        className="dark:fill-white"
      />
    </svg>
  );
}
