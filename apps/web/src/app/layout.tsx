import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poster Press | Bangladesh Poster Studio",
  description: "Create Bangla political, national occasion, and tribute posters with precise text and print-ready exports.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="bn"><body>{children}</body></html>;
}
