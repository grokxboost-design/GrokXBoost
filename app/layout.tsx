import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GrokXBoost - X/Twitter Growth Analytics",
  description:
    "Get instant AI-powered growth insights for your X/Twitter account using Grok's real-time analysis.",
  keywords: ["Twitter", "X", "growth", "analytics", "Grok", "AI", "social media"],
  openGraph: {
    title: "GrokXBoost - X/Twitter Growth Analytics",
    description:
      "Get instant AI-powered growth insights for your X/Twitter account",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GrokXBoost - X/Twitter Growth Analytics",
    description:
      "Get instant AI-powered growth insights for your X/Twitter account",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black antialiased">
        <main className="min-h-screen">{children}</main>
        <footer className="border-t border-gray-800 py-6 text-center text-sm text-gray-500">
          <p>
            Powered by{" "}
            <a
              href="https://x.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Grok
            </a>{" "}
            | Built with Next.js
          </p>
        </footer>
      </body>
    </html>
  );
}
