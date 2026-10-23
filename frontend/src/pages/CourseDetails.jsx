
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function CourseDetails() {
  const { slug } = useParams();
  const { token } = useAuth();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadCourse() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/courses/${encodeURIComponent(slug)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Unable to load course.");
        }

        setCourse(data.course);
        setLessons(Array.isArray(data.lessons) ? data.lessons : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load course.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadCourse();

    return () => controller.abort();
  }, [slug, token]);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12 text-zinc-400">
        Loading course...
      </main>
    );
  }

  if (error || !course) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p role="alert" className="text-red-400">
          {error || "Course not found."}
        </p>
        <Link
          to="/courses"
          className="mt-4 inline-block text-lime-400 hover:underline"
        >
          Back to courses
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link
        to="/courses"
        className="text-sm text-lime-400 hover:underline"
      >
        ← Back to courses
      </Link>

      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-lime-800 px-3 py-1 text-xs text-lime-300">
            {course.category}
          </span>
          <span className="text-sm capitalize text-zinc-400">
            {course.difficulty}
          </span>
        </div>

        <h1 className="mt-5 text-3xl font-bold text-white">
          {course.title}
        </h1>

        <p className="mt-4 max-w-3xl leading-7 text-zinc-400">
          {course.description}
        </p>

        <p className="mt-5 text-sm text-zinc-500">
          {lessons.length} published{" "}
          {lessons.length === 1 ? "lesson" : "lessons"}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-white">
          Course Lessons
        </h2>

        {lessons.length === 0 ? (
          <p className="mt-4 text-zinc-400">
            No published lessons are available for this course yet.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {lessons.map((lesson) => (
              <article
                key={lesson._id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="text-xs text-zinc-500">
                    Lesson {lesson.order} ·{" "}
                    {lesson.estimatedMinutes ?? 10} minutes
                  </p>

                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {lesson.title}
                  </h3>

                  <p className="mt-2 text-sm text-zinc-400">
                    {lesson.description || "Ready to start this lesson?"}
                  </p>

                  <p className="mt-3 text-sm font-medium text-lime-300">
                    {lesson.xpReward ?? 0} XP reward
                  </p>
                </div>

                <Link
                  to={`/lessons/${lesson._id}`}
                  className="shrink-0 rounded-xl bg-lime-400 px-5 py-3 text-center font-semibold text-zinc-950 hover:bg-lime-300"
                >
                  Open Lesson
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
