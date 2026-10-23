
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function Courses() {
  const { token } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCourses = useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/courses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to load courses.");
      }

      setCourses(Array.isArray(data.courses) ? data.courses : []);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "Unable to load courses.");
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [token]);

  useEffect(() => {
    const controller = new AbortController();
    loadCourses(controller.signal);

    return () => controller.abort();
  }, [loadCourses]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div>
        <p className="text-sm font-semibold text-lime-400">
          EXPLORE AND LEARN
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">
          Course Catalog
        </h1>
        <p className="mt-3 text-zinc-400">
          Choose a course, learn new skills, and earn experience points.
        </p>
      </div>

      <div className="mt-8">
        {loading && (
          <p className="text-zinc-400">Loading courses...</p>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-800 bg-red-950/40 p-4 text-red-300"
          >
            {error}
            <button
              onClick={() => loadCourses(new AbortController().signal)}
              className="ml-3 underline"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-700 p-10 text-center">
            <h2 className="text-xl font-semibold text-white">
              No courses available yet
            </h2>
            <p className="mt-2 text-zinc-400">
              Published courses will appear here.
            </p>
          </div>
        )}

        {!loading && !error && courses.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <article
                key={course._id}
                className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full border border-lime-800 px-3 py-1 text-xs font-semibold text-lime-300">
                    {course.category}
                  </span>

                  <span className="text-xs capitalize text-zinc-500">
                    {course.difficulty}
                  </span>
                </div>

                <h2 className="mt-5 text-xl font-bold text-white">
                  {course.title}
                </h2>

                <p className="mt-3 flex-1 text-sm leading-6 text-zinc-400">
                  {course.description}
                </p>

                <p className="mt-5 text-sm text-zinc-500">
                  {course.publishedLessonCount} published{" "}
                  {course.publishedLessonCount === 1 ? "lesson" : "lessons"}
                </p>

                <Link
                  to={`/courses/${course.slug}`}
                  className="mt-5 rounded-xl bg-lime-400 px-4 py-3 text-center font-semibold text-zinc-950 hover:bg-lime-300"
                >
                  Explore Course
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
