export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-violet-100 via-base-200 to-sky-100 px-4 py-12">
      <div className="card w-full max-w-md border border-base-300 bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="text-center text-2xl font-extrabold text-primary">{title}</h1>
          {subtitle && <p className="text-center text-sm opacity-70">{subtitle}</p>}
          <div className="mt-4">{children}</div>
          {footer && <div className="mt-4 text-center text-sm">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
