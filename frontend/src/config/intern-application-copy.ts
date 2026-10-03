import type { ApplicationStatus } from "@/types/applications";

// Wording shown to the intern for each application stage
export const INTERN_APPLICATION_COPY: Record<
  ApplicationStatus,
  { headline: string; body: string; next: string }
> = {
  APPLIED: {
    headline: "Application received.",
    body: "Your application has been submitted. The program team will start reviewing it soon.",
    next: "There is nothing you need to do right now. You will get a notification when your application moves to the next stage.",
  },
  UNDER_REVIEW: {
    headline: "Your application is being reviewed.",
    body: "The program team is looking at your profile and CV.",
    next: "Keep an eye on your notifications. If you are shortlisted, an interview will be arranged.",
  },
  SHORTLISTED: {
    headline: "You've been shortlisted.",
    body: "Your application stood out. The team will arrange an interview with you.",
    next: "Watch your notifications for the interview date and time.",
  },
  INTERVIEW: {
    headline: "It's interview time.",
    body: "Your interview is arranged. Check the details below and prepare to share your story.",
    next: "After the interview, the team will record the outcome and let you know the decision.",
  },
  ACCEPTED: {
    headline: "You're in.",
    body: "Congratulations, your application was accepted and your internship has been created.",
    next: "Your mentor will help you through the next steps of your placement.",
  },
  REJECTED: {
    headline: "Thank you for applying.",
    body: "The team decided not to move forward with this application.",
    next: "You can explore other open opportunities and apply again.",
  },
};