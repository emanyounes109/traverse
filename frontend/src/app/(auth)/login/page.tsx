import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell topLink={{ text: "New here?", label: "Create account", href: "/register" }}>
      <LoginForm />
    </AuthShell>
  );
}