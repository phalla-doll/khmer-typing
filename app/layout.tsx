import type {Metadata} from 'next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css'; // Global styles

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Khmer Typing',
  description: 'A premium typing playground.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased text-[#434343] bg-[#F5F2ED]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
