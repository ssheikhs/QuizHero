export default function StatTile({ label, value, hint, icon }) {
  return (
    <div className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body flex-row items-center justify-between gap-3 p-5">
        <div>
          <p className="text-3xl font-extrabold">{value}</p>
          <p className="text-sm opacity-70">{label}</p>
          {hint && <p className="mt-1 text-xs opacity-50">{hint}</p>}
        </div>
        {icon && (
          <span className="grid h-12 w-12 place-items-center rounded-box bg-primary/10 text-2xl" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}
