/**
 * Fixed, non-interactive translucent blobs. Sparse by default; `boost` adds a couple more on inner pages.
 */
export default function PageDecor({ boost = false }) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
      aria-hidden
    >
      <div className="absolute -top-28 -left-20 h-72 w-72 rounded-full bg-white/35 blur-3xl dark:bg-white/[0.06]" />
      <div className="absolute top-[26%] -right-24 h-64 w-64 rounded-[42%] bg-[#ffb703]/25 blur-3xl rotate-12 dark:bg-[#ffd166]/[0.12]" />
      <div className="absolute bottom-8 left-[10%] h-52 w-52 rounded-full bg-white/30 blur-2xl dark:bg-white/[0.05]" />

      {boost ? (
        <>
          <div className="absolute top-[58%] left-[4%] h-44 w-44 rounded-[36%] bg-[#ff2e2e]/12 blur-2xl -rotate-6 dark:bg-[#ff4d4d]/[0.14]" />
          <div className="absolute right-[6%] bottom-[18%] h-40 w-40 rounded-full bg-white/25 blur-2xl dark:bg-white/[0.06]" />
          <div className="absolute top-[12%] left-[38%] h-32 w-32 rounded-[50%] bg-[#fffef5]/40 blur-2xl dark:bg-[#d4f94a]/[0.08]" />
        </>
      ) : null}
    </div>
  );
}
