import type { Metadata } from "next";
import { Onest } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import Navbar from "@/components/Navbar";

/*
 * Onest — キリル文字を前提に設計された UI サンセリフ。и/н/ш/ц が並んでも
 * 字間が詰まらず、12〜14px 主体のこの画面で潰れない。ウェイトは 100〜900 可変。
 * cyrillic-ext を必ず含めること：モンゴル語の Ө(U+04E8) と Ү(U+04AE) は
 * 基本の cyrillic サブセット（U+0400-045F）ではなく cyrillic-ext 側にある。
 * これを外すとその2文字だけ別フォントにフォールバックして字形が混ざる。
 */
const onest = Onest({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  variable: "--font-mn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Үйлчилгээний газрын цаг захиалах систем",
  description: "Үйлчилгээний газрын цаг захиалах систем. Хялбар, хурдан захиалга.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn" className={onest.variable}>
      <body className="min-h-screen">
        <SessionProvider>
          <Navbar />
          <main>{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
