import { pageMetadata } from '@/lib/metadata';
import { SITE_URL } from '@/lib/site';
import type { Metadata } from 'next';
import './globals.css';
import { Analytics } from '@/components/analytics';
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: { icon: '/favicon.svg' },
  ...pageMetadata(
    'Colorado SAR Archive — Search & Rescue Incidents',
    'Explore Colorado search and rescue incidents by location, title, year, and incident type. An independent archive with original sources.',
    '/',
  ),
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
