
import { Link } from "react-router";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-6xl items-center px-6 py-16">
      <section className="max-w-3xl">
        <p className="mb-4 font-semibold tracking-widest text-lime-400">
          LEARN • PRACTICE • LEVEL UP
        </p>

        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl">
          Your coding journey,
          <span className="block text-lime-400">gamified.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
          Learn programming one lesson at a time. Track your progress,
          earn XP, build learning streaks, and level up your skills
          with CodeQuest.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to="/register"
            className="rounded-xl bg-lime-400 px-6 py-3 font-bold text-zinc-950 transition hover:bg-lime-300"
          >
            Start your quest
          </Link>

          <Link
            to="/login"
            className="rounded-xl border border-zinc-700 px-6 py-3 font-semibold text-white transition hover:bg-zinc-800"
          >
            Sign in
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ["Earn XP", "Get rewarded for learning."],
            ["Build streaks", "Make progress every day."],
            ["Level up", "Celebrate every milestone."],
          ].map(([title, description]) => (
            <article
              key={title}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5"
            >
              <h2 className="font-bold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
