import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell topLink={{ text: "Already have an account?", label: "Log in", href: "/login" }}>
      <RegisterForm />
    </AuthShell>
  );
}