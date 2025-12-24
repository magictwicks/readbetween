import "./globals.css";
import { Special_Elite } from "next/font/google";

const specialElite = Special_Elite({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-typewriter"
});

export const metadata = {
  title: "Read Between",
  description: "A book guessing game built from Project Gutenberg texts."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={specialElite.variable}>{children}</body>
    </html>
  );
}
