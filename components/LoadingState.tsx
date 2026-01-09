"use client";

import { useState, useEffect } from "react";

interface LoadingStateProps {
  handle: string;
}

const LOADING_STEPS = [
  { label: "Connecting to Grok AI", duration: 2000 },
  { label: "Analyzing X profile", duration: 3000 },
  { label: "Evaluating engagement patterns", duration: 4000 },
  { label: "Generating insights", duration: 5000 },
  { label: "Preparing your report", duration: 6000 },
];

const TIPS = [
  "Post consistently at peak engagement times for your audience",
  "Threads get 3x more engagement than single tweets",
  "Visual content increases engagement by 150%",
  "Engage with your community within the first hour of posting",
  "Use relevant hashtags sparingly - 1-2 per post is optimal",
];

export default function LoadingState({ handle }: LoadingStateProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 3;
      });
    }, 500);

    // Step progression
    const stepTimers = LOADING_STEPS.map((step, index) => {
      return setTimeout(() => {
        setCurrentStep(index);
      }, step.duration);
    });

    // Rotate tips
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 4000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(tipInterval);
      stepTimers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-6 loading-glow">
          <svg className="w-10 h-10 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Analyzing @{handle}
        </h1>
        <p className="text-gray-400">
          Grok is analyzing the account for growth opportunities
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-10">
        {LOADING_STEPS.map((step, index) => (
          <div
            key={step.label}
            className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
              index === currentStep
                ? "bg-blue-500/10 border border-blue-500/30"
                : index < currentStep
                ? "bg-green-500/10 border border-green-500/30"
                : "bg-gray-900/50 border border-gray-800"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                index === currentStep
                  ? "bg-blue-500 loading-glow"
                  : index < currentStep
                  ? "bg-green-500"
                  : "bg-gray-700"
              }`}
            >
              {index < currentStep ? (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : index === currentStep ? (
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              ) : (
                <span className="text-gray-400 text-sm">{index + 1}</span>
              )}
            </div>
            <span
              className={`transition-colors duration-300 ${
                index === currentStep
                  ? "text-white font-medium"
                  : index < currentStep
                  ? "text-green-400"
                  : "text-gray-500"
              }`}
            >
              {step.label}
              {index === currentStep && (
                <span className="ml-2 inline-flex">
                  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Tips Section */}
      <div className="report-card">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-1">
              Quick Tip
            </p>
            <p className="text-gray-300 text-sm leading-relaxed animate-fade-in" key={tipIndex}>
              {TIPS[tipIndex]}
            </p>
          </div>
        </div>
      </div>

      {/* Estimated Time */}
      <p className="text-center text-sm text-gray-500 mt-8">
        This usually takes 15-30 seconds
      </p>
    </div>
  );
}
