import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Semantic Kernel Chat",
  description: "Semantic Kernel Chat Demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
