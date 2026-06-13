import { RATING_LABELS } from "@/lib/constants";
import type { NomadRatings } from "@/lib/types";

export default function RatingBars({ ratings }: { ratings: NomadRatings }) {
  const keys = Object.keys(RATING_LABELS) as (keyof NomadRatings)[];
  return (
    <dl className="grid grid-cols-1 gap-2.5">
      {keys.map((key) => {
        const value = ratings[key];
        return (
          <div key={key} className="flex items-center gap-3">
            <dt className="w-16 shrink-0 text-xs font-medium text-neutral-500">
              {RATING_LABELS[key]}
            </dt>
            <dd className="flex flex-1 items-center gap-2">
              <div className="flex gap-1" aria-hidden>
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className={`h-1.5 w-full min-w-[10px] flex-1 rounded-full ${
                      n <= value ? "bg-emerald-500" : "bg-neutral-200"
                    }`}
                  />
                ))}
              </div>
              <span
                aria-label={`${value.toFixed(1)} / 5`}
                className="w-7 shrink-0 text-right text-xs font-semibold tabular-nums text-neutral-700"
              >
                {value.toFixed(1)}
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
