"use client";

import { useState } from "react";
import { submitWaitlist } from "@/app/actions/submitWaitlist";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData();
    formData.append("email", email);

    const result = await submitWaitlist(formData);

    if (result.success) {
      setStatus("success");
      setMessage(result.message);
      setEmail("");
    } else {
      setStatus("error");
      setMessage(result.message);
    }
  };

  if (status === "success") {
    return (
      <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
        <p className="text-green-400">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        className="flex-1 bg-gray-900/50 border border-gray-700 rounded-xl py-3 px-4
                 text-white placeholder-gray-500
                 focus:outline-none focus:border-purple-500 transition-colors"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold
                 py-3 px-6 rounded-xl hover:from-purple-500 hover:to-pink-500
                 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                 whitespace-nowrap"
      >
        {status === "loading" ? "Joining..." : "Join Waitlist"}
      </button>
      {status === "error" && (
        <p className="text-red-400 text-sm mt-2 sm:mt-0 sm:self-center">{message}</p>
      )}
    </form>
  );
}
