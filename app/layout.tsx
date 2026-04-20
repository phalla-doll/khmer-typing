import type {Metadata} from 'next';
import { Outfit, JetBrains_Mono, Noto_Sans_Khmer } from 'next/font/google';
import './globals.css'; // Global styles

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

const notoSansKhmer = Noto_Sans_Khmer({
  subsets: ['khmer'],
  variable: '--font-khmer',
});

export const metadata: Metadata = {
  title: 'Khmer Typing',
  description: 'A premium typing playground.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable} ${notoSansKhmer.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased text-[#434343] bg-[#F5F2ED]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
