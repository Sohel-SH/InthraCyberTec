import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: {
    default: 'Inthra - Advanced Insider Threat Detection and Monitoring',
    template: '%s | Inthra'
  },
  description: 'Inthra offers an advanced platform for comprehensive insider threat detection and monitoring. Leveraging cutting-edge Graph Analytics and custom rules, Inthra provides real-time security insights to protect your organization from internal risks and data breaches. Stay ahead of threats with intelligent anomaly detection and proactive risk management.',
  keywords: ['insider threat detection', 'security', 'AI', 'Graph Analytics', 'threat monitoring', 'cybersecurity', 'insider risk management', 'advanced threat detection', 'threat intelligence', 'risk assessment', 'data protection', 'fraud detection', 'anomaly detection', 'security analytics', 'threat prevention', 'compliance monitoring'],
  authors: [{ name: 'Inthra Team' }],
  creator: 'Inthra',
  publisher: 'Inthra',
};

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
