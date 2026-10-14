import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { AppNavbar } from "@/components/app-navbar";
import { Toaster } from "@/components/ui/sonner";
import { getStudentPickerOptions } from "@/lib/queries";
import { getRoleState } from "@/lib/role";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const plexHeading = IBM_Plex_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SMS Registry Module",
  description:
    "Student Management System — Registry Administration for PEN Global",
};

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const [{ role, viewingStudentId }, students] = await Promise.all([
    getRoleState(),
    getStudentPickerOptions(),
  ]);

  const activeStudentId =
    viewingStudentId && students.some((s) => s.id === viewingStudentId)
      ? viewingStudentId
      : (students[0]?.id ?? null);

  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexHeading.variable} ${plexMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col font-sans antialiased">
        <AppNavbar
          role={role}
          viewingStudentId={activeStudentId}
          students={students}
        />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6 md:py-10">
          <div className="flex flex-col gap-6 md:gap-8">{children}</div>
        </main>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
