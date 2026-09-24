import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Colorado SAR Archive — Search & Rescue Incidents',icons:{icon:'/favicon.svg'},description:'Explore Colorado search and rescue incidents by location, title, year, and incident type. An independent archive with original sources.'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body><a className="skip-link" href="#main-content">Skip to content</a>{children}</body></html>}
