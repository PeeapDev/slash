"use client"

import dynamic from "next/dynamic"

const RegisterForm = dynamic(() => import("@/components/auth/register-form"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
    </div>
  )
})

export default function RegisterPage() {
  return <RegisterForm />
}
