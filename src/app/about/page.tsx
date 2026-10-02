import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-24 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-5xl font-bold text-[#111111] mb-6 text-center">About TapConnect</h1>
        <p className="text-xl text-gray-600 mb-16 max-w-2xl mx-auto text-center">
          A digital identity and commerce platform powered by NFC + QR &mdash; not a company that just sells cards.
        </p>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold mb-3">What we believe</h2>
            <p className="text-gray-600 leading-relaxed">
              The physical card is the entry point. The digital profile is the product. Analytics, leads,
              commerce and business tools are what create recurring value &mdash; not the plastic in someone&apos;s
              pocket. Our goal is for every TapConnect customer to think: &ldquo;My TapConnect profile is my
              digital business card, my mini website, my contact page and, if I need it, my mini online store.&rdquo;
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">How it works</h2>
            <p className="text-gray-600 leading-relaxed">
              Tap your card or scan its QR code, and anyone lands directly on your TapConnect profile &mdash; no
              app required. From there, visitors can save your contact, call, message you on WhatsApp, browse
              your products or services, view your portfolio, or leave you a message. Every interaction is
              recorded as privacy-safe, aggregate analytics so you always know how people are reaching you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">Who it&apos;s for</h2>
            <p className="text-gray-600 leading-relaxed">
              Individuals &mdash; freelancers, creators, salespeople, small business owners &mdash; get a free
              profile, NFC and QR code that never expires. Businesses can equip an entire team with cards tied
              to individual employee profiles, all carrying consistent company branding, with team-level
              analytics and card management from one dashboard.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">Get in touch</h2>
            <p className="text-gray-600 leading-relaxed">
              Questions about an order, a business plan, or a partnership? Reach us at{' '}
              <a href="mailto:hello@tapconnect.ng" className="text-black font-semibold underline">hello@tapconnect.ng</a>.
            </p>
          </section>
        </div>

        <div className="text-center mt-16">
          <Link href="/" className="font-semibold text-[#000000] hover:underline">
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
