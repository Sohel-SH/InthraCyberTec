import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Alert from "@/components/ui/alert/Alert";
import { Metadata } from "next";
import React from "react";
import T from "@/components/i18n/T";

export const metadata: Metadata = {
  title: "Next.js Alerts | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Alerts page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
  // other metadata
};

export default function Alerts() {
  return (
    <div>
      <PageBreadcrumb pageTitle={<T k="nav.alerts" />} />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title={<T k="alerts.title.successAlert" />}> 
          <Alert
            variant="success"
            title={<T k="alerts.successMessageTitle" />}
            message={<T k="alerts.cautionMessage" />}
            showLink={true}
            linkHref="/"
            linkText={<T k="actions.learnMore" />}
          />
          <Alert
            variant="success"
            title={<T k="alerts.successMessageTitle" />}
            message={<T k="alerts.cautionMessage" />}
            showLink={false}
          />
        </ComponentCard>
        <ComponentCard title={<T k="alerts.title.warningAlert" />}> 
          <Alert
            variant="warning"
            title={<T k="alerts.warningMessageTitle" />}
            message={<T k="alerts.cautionMessage" />}
            showLink={true}
            linkHref="/"
            linkText={<T k="actions.learnMore" />}
          />
          <Alert
            variant="warning"
            title={<T k="alerts.warningMessageTitle" />}
            message={<T k="alerts.cautionMessage" />}
            showLink={false}
          />
        </ComponentCard>{" "}
        <ComponentCard title={<T k="alerts.title.errorAlert" />}> 
          <Alert
            variant="error"
            title={<T k="alerts.errorMessageTitle" />}
            message={<T k="alerts.cautionMessage" />}
            showLink={true}
            linkHref="/"
            linkText={<T k="actions.learnMore" />}
          />
          <Alert
            variant="error"
            title={<T k="alerts.errorMessageTitle" />}
            message={<T k="alerts.cautionMessage" />}
            showLink={false}
          />
        </ComponentCard>{" "}
        <ComponentCard title={<T k="alerts.title.infoAlert" />}> 
          <Alert
            variant="info"
            title={<T k="alerts.infoMessageTitle" />}
            message={<T k="alerts.cautionMessage" />}
            showLink={true}
            linkHref="/"
            linkText={<T k="actions.learnMore" />}
          />
          <Alert
            variant="info"
            title={<T k="alerts.infoMessageTitle" />}
            message={<T k="alerts.cautionMessage" />}
            showLink={false}
          />
        </ComponentCard>
      </div>
    </div>
  );
}
