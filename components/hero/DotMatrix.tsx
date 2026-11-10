const GOLDEN_ANGLE = (137.507764 * Math.PI) / 180;

/**
 * Phyllotaxis dot matrix — points placed at successive golden angles
 * (137.5°), radius proportional to √n. Fibonacci count by default.
 * The first `lit` points from the centre outward are lit.
 */
export function DotMatrix({
  lit = 0,
  total = 34,
  className = "core-matrix",
}: {
  lit?: number;
  total?: number;
  className?: string;
}) {
  return (
    <div className={className} aria-hidden="true">
      {Array.from({ length: total }, (_, index) => {
        const angle = index * GOLDEN_ANGLE;
        const radius = Math.sqrt((index + 0.5) / total) * 46;
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        return (
          <span
            key={index}
            className="dot"
            data-lit={index < lit}
            style={{ left: `${x}%`, top: `${y}%` }}
          />
        );
      })}
    </div>
  );
}
