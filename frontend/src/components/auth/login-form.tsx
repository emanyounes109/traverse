"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const me = await login(values.email, values.password);
      router.replace(me.user.role === "INTERN" ? "/intern/dashboard" : "/staff/dashboard");
    } catch (e) {
      // Show the server message as-is (covers INVALID_CREDENTIALS and ACCOUNT_PENDING)
      setServerError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <div>
      <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-ink">
        Welcome back.
      </h1>
      <p className="mt-2 text-base text-muted">Pick up right where you left off.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        {serverError && <Alert>{serverError}</Alert>}

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          error={errors.password?.message}
          {...register("password")}
        />

        <Button
          type="submit"
          variant="accent"
          loading={isSubmitting}
          trailingIcon={<ArrowRight className="h-4 w-4" />}
        >
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New to Traverse?{" "}
        <Link href="/register" className="font-semibold text-ink underline underline-offset-4">
          Create account
        </Link>
      </p>
    </div>
  );
}