import { Listings } from "@/components/listings"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-24">
      <h1 className="text-4xl font-bold mb-8">Organ Marketplace</h1>
      <Listings />
    </main>
  )
}

