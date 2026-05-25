import './globals.css'

export const metadata = {
  title: 'DigiTrac | Revenue-Aware Performance Intelligence',
  description: 'Premium time allocation, revenue intelligence, and high-performance project management platform.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div id="app-root">
          {children}
        </div>
      </body>
    </html>
  )
}
