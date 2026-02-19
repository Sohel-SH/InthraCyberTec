import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
// import GoogleTranslate from '@/components/common/GoogleTranslate';
import localFont from 'next/font/local';

const vendSans = localFont({
  src: [
    { path: './fonts/VendSans-Light.ttf', weight: '300', style: 'normal' },
    { path: './fonts/VendSans-LightItalic.ttf', weight: '300', style: 'italic' },
    { path: './fonts/VendSans-Regular.ttf', weight: '400', style: 'normal' },
    { path: './fonts/VendSans-Italic.ttf', weight: '400', style: 'italic' },
    { path: './fonts/VendSans-Medium.ttf', weight: '500', style: 'normal' },
    { path: './fonts/VendSans-MediumItalic.ttf', weight: '500', style: 'italic' },
    { path: './fonts/VendSans-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: './fonts/VendSans-SemiBoldItalic.ttf', weight: '600', style: 'italic' },
    { path: './fonts/VendSans-Bold.ttf', weight: '700', style: 'normal' },
    { path: './fonts/VendSans-BoldItalic.ttf', weight: '700', style: 'italic' },
  ],
  variable: '--font-vend-sans',
  preload: true,
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={vendSans.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
  try {
    var theme = localStorage.getItem('theme');
    if (
      theme === 'dark' ||
      ((!theme || theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();`,
          }}
        />
      </head>
      <body className={`font-sans dark:bg-gray-900`}>
        <ThemeProvider>
          <LanguageProvider>
            <SidebarProvider>{children}</SidebarProvider>
            {/* <GoogleTranslate /> */}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
