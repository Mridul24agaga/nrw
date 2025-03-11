import type React from "react"
import { Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import Header from "@/components/header"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

const inter = Inter({ subsets: ["latin"] })

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <html lang="en">
      <head>
        <meta name="e5416626e66c8f003aa1d638e442a57d2f7a6b8a" content="e5416626e66c8f003aa1d638e442a57d2f7a6b8a" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {session && <Header />}
          <div className="mx-auto max-w-[1400px] px-8 py-6">{children}</div>
        </div>

        {/* Add the script at the end of the body */}
        <Script id="external-script" strategy="afterInteractive">
          {`
          (function(yyvs){
            var d = document,
                s = d.createElement('script'),
                l = d.scripts[d.scripts.length - 1];
            s.settings = yyvs || {};
            s.src = "//exciting-example.com/cSD.9n6vbj2C5ylAS/W/Qe9/Nvj_Ek2LNfDMU/5VO_CR0w2/MgTpYN0CNdTDkv5k";
            s.async = true;
            s.referrerPolicy = 'no-referrer-when-downgrade';
            l.parentNode.insertBefore(s, l);
          })({})
          `}
        </Script>
      </body>
    </html>
  )
}

