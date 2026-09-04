import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg text-center">
      <h1 className="text-6xl font-extrabold text-primary">404</h1>
      <p className="text-muted">This page doesn’t exist.</p>
      <Link to="/" className="text-teal-light underline">
        Back to home
      </Link>
    </div>
  )
}
