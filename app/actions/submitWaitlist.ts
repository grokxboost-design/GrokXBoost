"use server";

export interface WaitlistResult {
  success: boolean;
  message: string;
}

export async function submitWaitlist(formData: FormData): Promise<WaitlistResult> {
  const email = formData.get("email") as string;

  // Basic email validation
  if (!email || !email.includes("@") || !email.includes(".")) {
    return {
      success: false,
      message: "Please enter a valid email address",
    };
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // If Resend API key is configured, send via Resend
    if (process.env.RESEND_API_KEY) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
          to: process.env.WAITLIST_NOTIFY_EMAIL || "hello@example.com",
          subject: "New GrokXBoost Pro Waitlist Signup",
          text: `New waitlist signup: ${normalizedEmail}\n\nTimestamp: ${new Date().toISOString()}`,
        }),
      });

      if (!response.ok) {
        console.error("Resend API error:", await response.text());
        // Fall through to log anyway
      }
    }

    // Always log to console (for Vercel logs)
    console.log(`[WAITLIST] New signup: ${normalizedEmail} at ${new Date().toISOString()}`);

    return {
      success: true,
      message: "You're on the list! We'll notify you when Pro launches.",
    };
  } catch (error) {
    console.error("Waitlist submission error:", error);

    // Still log the email even if notification fails
    console.log(`[WAITLIST] New signup (notification failed): ${normalizedEmail}`);

    return {
      success: true,
      message: "You're on the list! We'll notify you when Pro launches.",
    };
  }
}
