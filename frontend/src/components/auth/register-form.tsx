"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowRight } from "lucide-react";
import { api, ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

type RoleTab = "INTERN" | "STAFF";

const schema = z
  .object({
    fullName: z.string().trim().min(2, "At least 2 characters").max(100, "At most 100 characters"),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    phone: z.string().trim().optional(),
    workEmail: z.string().trim().optional(),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .max(72, "At most 72 characters")
      .regex(/[A-Za-z]/, "Must include a letter")
      .regex(/\d/, "Must include a number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type FormValues = z.infer<typeof schema>;

const TABS: { value: RoleTab; label: string }[] = [
  { value: "INTERN", label: "Apply as an Intern" },
  { value: "STAFF", label: "Join as Staff" },
];

export function RegisterForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const [role, setRole] = useState<RoleTab>("INTERN");
  const [serverError, setServerError] = useState<string[] | null>(null);
  const [staffMessage, setStaffMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);

    // Send only documented fields: the API rejects unknown ones
    const body =
      role === "INTERN"
        ? {
            role,
            email: values.email,
            password: values.password,
            fullName: values.fullName,
            ...(values.phone ? { phone: values.phone } : {}),
          }
        : {
            role,
            email: values.email,
            password: values.password,
            fullName: values.fullName,
            ...(values.workEmail ? { workEmail: values.workEmail } : {}),
          };

    try {
      const res = await api<{ message?: string }>("/auth/register", { method: "POST", body });

      if (role === "STAFF") {
        // Staff accounts wait for admin approval and get no cookie
        setStaffMessage(res.message ?? "Your account is waiting for approval.");
        return;
      }

      // Intern is logged in automatically: refresh /auth/me, then go to the dashboard
      await qc.invalidateQueries({ queryKey: ["me"] });
      router.replace("/intern/dashboard");
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === "EMAIL_TAKEN") {
          setError("email", { message: e.message });
        } else {
          setServerError(e.details?.length ? e.details : [e.message]);
        }
      } else {
        setServerError(["Something went wrong. Please try again."]);
      }
    }
  };

  if (staffMessage) {
    return (
      <div className="space-y-5">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink">
          Request sent.
        </h1>
        <Alert variant="success">{staffMessage}</Alert>
        <Link
          href="/login"
          className="text-sm font-semibold text-ink underline underline-offset-4"
        >
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Role tabs */}
      <div role="tablist" className="mb-8 grid grid-cols-2 border-b border-line">
        {TABS.map((tab) => {
          const active = role === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setRole(tab.value)}
              className={`-mb-px border-b-[3px] pb-3 text-center text-sm font-semibold transition ${
                active
                  ? "border-accent text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-ink">
        {role === "INTERN" ? "Begin your journey." : "Join the team."}
      </h1>
      <p className="mt-2 text-base text-muted">
        {role === "INTERN"
          ? "Create your place in the logbook. The next chapter starts here."
          : "Request access. An admin will review your account and set your permissions."}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        {serverError && (
          <Alert>
            {serverError.length === 1 ? (
              serverError[0]
            ) : (
              <ul className="list-disc pl-4">
                {serverError.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            )}
          </Alert>
        )}

        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Your full name"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        {role === "INTERN" ? (
          <Input
            label="Phone"
            hint="(optional)"
            type="tel"
            autoComplete="tel"
            placeholder="+20 100 000 0000"
            error={errors.phone?.message}
            {...register("phone")}
          />
        ) : (
          <Input
            label="Work email"
            hint="(optional, defaults to your email)"
            type="email"
            placeholder="you@company.com"
            error={errors.workEmail?.message}
            {...register("workEmail")}
          />
        )}

        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Enter your password again"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="accent"
            loading={isSubmitting}
            trailingIcon={<ArrowRight className="h-4 w-4" />}
          >
            {role === "INTERN" ? "Create account" : "Request access"}
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-ink underline underline-offset-4">
          Log in
        </Link>
      </p>
    </div>
  );
}