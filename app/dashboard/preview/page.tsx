import { redirect } from "next/navigation";

/** Live Preview now lives on the Themes & Preview page. */
export default function DashboardPreviewPage() {
  redirect("/dashboard/themes");
}
