"use client";
import React from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

interface OTPViewProps {
  email: string;
  onVerify: () => void;
  onResend: () => void;
}

export default function OTPView({ email, onVerify, onResend }: OTPViewProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVerify();
  };

  return (
    <div className="p-8 sm:p-12">
      <div className="mb-8 text-center sm:text-left">
        <h2 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          Verification
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Please enter the verification code we just sent to <br />
          <span className="font-medium text-gray-700 dark:text-white">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-400">
            OTP
          </Label>
          <Input
            type="text"
            placeholder="Enter otp"
            className="w-full"
            {...({ maxLength: 6 } as any)}
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{
            background: "linear-gradient(90deg, #29DFD3 0%, #4B3ADB 100%)",
          }}
        >
          Verify
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <button
          onClick={onResend}
          className="font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          Resend OTP
        </button>
      </div>
    </div>
  );
}
