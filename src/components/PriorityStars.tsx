"use client";

export function PriorityStars({ value, onChange, disabled = false }: { value: number; onChange: (value: number) => void; disabled?: boolean }) {
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        return (
          <button
            key={i}
            type="button"
            onClick={() => !disabled && onChange(starValue)}
            disabled={disabled}
            className={`text-2xl focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-black rounded ${
              disabled ? "cursor-default" : "cursor-pointer hover:scale-110 transition-transform"
            }`}
            aria-label={`優先度 ${starValue}`}
          >
            {starValue <= value ? "★" : "☆"}
          </button>
        );
      })}
    </div>
  );
}

