
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function QuizDetails() {
  const { quizId } = useParams();
  const { token } = useAuth();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadQuiz = useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to load this quiz.");
      }

      setQuiz(data.quiz);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "Unable to load this quiz.");
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [quizId, token]);

  useEffect(() => {
    const controller = new AbortController();
    loadQuiz(controller.signal);

    return () => controller.abort();
  }, [loadQuiz]);

  function selectAnswer(questionId, optionIndex) {
    if (result || submitting) return;

    setAnswers((current) => ({
      ...current,
      [questionId]: optionIndex,
    }));

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!quiz || submitting || result) return;

    const unanswered = quiz.questions.some(
      (question) => answers[question.id] === undefined
    );

    if (unanswered) {
      setError("Please answer every question before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/quizzes/${quizId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            answers: quiz.questions.map((question) => ({
              questionId: question.id,
              selectedOptionIndex: answers[question.id],
            })),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to submit your quiz.");
      }

      if (!data.attempt || !Array.isArray(data.attempt.results)) {
        throw new Error("The server returned an unexpected quiz result.");
      }

      setResult(data.attempt);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message || "Unable to submit your quiz.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-100 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="h-8 w-2/3 animate-pulse rounded-lg bg-zinc-800" />
          <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-zinc-800" />
          <div className="mt-10 h-40 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900" />
          <p className="mt-5 text-sm text-zinc-400">Loading quiz...</p>
        </div>
      </main>
    );
  }

  if (!quiz) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-100 sm:px-6">
        <section className="mx-auto max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-white">
            Quiz unavailable
          </h1>

          <p role="alert" className="mt-3 leading-6 text-zinc-300">
            {error || "We couldn't find this quiz."}
          </p>

          <Link
            to="/courses"
            className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            Back to courses
          </Link>
        </section>
      </main>
    );
  }

  const questionCount = quiz.questions.length;
  const answeredCount = quiz.questions.filter(
    (question) => answers[question.id] !== undefined
  ).length;

  return (
    <main className="min-h-screen overflow-x-hidden bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 text-sm font-medium text-violet-300 transition hover:text-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <span aria-hidden="true">←</span>
          Back to courses
        </Link>

        <header className="mt-7 border-b border-zinc-800 pb-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300 sm:text-sm">
            CodeQuest · Knowledge check
          </p>

          <h1 className="mt-3 break-words text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {quiz.title}
          </h1>

          {quiz.description && (
            <p className="mt-4 max-w-2xl break-words text-sm leading-7 text-zinc-300 sm:text-base">
              {quiz.description}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-zinc-300">
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5">
              {questionCount}{" "}
              {questionCount === 1 ? "question" : "questions"}
            </span>

            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5">
              Pass mark: {quiz.passingPercentage}%
            </span>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-800 bg-red-950/50 px-4 py-3 text-sm leading-6 text-red-200"
          >
            {error}
          </div>
        )}

        {result ? (
          <section className="mt-8 space-y-8" aria-live="polite">
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg shadow-black/20">
              <div
                className={`h-1.5 ${
                  result.passed ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />

              <div className="p-5 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 sm:text-sm">
                      Quiz results
                    </p>

                    <h2 className="mt-2 break-words text-2xl font-bold text-white sm:text-3xl">
                      {result.passed ? "Quiz passed!" : "Keep practicing"}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-zinc-300 sm:text-base">
                      {result.passed
                        ? "Well done! You reached the required passing score."
                        : "Review the explanations below and practise again to improve your score."}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold ${
                      result.passed
                        ? "border-emerald-700 bg-emerald-950 text-emerald-300"
                        : "border-amber-700 bg-amber-950 text-amber-200"
                    }`}
                  >
                    {result.passed ? "Passed" : "Not passed"}
                  </span>
                </div>

                <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                  <div className="min-w-0 rounded-xl border border-zinc-700 bg-zinc-950 p-4">
                    <p className="text-sm font-medium text-zinc-400">
                      Your score
                    </p>
                    <p className="mt-2 text-3xl font-bold tabular-nums text-violet-300">
                      {result.percentage}%
                    </p>
                  </div>

                  <div className="min-w-0 rounded-xl border border-zinc-700 bg-zinc-950 p-4">
                    <p className="text-sm font-medium text-zinc-400">
                      Points earned
                    </p>
                    <p className="mt-2 break-words text-2xl font-bold tabular-nums text-white sm:text-3xl">
                      {result.score}
                      <span className="text-lg font-medium text-zinc-400">
                        {" "}/ {result.maxScore}
                      </span>
                    </p>
                  </div>

                  <div className="min-w-0 rounded-xl border border-zinc-700 bg-zinc-950 p-4">
                    <p className="text-sm font-medium text-zinc-400">
                      Passing score
                    </p>
                    <p className="mt-2 text-3xl font-bold tabular-nums text-white">
                      {result.passingPercentage}%
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-zinc-300">
                      Overall performance
                    </span>
                    <span className="tabular-nums text-zinc-300">
                      {result.percentage}%
                    </span>
                  </div>

                  <div
                    className="h-2.5 overflow-hidden rounded-full bg-zinc-700"
                    role="progressbar"
                    aria-label="Quiz score percentage"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={result.percentage}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        result.passed ? "bg-emerald-400" : "bg-violet-400"
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(0, result.percentage))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <section>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white sm:text-2xl">
                  Answer review
                </h2>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  Review your responses, correct answers, and explanations.
                </p>
              </div>

              <div className="space-y-4">
                {result.results.map((item, index) => {
                  const question = quiz.questions.find(
                    (entry) => entry.id === String(item.questionId)
                  );

                  const options = question?.options ?? [];
                  const selectedAnswer = options[item.selectedOptionIndex];
                  const correctAnswer = options[item.correctOptionIndex];

                  return (
                    <article
                      key={item.questionId}
                      className="min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
                    >
                      <div className="p-4 sm:p-6">
                        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <h3 className="min-w-0 break-words text-base font-semibold leading-7 text-white sm:flex-1 sm:text-lg">
                            <span className="mr-2 text-violet-300">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            {item.questionText}
                          </h3>

                          <span
                            className={`self-start rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              item.isCorrect
                                ? "border-emerald-800 bg-emerald-950 text-emerald-300"
                                : "border-red-800 bg-red-950 text-red-300"
                            }`}
                          >
                            {item.isCorrect ? "Correct" : "Incorrect"}
                          </span>
                        </div>

                        <p className="mt-4 text-sm font-medium text-zinc-300">
                          Points earned:{" "}
                          <span className="tabular-nums text-white">
                            {item.pointsEarned} / {item.pointsPossible}
                          </span>
                        </p>

                        <div className="mt-4 space-y-3">
                          <div
                            className={`min-w-0 rounded-xl border p-3.5 sm:p-4 ${
                              item.isCorrect
                                ? "border-emerald-800/80 bg-emerald-950/40"
                                : "border-red-800/80 bg-red-950/30"
                            }`}
                          >
                            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Your answer
                            </p>
                            <p className="mt-1.5 break-words text-sm leading-6 text-zinc-100">
                              {selectedAnswer ?? "No answer recorded"}
                            </p>
                          </div>

                          {!item.isCorrect && (
                            <div className="min-w-0 rounded-xl border border-emerald-800/80 bg-emerald-950/40 p-3.5 sm:p-4">
                              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                                Correct answer
                              </p>
                              <p className="mt-1.5 break-words text-sm leading-6 text-zinc-100">
                                {correctAnswer ?? "Correct answer unavailable"}
                              </p>
                            </div>
                          )}
                        </div>

                        {item.explanation && (
                          <div className="mt-4 border-t border-zinc-800 pt-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">
                              Explanation
                            </p>
                            <p className="mt-2 break-words text-sm leading-7 text-zinc-300">
                              {item.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <div className="flex flex-col gap-3 border-t border-zinc-800 pt-6 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setAnswers({});
                  setResult(null);
                  setError("");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                Try again
              </button>

              <Link
                to="/courses"
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-center font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                Back to courses
              </Link>
            </div>
          </section>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-zinc-300">
                Answer every question to submit your quiz.
              </p>
              <p className="text-sm font-medium tabular-nums text-zinc-400">
                {answeredCount} of {questionCount} answered
              </p>
            </div>

            <div
              className="mb-7 h-1.5 overflow-hidden rounded-full bg-zinc-800"
              role="progressbar"
              aria-label="Questions answered"
              aria-valuemin={0}
              aria-valuemax={questionCount}
              aria-valuenow={answeredCount}
            >
              <div
                className="h-full rounded-full bg-violet-400 transition-all duration-300"
                style={{
                  width: `${
                    questionCount
                      ? (answeredCount / questionCount) * 100
                      : 0
                  }%`,
                }}
              />
            </div>

            <div className="space-y-5">
              {quiz.questions.map((question, index) => {
                const headingId = `question-heading-${question.id}`;

                return (
                  <fieldset
                    key={question.id}
                    disabled={submitting}
                    aria-labelledby={headingId}
                    className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6"
                  >
                    <div
                      id={headingId}
                      className="mb-5 flex min-w-0 items-start gap-3 text-base font-semibold leading-7 text-white sm:text-lg"
                    >
                      <span className="shrink-0 text-sm font-bold tracking-wide text-violet-300">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="min-w-0 flex-1 break-words">
                        {question.questionText}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {question.options.map((option, optionIndex) => {
                        const selected =
                          answers[question.id] === optionIndex;

                        return (
                          <label
                            key={`${question.id}-${optionIndex}`}
                            className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors sm:p-4 ${
                              selected
                                ? "border-violet-400 bg-violet-950/50"
                                : "border-zinc-700 bg-zinc-950 hover:border-zinc-500 hover:bg-zinc-800"
                            } ${
                              submitting
                                ? "cursor-wait opacity-70"
                                : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name={question.id}
                              value={optionIndex}
                              checked={selected}
                              onChange={() =>
                                selectAnswer(question.id, optionIndex)
                              }
                              className="mt-1 h-4 w-4 shrink-0 accent-violet-400"
                            />

                            <span className="min-w-0 flex-1 break-words text-sm leading-6 text-zinc-100 sm:text-base">
                              {option}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}
            </div>

            <div className="mt-7 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
              <p className="text-sm leading-6 text-zinc-300">
                Review your choices before submitting. Your score and explanations will appear after the server evaluates your answers.
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                {submitting ? "Submitting answers..." : "Submit quiz"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
