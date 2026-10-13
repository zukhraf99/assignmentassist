import "./globals.css";
import { SITE } from "@/lib/config";

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Assignment Assist | Assignment Help, Tutoring & Draft Feedback for Students",
    template: "%s | Assignment Assist",
  },
  description:
    "Fast, friendly assignment help for students: understand your brief, plan your work, get feedback on your draft and learn how to finish on time. Message us on WhatsApp or email.",
  keywords: [
    "assignment help", "assignment tutoring", "assignment feedback", "study help",
    "essay feedback", "draft review", "referencing help", "last minute assignment help",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Assignment Assist | Help with your assignments",
    description: "Understand your brief, plan your work and finish with confidence.",
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#1c3fb7" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✏️</text></svg>" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Figtree:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
