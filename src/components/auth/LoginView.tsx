"use client";
import React, { useState } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import { EyeCloseIcon, EyeIcon } from "@/icons";

interface LoginViewProps {
  onRegisterClick: () => void;
  onLoginSuccess: () => void;
}

export default function LoginView({ onRegisterClick, onLoginSuccess }: LoginViewProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess();
  };

  return (
    <div className="p-8 sm:p-12">
      <div className="mb-8 text-center sm:text-left">
        <h2 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          Welcome to GPT!
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Please sign-in to your account and start the adventure
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Email Or Username
          </Label>
          <Input
            type="text"
            placeholder="Enter your email or username"
            className="w-full"
          />
        </div>

        <div>
          <Label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Password
          </Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="w-full"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeIcon size={20} /> : <EyeCloseIcon size={20} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox checked={isChecked} onChange={setIsChecked} />
            <span className="text-sm text-gray-600 dark:text-gray-400">Remember Me</span>
          </div>
          <button
            type="button"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Forgot Password?
          </button>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{
            background: "linear-gradient(90deg, #29DFD3 0%, #4B3ADB 100%)",
          }}
        >
          Login
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        New on our platform?{" "}
        <button
          onClick={onRegisterClick}
          className="font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          Register Now
        </button>
      </div>
    </div>
  );
}
