"use client"

import Link from "next/link"
import { ArrowLeft, Home } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-10 bg-white shadow-sm border-b">
        <div className="flex items-center p-4 max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <div className="h-4 w-px bg-gray-300" />
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <Home className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-4 py-8 sm:py-12 max-w-4xl mx-auto">
        <article className="prose prose-gray max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>

          <div className="space-y-6 text-gray-600">
            <section>
              <p className="mb-6">
                Welcome to MemoriesLived.com (the "Website"), a service provided by CJM Ashton, LLC (the "Company,"
                "we," "us," or "our"). By creating an account and accessing or using our Website, you agree to be bound
                by the following Terms of Service ("Terms") and Privacy Policy. Please read them carefully before using
                the Website.
              </p>
              <p>
                Your use of the Website is subject to the Terms below and our Privacy Policy, which govern your access
                to and use of the Website, and you agree to be bound by them. If you do not agree to these Terms, do not
                access or use the Website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Use of the Website</h2>
              <p>
                You agree to use the Website in accordance with applicable laws and regulations. You will not use the
                Website for any unlawful or prohibited purpose. This includes, but is not limited to, the following:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Posting false, misleading, or deceptive content.</li>
                <li>Harassing, threatening, or abusing other users.</li>
                <li>
                  Engaging in activities that disrupt or harm the operation of the Website (e.g., hacking, spamming,
                  phishing, or denial of service attacks).
                </li>
                <li>Impersonating any individual or entity.</li>
              </ul>
              <p className="mt-4">
                By creating an account, you represent that you are at least 18 years of age (or the legal age of consent
                in your jurisdiction) and have the legal authority to agree to these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. User Content</h2>
              <p>
                You retain ownership of any content you post on the Website, including photos, videos, text, and other
                materials ("User Content"). However, by posting User Content, you grant us a worldwide, non-exclusive,
                royalty-free, sublicensable, and transferable license to use, distribute, reproduce, modify, adapt,
                publish, translate, publicly display, and create derivative works of such User Content.
              </p>
              <p className="mt-4">
                You are responsible for the content you post and agree not to post any content that is unlawful,
                defamatory, violates the rights of others, or violates these Terms or our Privacy Policy. We reserve the
                right to remove any User Content that violates these Terms or our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                3. Data Privacy and CCPA/GDPR Compliance
              </h2>
              <p>
                We take your privacy seriously. Our collection, use, and disclosure of personal information are governed
                by our Privacy Policy.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">California Consumer Privacy Act (CCPA)</h3>
              <p>
                For California residents, we comply with the California Consumer Privacy Act (CCPA). As a user, you have
                the following rights under the CCPA:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>The right to know what personal information is being collected about you.</li>
                <li>The right to request the deletion of your personal information.</li>
                <li>
                  The right to opt out of the sale of your personal information (note: we do not sell your personal
                  information).
                </li>
                <li>The right to not be discriminated against for exercising your CCPA rights.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                General Data Protection Regulation (GDPR) Compliance
              </h3>
              <p>
                For users residing in the European Union, we comply with the General Data Protection Regulation (GDPR).
                You have the following rights:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>The right to access, correct, or delete your personal data.</li>
                <li>The right to restrict or object to the processing of your personal data.</li>
                <li>The right to data portability.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, the Company and its officers, directors, employees, and agents
                shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages,
                including but not limited to loss of profits, data, use, goodwill, or other intangible losses, resulting
                from:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Your access to or use of or inability to access or use the Website</li>
                <li>Any unauthorized access to or use of the Website or our servers</li>
                <li>Any interruption or cessation of transmission to or from our Website</li>
                <li>
                  Any bugs, viruses, Trojan horses, or the like that may be transmitted to or through our Website by any
                  third party
                </li>
                <li>Any errors or omissions in any content posted or made available through the Website</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless the Company, its officers, directors, employees,
                agents, and affiliates from and against any and all claims, liabilities, damages, losses, or expenses,
                including reasonable attorneys' fees and costs, arising out of or in any way connected with your access
                to or use of the Website, your violation of these Terms, or your violation of any third-party rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Arbitration Agreement</h2>
              <p>
                Any dispute, controversy, or claim arising out of or relating to these Terms, or the breach,
                termination, enforcement, interpretation, or validity thereof, including the determination of the scope
                or applicability of this agreement to arbitrate, shall be determined by arbitration in Austin, TX. The
                arbitration shall be administered by the American Arbitration Association (AAA) in accordance with its
                Commercial Arbitration Rules and Mediation Procedures.
              </p>
              <p className="mt-4">
                <strong>Class Action Waiver:</strong> You agree that any arbitration shall be conducted in your
                individual capacity only and not as a class action or other representative action. You expressly waive
                your right to file a class action or seek relief on a class basis.
              </p>
              <p className="mt-4">
                <strong>Opt-Out:</strong> You have the right to opt out of this Arbitration Agreement by sending written
                notice of your decision to opt out to support@memorieslived.com within 30 days of first accepting these
                Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Intellectual Property</h2>
              <p>
                The Website and all of its original content, features, and functionality are and will remain the
                exclusive property of the Company and its licensors. You may not use, reproduce, or distribute any
                content from the Website without our express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Third-Party Links</h2>
              <p>
                Our Website may contain links to third-party websites or services. These links are provided for your
                convenience, but we do not control, endorse, or assume responsibility for the content, policies, or
                practices of any third-party sites. Your interactions with such third-party sites are solely between you
                and those third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your access to the Website at our sole discretion, without
                notice or liability, for any reason, including if you breach these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Data Breach Protocol</h2>
              <p>
                In the event of a data breach, we will notify affected users in accordance with applicable laws and
                regulations. We are committed to taking reasonable steps to protect your personal information but cannot
                guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Changes to the Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any time. We will provide notice of any
                significant changes by posting the new Terms on the Website or by other means as appropriate. Your
                continued use of the Website following any changes constitutes your acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the state of Texas,
                without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                13. Children's Privacy (COPPA Compliance)
              </h2>
              <p>
                Our Website is not directed to children under 18, and we do not knowingly collect personal information
                from children under 18 in compliance with the Children's Online Privacy Protection Act (COPPA). If we
                learn that we have inadvertently collected personal information from a child under 18, we will delete
                that information as quickly as possible.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">14. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at{" "}
                <a href="mailto:support@memorieslived.com" className="text-blue-600 hover:text-blue-800">
                  support@memorieslived.com
                </a>
              </p>
            </section>
          </div>
        </article>
      </main>
    </div>
  )
}

