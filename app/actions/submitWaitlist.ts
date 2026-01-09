"use server";

import { Resend } from "resend";

export interface WaitlistResult {
  success: boolean;
  message: string;
}

export async function submitWaitlist(formData: FormData): Promise<WaitlistResult> {
  const email = formData.get("email") as string;

  // Email validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      success: false,
      message: "Please enter a valid email address",
    };
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // If Resend API key is configured, send notification
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to: process.env.WAITLIST_NOTIFY_EMAIL || "hello@example.com",
        subject: "New GrokXBoost Pro Waitlist Signup!",
        text: `New signup: ${normalizedEmail}\n\nTime: ${new Date().toISOString()}`,
      });
    }

    // Always log to console (for Vercel logs as backup)
    console.log(`[WAITLIST] New signup: ${normalizedEmail} at ${new Date().toISOString()}`);

    return {
      success: true,
      message: "You're on the list! We'll notify you when Pro launches.",
    };
  } catch (error) {
    console.error("Resend error:", error);

    // Still log the email even if notification fails
    console.log(`[WAITLIST] New signup (Resend failed): ${normalizedEmail}`);

    // Don't block user if notification fails
    return {
      success: true,
      message: "You're on the list! We'll notify you when Pro launches.",
    };
  }
}
