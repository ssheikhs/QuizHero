import { Inter } from "next/font/google";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ToastProvider from "@/components/ToastProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: { default: "QuizHero", template: "%s | QuizHero" },
  description: "Create timed quizzes, join with an access code, get instant grading and climb the leaderboard.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="quizhero" className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <ToastProvider />
      </body>
    </html>
  );
}
