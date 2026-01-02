import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import NextAuthSessionProvider from "@/context/NextAuthSessionProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Codemate Build",
  description: "Made with Codemate Build",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" className="h-full">
      <body className={inter.className}>
        <NextAuthSessionProvider>
          <AuthProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </AuthProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
