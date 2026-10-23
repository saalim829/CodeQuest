
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function Dashboard() {
  const { user, token, logout, updateUser } = useAuth();

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [completedLessons, setCompletedLessons] = useState(() => new Set());
  const [completingLessonId, setCompletingLessonId] = useState(null);
  const [lessonErrors, setLessonErrors] = useState({});
  const [notice, setNotice] = useState("");

  const fetchLessons = useCallback(async (signal) => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await fetch(`${API_BASE_URL}/lessons`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to load lessons");
      }

      const fetchedLessons = Array.isArray(data.lessons)
  ? data.lessons
  : [];

setLessons(fetchedLessons);

setCompletedLessons(
  new Set(
    fetchedLessons
      .filter((lesson) => lesson.completed)
      .map((lesson) => lesson._id)
  )
);
    } catch (error) {
      if (error.name !== "AbortError") {
        setLoadError(error.message || "Unable to load lessons.");
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [token]);

  useEffect(() => {
    const controller = new AbortController();
    fetchLessons(controller.signal);

    return () => controller.abort();
  }, [fetchLessons]);

  async function handleCompleteLesson(lessonId) {
    if (!token || completingLessonId) return;

    setCompletingLessonId(lessonId);
    setNotice("");

    setLessonErrors((previous) => ({
      ...previous,
      [lessonId]: "",
    }));

    try {
      const response = await fetch(
        `${API_BASE_URL}/lessons/${lessonId}/complete`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Could not complete lesson.");
      }

      setCompletedLessons((previous) => {
        const next = new Set(previous);
        next.add(lessonId);
        return next;
      });

      if (data.user) {
        updateUser(data.user);
      }

      setNotice(
        data.alreadyCompleted
          ? "This lesson was already completed. Your XP has not been awarded again."
          : `Lesson completed! You earned ${data.xpAwarded ?? 0} XP.`
      );
    } catch (error) {
      setLessonErrors((previous) => ({
        ...previous,
        [lessonId]: error.message || "Could not complete lesson.",
      }));
    } finally {
      setCompletingLessonId(null);
    }
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12 text-zinc-300">
        Please sign in to view your dashboard.
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-lime-400">
            YOUR LEARNING SPACE
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Welcome, {user.username}!
          </h1>

          <p className="mt-2 text-zinc-400">
            Learn new skills, complete quests, and earn XP.
          </p>
        </div>

        <button
          onClick={logout}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800"
        >
          Sign out
        </button>
      </div>

      {/* Learner statistics */}
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

      {/* Lesson catalog */}
      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-lime-400">
              YOUR NEXT QUEST
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              Available Lessons
            </h2>
          </div>

          <button
            onClick={() => fetchLessons(new AbortController().signal)}
            disabled={loading}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh lessons"}
          </button>
        </div>

        {notice && (
          <div
            role="status"
            className="mt-5 rounded-xl border border-lime-800 bg-lime-950/40 p-4 text-lime-300"
          >
            {notice}
          </div>
        )}

        {loadError && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-800 bg-red-950/40 p-4 text-red-300"
          >
            {loadError}
          </div>
        )}

        {loading && (
          <p className="mt-6 text-zinc-400">Loading published lessons...</p>
        )}

        {!loading && !loadError && lessons.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-zinc-700 p-8 text-center">
            <h3 className="text-lg font-semibold">No lessons available yet</h3>
            <p className="mt-2 text-zinc-400">
              Published lessons will appear here when they are available.
            </p>
          </div>
        )}

        {!loading && lessons.length > 0 && (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {lessons.map((lesson) => {
              const lessonId = lesson._id;
              const isCompleted = completedLessons.has(lessonId);
              const isSubmitting = completingLessonId === lessonId;
              const courseName =
                typeof lesson.course === "object"
                  ? lesson.course?.title
                  : null;

              return (
                <article
                  key={lessonId}
                  className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-lime-400">
                        {courseName || "CodeQuest Lesson"}
                      </p>

                      <h3 className="mt-2 text-xl font-bold">
                        {lesson.title}
                      </h3>
                    </div>

                    <span className="shrink-0 rounded-full border border-lime-800 px-3 py-1 text-sm text-lime-300">
                      +{lesson.xpReward ?? 0} XP
                    </span>
                  </div>

                  <p className="mt-3 flex-1 text-sm leading-6 text-zinc-400">
                    {lesson.description || "Ready for your next challenge?"}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-500">
                    <span>
                      {lesson.estimatedMinutes ?? 10} min
                    </span>
                    {lesson.order != null && (
                      <span>Lesson {lesson.order}</span>
                    )}
                  </div>

                  {lessonErrors[lessonId] && (
                    <p role="alert" className="mt-4 text-sm text-red-400">
                      {lessonErrors[lessonId]}
                    </p>
                  )}

                  <button
                    onClick={() => handleCompleteLesson(lessonId)}
                    disabled={isCompleted || completingLessonId !== null}
                    className={`mt-6 w-full rounded-xl px-4 py-3 font-semibold transition ${
                      isCompleted
                        ? "cursor-not-allowed border border-zinc-700 bg-zinc-800 text-zinc-400"
                        : "bg-lime-400 text-zinc-950 hover:bg-lime-300 disabled:cursor-wait disabled:opacity-60"
                    }`}
                  >
                    {isCompleted
                      ? "✓ Completed"
                      : isSubmitting
                        ? "Completing..."
                        : "Complete Lesson"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
