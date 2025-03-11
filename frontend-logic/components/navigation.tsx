// components/navigation.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function Navigation() {
  const pathname = usePathname()
  
  return (
    <nav className="bg-background border-b">
      <div className="max-w-screen-xl flex items-center justify-between mx-auto p-4">
        <Link href="/" className="text-xl font-bold">Organ Marketplace</Link>
        <div className="flex space-x-4">
          <Link 
            href="/" 
            className={`px-3 py-2 rounded-md ${pathname === '/' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
          >
            Listings
          </Link>
          <Link 
            href="/create-listing" 
            className={`px-3 py-2 rounded-md ${pathname === '/create-listing' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
          >
            Create Listing
          </Link>
          <Link 
            href="/manage-organs" 
            className={`px-3 py-2 rounded-md ${pathname === '/manage-organs' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
          >
            Manage Organs
          </Link>
        </div>
      </div>
    </nav>
  )
}