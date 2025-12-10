import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import logo from "../assets/logo.png";

const TermsOfService: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className=" shadow-lg border border-gray-100">
          <div className="bg-red-600 p-8 rounded-t-xl ">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-100 hover:text-[#dcd7d7]"
                aria-label="Go back"
              >
                <ChevronLeft size={20} />
                <span className="text-sm font-medium">Back</span>
              </button>
            </div>

            <h1 className="text-3xl font-bold text-[#ffffff] mb-4">
              Terms of Service
            </h1>
          </div>

          <div className="p-8 bg-white  rounded-b-xl">
            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-3 text-gray-800">
                1. Acceptance of Terms
              </h2>
              <p className="mb-3 text-gray-600">
                By using KonCMS (the "Service"), you agree to these Terms of
                Service. If you do not agree, do not use the Service.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-3 text-gray-800">
                2. Service Description
              </h2>
              <p className="mb-3 text-gray-600">
                KonCMS provides analytics, management, and reporting tools for
                YouTube channels. The Service integrates with Google/YouTube
                APIs when you connect your account to fetch channel and video
                metadata and analytics data you authorize.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-3 text-gray-800">
                3. Account Access & Third-Party Services
              </h2>
              <p className="mb-3 text-gray-600">
                To use certain features you must connect a Google/YouTube
                account via OAuth. By connecting, you grant us access to the
                data and permissions requested during the OAuth flow. We act as
                a client of those third-party services and are bound by their
                terms and API policies.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-3 text-gray-800">
                4. OAuth Tokens and Data Use
              </h2>
              <p className="mb-3 text-gray-600">
                We store OAuth access and refresh tokens needed to access your
                YouTube data. Tokens are stored securely and used only to
                retrieve or refresh data you've authorized. You can revoke our
                access at any time from your Google account permissions page or
                by disconnecting your account in the app.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-3 text-gray-800">
                5. Acceptable Use
              </h2>
              <p className="mb-3 text-gray-600">
                You agree not to use the Service for any unlawful purpose or in
                a manner that violates the rights of others. Prohibited actions
                include attempting to bypass API limits, reverse-engineer the
                Service, or access another user's account without permission.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-3 text-gray-800">
                6. Termination
              </h2>
              <p className="mb-3 text-gray-600">
                We may suspend or terminate your access for violations of these
                Terms or for misuse of the Service. You may delete your account
                at any time; upon deletion we will remove your personal data and
                revoke stored tokens, subject to any legal retention
                obligations.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-3 text-gray-800">
                7. Disclaimers and Limitation of Liability
              </h2>
              <p className="mb-3 text-gray-600">
                The Service is provided "as is" and on an "as available" basis.
                We do not guarantee uninterrupted access or the accuracy of
                third-party data. To the maximum extent permitted by law, KonCMS
                and its affiliates will not be liable for any indirect,
                incidental, special, consequential, or punitive damages arising
                out of your use of the Service.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-3 text-gray-800">
                8. Changes to Terms
              </h2>
              <p className="mb-3 text-gray-600">
                We may modify these Terms from time to time. We will notify you
                of material changes through the app or by updating the "Last
                updated" date below. Continued use after changes constitutes
                acceptance of the revised Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-gray-800">
                9. Contact
              </h2>
              <p className="text-gray-600">
                For questions about these Terms or to report misuse, contact us
                at{" "}
                <a
                  className="text-blue-600 hover:underline"
                  href="mailto:info@koncms.com"
                >
                  info@koncms.com
                </a>
                .
              </p>
            </section>

            <p className="text-sm text-gray-600 mt-4">
              Last updated: December 10, 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
