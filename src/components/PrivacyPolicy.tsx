import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const PrivacyPolicy: React.FC = () => {
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
              Privacy Policy
            </h1>
          </div>

          <div className="p-8 bg-white  rounded-b-xl">
            <p className="text-sm text-gray-500 mb-6">
              Last updated: December 10, 2025
            </p>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-3 text-gray-800">
                1. Information We Collect
              </h2>
              <p className="mb-3 text-gray-600">
                We collect information that you provide directly and information
                collected automatically when you use the service. This includes:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                <li>
                  Account details: name, email address, and profile information.
                </li>
                <li>
                  YouTube account & channel data: when you connect your
                  Google/YouTube account we may access channel identifiers,
                  channel name, video metadata (titles, IDs, thumbnails),
                  playlists, and analytics data you grant us permission to read
                  via Google's APIs.
                </li>
                <li>
                  Authentication data: OAuth tokens (access and refresh tokens)
                  used to access YouTube APIs. Tokens are stored securely on our
                  server and used only to fetch data you authorize.
                </li>
                <li>
                  Usage data: logs, IP addresses, device and browser
                  information, and interaction data used for diagnostics and
                  product improvement.
                </li>
                <li>
                  Communications: messages you send to support or other users
                  via the platform.
                </li>
                <li>
                  Cookies and tracking: cookies and similar technologies to
                  enable sessions, preferences, and analytics.
                </li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-3 text-gray-800">
                2. How We Use Your Information
              </h2>
              <p className="mb-3 text-gray-600">
                We use the information we collect to operate, provide, and
                improve the platform and features you use, including:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                <li>
                  Provide and personalize dashboard views and analytics for your
                  YouTube channel.
                </li>
                <li>
                  Fetch channel and video metrics from YouTube APIs so you can
                  analyze performance in the app.
                </li>
                <li>
                  Authenticate your account and maintain your connection to
                  YouTube.
                </li>
                <li>
                  Send important service messages and respond to support
                  requests.
                </li>
                <li>
                  Monitor and improve site performance, detect and prevent
                  abuse, and debug errors.
                </li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-3 text-gray-800">
                3. Information Sharing and Disclosure
              </h2>
              <p className="mb-3 text-gray-600">
                We do not sell your personal information. We may share
                information in limited circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                <li>
                  With service providers who perform services on our behalf
                  (hosting, email, analytics). They are contractually required
                  to protect your data.
                </li>
                <li>
                  With Google/YouTube as required to access your channel and
                  analytics when you connect via OAuth.
                </li>
                <li>
                  To comply with legal obligations or respond to lawful requests
                  by public authorities.
                </li>
                <li>
                  To protect and defend our rights, property, or safety, or that
                  of our users.
                </li>
                <li>
                  In connection with a merger, acquisition, or sale of assets
                  (users will be notified when required by law).
                </li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-3 text-gray-800">
                4. Data Storage and Security
              </h2>
              <p className="mb-3 text-gray-600">
                We store and process data on secure servers. We use
                industry-standard measures (TLS in transit, encryption at rest
                where appropriate) to protect your data. OAuth tokens and other
                sensitive credentials are stored securely and only used to
                access the third-party APIs you have authorized.
              </p>
              <p className="mb-3 text-gray-600">
                When you disconnect a YouTube account or delete your account, we
                remove the associated tokens and channel-level data we store. We
                may retain aggregated or anonymized data for analytics and
                product improvement.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-3 text-gray-800">
                5. Your Rights and Choices
              </h2>
              <p className="mb-3 text-gray-600">
                You control what you share and how the platform connects to your
                accounts:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                <li>
                  Disconnect YouTube: you can revoke our access to your YouTube
                  account from within the app or from your Google account's
                  permissions page.
                </li>
                <li>
                  Access and correction: request access to or correction of your
                  personal data via the support channels in the app.
                </li>
                <li>
                  Account deletion: you may request deletion of your account and
                  personal information; certain aggregated data may be retained
                  for legitimate business purposes.
                </li>
                <li>
                  Cookies and tracking: manage cookies via your browser settings
                  and opt-out of analytics where provided.
                </li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-3 text-gray-800">
                6. Children's Privacy
              </h2>
              <p className="mb-3 text-gray-600">
                The platform is not intended for children under 13. We do not
                knowingly collect personal information from children under 13.
                If you believe a child has provided us with personal
                information, please contact us so we can take appropriate steps.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-3 text-gray-800">
                7. Changes to This Privacy Policy
              </h2>
              <p className="mb-3 text-gray-600">
                We may update this policy to reflect changes in our practices or
                for legal or operational reasons. If we make material changes we
                will provide notice through the app or by updating the "Last
                updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-gray-800">
                8. Contact Us
              </h2>
              <p className="text-gray-600">
                If you have questions, requests to access or delete your data,
                or concerns about privacy, please contact us through the Support
                page in the app or via email at{" "}
                <a
                  className="text-blue-600 hover:underline"
                  href="mailto:info@koncms.com"
                >
                  info@koncms.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
