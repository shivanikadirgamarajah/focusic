import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/app/components/Header";
import { MusicProvider } from "@/app/context/MusicContext";
import { TimerProvider } from "@/app/context/TimerContext";
import PersistentMusicBar from "@/app/components/PersistentMusicBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="flex flex-col min-h-screen pb-32">
        <MusicProvider>
          <TimerProvider>
            <Header />
            {children}
            <PersistentMusicBar />
          </TimerProvider>
        </MusicProvider>
      </body>
    </html>
  );
}