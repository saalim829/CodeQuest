
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function LessonDetails() {
  const { lessonId } = useParams();
  const { token, updateUser } = useAuth();

  const [lesson, setLesson] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadLesson = useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const [lessonResponse, quizResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/lessons`, {
          headers: { Authorization: `Bearer ${token}` },
          signal,
        }),
        fetch(`${API_BASE_URL}/quizzes/lesson/${lessonId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal,
        }),
      ]);

      const lessonData = await lessonResponse.json().catch(() => ({}));
      const quizData = await quizResponse.json().catch(() => ({}));

      if (!lessonResponse.ok) {
        throw new Error(
          lessonData.message || "Failed to load lesson."
        );
      }

      if (!quizResponse.ok) {
        throw new Error(
          quizData.message || "Failed to load lesson quizzes."
        );
      }

      const lessons = Array.isArray(lessonData.lessons)
        ? lessonData.lessons
        : [];

      const found = lessons.find(
        (item) => String(item._id) === String(lessonId)
      );

      if (!found) {
        throw new Error("Published lesson not found.");
      }

      setLesson(found);
      setCompleted(Boolean(found.completed));
      setQuizzes(
        Array.isArray(quizData.quizzes) ? quizData.quizzes : []
      );
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "Unable to load lesson.");
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [lessonId, token]);

  useEffect(() => {
    const controller = new AbortController();
    loadLesson(controller.signal);

    return () => controller.abort();
  }, [loadLesson]);

  async function handleComplete() {
    if (!lesson || completed || completing) return;

    setCompleting(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/lessons/${lesson._id}/complete`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Could not complete lesson."
        );
      }

      setCompleted(true);

      if (data.user) {
        updateUser(data.user);
      }

      setNotice(
        data.alreadyCompleted
          ? "You have already completed this lesson. No extra XP was awarded."
          : `Lesson completed! You earned ${
              data.xpAwarded ?? lesson.xpReward ?? 0
            } XP.`
      );
    } catch (err) {
      setError(err.message || "Could not complete lesson.");
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12 text-zinc-400">
        Loading lesson...
      </main>
    );
  }

  if (error && !lesson) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p role="alert" className="text-red-400">
          {error}
        </p>
        <Link
          to="/courses"
          className="mt-4 inline-block text-lime-400"
        >
          Back to courses
        </Link>
      </main>
    );
  }

  if (!lesson) return null;

  const courseSlug =
    typeof lesson.course === "object" ? lesson.course?.slug : null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      {courseSlug ? (
        <Link
          to={`/courses/${courseSlug}`}
          className="text-sm text-lime-400 hover:underline"
        >
          ← Back to course
        </Link>
      ) : (
        <Link
          to="/courses"
          className="text-sm text-lime-400 hover:underline"
        >
          ← Back to courses
        </Link>
      )}

      <article className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full border border-lime-800 px-3 py-1 text-sm text-lime-300">
            Lesson {lesson.order}
          </span>

          <span className="text-sm text-zinc-400">
            {lesson.estimatedMinutes ?? 10} minutes ·{" "}
            {lesson.xpReward ?? 0} XP
          </span>
        </div>

        <h1 className="mt-6 text-3xl font-bold text-white">
          {lesson.title}
        </h1>

        {lesson.description && (
          <p className="mt-4 text-zinc-400">
            {lesson.description}
          </p>
        )}

        <div className="mt-8 whitespace-pre-wrap leading-8 text-zinc-200">
          {lesson.content}
        </div>

        {notice && (
          <div
            role="status"
            className="mt-8 rounded-xl border border-lime-800 bg-lime-950/40 p-4 text-lime-300"
          >
            {notice}
          </div>
        )}

        {error && (
          <p role="alert" className="mt-6 text-red-400">
            {error}
          </p>
        )}

        <div className="mt-10 flex flex-wrap gap-3 border-t border-zinc-800 pt-6">
          <button
            onClick={handleComplete}
            disabled={completed || completing}
            className={`w-full rounded-xl px-5 py-3 font-semibold sm:w-auto ${
              completed
                ? "cursor-not-allowed border border-zinc-700 bg-zinc-800 text-zinc-400"
                : "bg-lime-400 text-zinc-950 hover:bg-lime-300 disabled:opacity-60"
            }`}
          >
            {completed
              ? "✓ Lesson Completed"
              : completing
                ? "Completing..."
                : `Complete Lesson · Earn ${lesson.xpReward ?? 0} XP`}
          </button>

          {quizzes.length > 0 && (
            <Link
              to={`/quizzes/${quizzes[0].id}`}
              className="inline-flex w-full items-center justify-center rounded-xl border border-indigo-400 px-5 py-3 font-semibold text-indigo-300 hover:bg-indigo-950 sm:w-auto"
            >
              Take Quiz →
            </Link>
          )}
        </div>

        {quizzes.length > 1 && (
          <section className="mt-8 border-t border-zinc-800 pt-6">
            <h2 className="text-lg font-semibold text-white">
              More quizzes
            </h2>

            <ul className="mt-3 space-y-3">
              {quizzes.slice(1).map((quiz) => (
                <li key={quiz.id}>
                  <Link
                    to={`/quizzes/${quiz.id}`}
                    className="text-indigo-300 hover:underline"
                  >
                    {quiz.title} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </main>
  );
}
