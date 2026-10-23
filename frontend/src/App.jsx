
import { Link, Navigate, Route, Routes } from "react-router";

import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import LessonDetails from "./pages/LessonDetails";
import QuizDetails from "./pages/QuizDetails";

function Navbar() {
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="border-b border-zinc-800 bg-zinc-950">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-xl font-extrabold text-lime-400">
          CodeQuest<span className="text-white">.</span>
        </Link>

        <div className="flex items-center gap-5 text-sm">
          {isAuthenticated ? (
            <>
              <span className="hidden text-zinc-400 sm:inline">
                {user.username}
              </span>
              <Link to="/dashboard" className="hover:text-lime-400">
                Dashboard
              </Link>
              <Link to="/courses" className="hover:text-lime-400">
  Courses
</Link>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-lime-400">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-lime-400 px-4 py-2 font-bold text-zinc-950"
              >
                Join now
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />

        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Register />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <Courses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/courses/:slug"
          element={
            <ProtectedRoute>
              <CourseDetails />
            </ProtectedRoute>
          }
        />

        

        <Route
          path="/lessons/:lessonId"
          element={
            <ProtectedRoute>
              <LessonDetails />
            </ProtectedRoute>
          }
        />

        <Route path="/quizzes/:quizId" element={<QuizDetails />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <footer className="border-t border-zinc-800 px-6 py-6 text-center text-sm text-zinc-500">
        CodeQuest · Learn, practice, level up.
      </footer>
    </div>
  );
}
