import Link from 'next/link'

export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-32 px-4 text-center">
      <h1 className="text-5xl font-bold text-[#111111] mb-6">Discover</h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        See how the world&apos;s biggest creators are using Linktree.
      </p>
      <Link href="/" className="font-semibold text-[#000000] hover:underline">
        &larr; Back to home
      </Link>
    </div>
  )
}
