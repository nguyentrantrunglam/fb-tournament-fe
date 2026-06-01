import { notFound } from 'next/navigation'

// Catch-all cho route con chưa tồn tại dưới 1 tournament (vd các mục sidebar
// chưa build: registrations, teams, bracket, live...). Bubble lên not-found.tsx
// của segment tournament → hiển thị 404 trong chrome (sidebar + header).
export default function UnmatchedTournamentRoute() {
  notFound()
}
