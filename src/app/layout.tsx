import './globals.css';
import AuthSessionProvider from '@/components/providers/AuthSessionProvider';
import { AuthProvider } from '@/context/AuthContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
// import GoogleTranslate from '@/components/common/GoogleTranslate';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
        <AuthSessionProvider>
          <AuthProvider>
            <ThemeProvider>
              <LanguageProvider>
                <SidebarProvider>{children}</SidebarProvider>
                {/* <GoogleTranslate /> */}
              </LanguageProvider>
            </ThemeProvider>
          </AuthProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
