import type { Metadata } from "next";
import "./globals.css";
import SpeechRecognitionProvider from "@/components/SpeechRecognitionProvider";

export const metadata: Metadata = {
  title: "Jarvis Real Estate Agent",
  description: "AI-powered real estate assistant with voice mode",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SpeechRecognitionProvider>
          {children}
        </SpeechRecognitionProvider>
      </body>
    </html>
  );
}
