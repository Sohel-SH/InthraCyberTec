"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import LoginView from "./LoginView";
import RegisterView from "./RegisterView";
import OTPView from "./OTPView";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  initialView?: "login" | "register" | "otp";
}

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  initialView = "login",
}: AuthModalProps) {
  const [view, setView] = useState<"login" | "register" | "otp">(initialView);
  const [email, setEmail] = useState("K..............@gmail.com");

  const handleLoginSuccess = () => {
    // In a real app, you'd check if OTP is required
    onLoginSuccess();
    onClose();
  };

  const handleRegisterSuccess = () => {
    setView("otp");
  };

  const handleVerifySuccess = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[500px]"
      showCloseButton={false}
    >
      <div className="relative overflow-hidden">
        {/* Decorative border/glow effect from screenshot */}
        <div className="absolute inset-0 pointer-events-none rounded-3xl border-2 border-blue-400/30 shadow-[0_0_20px_rgba(59,130,246,0.3)]"></div>
        
        {view === "login" && (
          <LoginView
            onRegisterClick={() => setView("register")}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
        {view === "register" && (
          <RegisterView
            onLoginClick={() => setView("login")}
            onRegisterSuccess={handleRegisterSuccess}
          />
        )}
        {view === "otp" && (
          <OTPView
            email={email}
            onVerify={handleVerifySuccess}
            onResend={() => console.log("Resending OTP...")}
          />
        )}
      </div>
    </Modal>
  );
}
