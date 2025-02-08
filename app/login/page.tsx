import { cookies } from "next/headers"
import LoginForm from "./login-form"

export default async function LoginPage() {
  const cookieStore = await cookies()
  const theme = cookieStore.get("theme")

  return <LoginForm  />
}

