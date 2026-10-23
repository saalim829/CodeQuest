
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-lime-400">
            YOUR LEARNING SPACE
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">
            Welcome, {user.username}!
          </h1>
          <p className="mt-2 text-zinc-400">
            Your CodeQuest journey starts here.
          </p>
        </div>

        <button
          onClick={logout}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800"
        >
          Sign out
        </button>
      </div>

      <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Experience Points", user.xp ?? 0],
          ["Current Level", user.level ?? 1],
          ["Learning Streak", `${user.currentStreak ?? 0} days`],
        ].map(([title, value]) => (
          <article
            key={title}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
          >
            <p className="text-sm text-zinc-400">{title}</p>
            <p className="mt-3 text-3xl font-bold text-lime-400">
              {value}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-dashed border-zinc-700 p-8">
        <h2 className="text-xl font-bold text-white">Your next quest</h2>
        <p className="mt-2 text-zinc-400">
          Course catalog and lesson progress will be connected in a
          future development step.
        </p>
      </section>
    </main>
  );
}
