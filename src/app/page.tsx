import { redirect } from 'next/navigation'

// Root path — just send users where they belong
export default function Home() {
  redirect('/dashboard')
}
