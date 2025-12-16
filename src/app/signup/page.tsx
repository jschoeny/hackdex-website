import Link from "next/link";
import SignupForm from "@/components/Auth/SignupForm";

interface SignupPageProps {
  searchParams: Promise<{ redirectTo?: string }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { redirectTo } = await searchParams;

  return (
    <div className="mx-auto my-auto max-w-md w-full px-6 py-10">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-foreground/70">Sign up to submit hacks and manage your profile.</p>
        <p className="mt-4 text-sm border border-amber-200 bg-amber-50 text-amber-950/80 dark:border-amber-700/60 dark:bg-amber-950/60 dark:text-amber-50/80 p-4 rounded-md">
            Only sign up to submit hacks that <span className="text-amber-950 dark:text-amber-50 font-bold">you own</span>. Hacks not by the original creator will be rejected.
        </p>
        <div className="mt-6">
          <SignupForm />
        </div>
        <p className="mt-6 text-sm text-foreground/70">
          Already have an account?
          <Link className="ml-1 text-[var(--accent)] hover:underline" href="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}
