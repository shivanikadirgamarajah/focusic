const sections = [
    {
        title: "1. Introduction",
        content: (
            <>
                <p>
                    Welcome to Focusic (&quot;Focusic,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), an AI-powered music discovery and productivity web application available at{" "}
                    <a href="https://focusic.vercel.app" target="_blank" rel="noreferrer">https://focusic.vercel.app</a>.
                </p>
                <p>
                    Focusic helps users discover music suited to studying, coding, working, and other focused activities through personalized recommendations, YouTube music playback, and productivity tools.
                </p>
                <p>
                    We respect your privacy and are committed to being transparent about how information is collected, used, stored, and shared when you use Focusic.
                </p>
                <p>This Privacy Policy explains our data practices and your available privacy choices.</p>
                <p>
                    By using Focusic, you agree to our Privacy Policy and, when accessing YouTube-powered features, the{" "}
                    <a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer">YouTube Terms of Service</a>.
                </p>
            </>
        ),
    },
    {
        title: "2. Information We Collect",
        content: (
            <>
                <p>Focusic processes information necessary to provide music recommendations and productivity features.</p>
                <h3>Information you provide</h3>
                <ul>
                    <li>Your name or nickname, if you create a Focusic profile.</li>
                    <li>Your preferred work activity, such as coding, studying, writing, or designing.</li>
                    <li>Your preferred focus and break durations.</li>
                    <li>Music search queries and preferences.</li>
                    <li>Songs you choose to save to your liked songs collection.</li>
                </ul>
                <h3>Information generated through your use of Focusic</h3>
                <ul>
                    <li>Music listening history, including track titles.</li>
                    <li>Focus session activity and accumulated focus time.</li>
                    <li>Timer settings and session state.</li>
                    <li>Music recommendation interactions.</li>
                </ul>
                <h3>Technical information</h3>
                <p>
                    When accessing Focusic, technical information such as IP addresses, browser information, and request details may be processed by our hosting provider and third-party services to deliver and maintain the application.
                </p>
                <p>Focusic does not require users to provide their YouTube account credentials to search for or play publicly available videos.</p>
            </>
        ),
    },
    {
        title: "3. How We Use Your Information",
        content: (
            <>
                <p>We use information to:</p>
                <ul>
                    <li>Generate personalized music recommendations based on listening history and preferences.</li>
                    <li>Retrieve relevant music and video content.</li>
                    <li>Evaluate tracks for suitability during focused activities.</li>
                    <li>Save liked songs and listening preferences.</li>
                    <li>Display productivity statistics and focus activity.</li>
                    <li>Preserve timer settings between visits.</li>
                    <li>Maintain, troubleshoot, and improve the application&apos;s functionality.</li>
                </ul>
                <p>We do not use your Focusic listening history or productivity activity to deliver targeted advertisements.</p>
            </>
        ),
    },
    {
        title: "4. Browser Storage",
        content: (
            <>
                <p>Focusic uses browser local storage (<code>localStorage</code>) to remember user preferences and application activity. This may include:</p>
                <ul>
                    <li>Profile information and preferences.</li>
                    <li>Search and listening history.</li>
                    <li>Liked songs.</li>
                    <li>Focus activity and accumulated focus time.</li>
                    <li>Timer settings.</li>
                </ul>
                <p>This information generally remains on your device until you delete it, clear your browser&apos;s site data, or your browser removes it.</p>
                <p>Although these preferences are stored locally, some information is transmitted to Focusic&apos;s backend when you request recommendations or search for music.</p>
            </>
        ),
    },
    {
        title: "5. AI-Powered Recommendations",
        content: (
            <>
                <p>Focusic uses artificial intelligence to provide music recommendations and evaluate tracks for focused work.</p>
                <p>Our AI functionality is supported by Groq&apos;s API services. Depending on the feature being used, information processed for AI functionality may include:</p>
                <ul>
                    <li>Recent music search history.</li>
                    <li>Recent listening history.</li>
                    <li>Search topics, moods, and work activities.</li>
                    <li>Video titles and related track information.</li>
                </ul>
                <p>Focusic&apos;s recommendation requests may also contain preference settings and summarized focus activity. These are transmitted to the Focusic backend, although not all fields are necessarily included in requests to the AI provider.</p>
                <p>Information submitted to an AI service is used to generate recommendations or analyze music suitability.</p>
                <p>
                    Groq processes information according to its applicable privacy and data-processing practices. For additional information, visit{" "}
                    <a href="https://groq.com/privacy-policy/" target="_blank" rel="noreferrer">Groq&apos;s Privacy Policy</a>.
                </p>
            </>
        ),
    },
    {
        title: "6. YouTube API Services",
        content: (
            <>
                <p>Focusic uses YouTube API Services to retrieve publicly available music and video information and to provide embedded YouTube video playback. This may include retrieving video titles, thumbnails, channel names, video identifiers, and durations.</p>
                <p><strong>By using YouTube-related features within Focusic, users are also subject to the following policies:</strong></p>
                <ul>
                    <li><a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer">YouTube Terms of Service</a></li>
                    <li><a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google Privacy Policy</a></li>
                </ul>
                <p>When YouTube videos or embedded players are loaded, Google and YouTube may collect information such as device identifiers, IP addresses, cookies, playback interactions, and related usage information in accordance with their own policies.</p>
                <p>Focusic does not currently require Google or YouTube account authorization to access public music-search functionality.</p>
                <p>Focusic does not request or store your Google or YouTube password.</p>
                <p>Focusic is an independent application and is not affiliated with, sponsored by, or endorsed by YouTube or Google.</p>
            </>
        ),
    },
    {
        title: "7. Third-Party Service Providers",
        content: (
            <>
                <p>Focusic uses third-party services to provide its functionality. These may include:</p>
                <ul>
                    <li><strong>YouTube and Google:</strong> For music discovery, public video metadata, and embedded playback.</li>
                    <li><strong>Groq:</strong> For AI-powered music recommendations and track analysis.</li>
                    <li><strong>Vercel:</strong> For hosting and delivering the Focusic web application.</li>
                </ul>
                <p>These services may process information necessary to perform their respective functions. Their independent processing activities are governed by their applicable privacy policies.</p>
                <p>We do not sell Focusic user information to advertisers or data brokers.</p>
            </>
        ),
    },
    {
        title: "8. Cookies and Similar Technologies",
        content: (
            <>
                <p>Focusic uses browser local storage to preserve application settings and activity.</p>
                <p>Third-party services, including YouTube&apos;s embedded player, may use cookies or similar technologies for functionality, security, analytics, personalization, or other purposes described in their privacy policies.</p>
                <p>You may control or delete cookies and locally stored information through your browser settings. Restricting storage technologies may affect certain Focusic features.</p>
            </>
        ),
    },
    {
        title: "9. Data Retention and Deletion",
        content: (
            <>
                <p>Information saved in your browser may remain there until you remove it.</p>
                <p>You can reset your profile preferences using the reset option on Focusic&apos;s Profile page.</p>
                <p>To remove other locally stored Focusic information, including listening history, saved songs, and activity records, you can clear the website&apos;s stored data through your browser settings.</p>
                <p>Clearing browser storage does not automatically delete information processed or retained by third-party providers.</p>
                <p>Temporary technical records or requests processed by hosting and API providers may be retained according to those providers&apos; applicable retention policies.</p>
                <p>For questions or requests concerning information controlled by Focusic, you may contact us using the details below.</p>
            </>
        ),
    },
    {
        title: "10. Data Security",
        content: (
            <>
                <p>We take reasonable steps to protect information processed through Focusic, including using HTTPS for communication with the deployed application and its supported services.</p>
                <p>However, no internet-based service or electronic storage system can guarantee complete security.</p>
                <p>Users should avoid entering sensitive personal information into music search fields or other general-purpose inputs.</p>
            </>
        ),
    },
    {
        title: "11. International Data Processing",
        content: (
            <>
                <p>Focusic uses third-party technology and infrastructure providers that may process information outside your country or region.</p>
                <p>Different privacy and data protection laws may apply in the locations where these providers operate.</p>
            </>
        ),
    },
    {
        title: "12. Children's Privacy",
        content: (
            <>
                <p>Focusic is not designed specifically for children under the age of 13.</p>
                <p>We do not knowingly seek to collect personal information from children under 13. If you believe a child has provided personal information that requires removal, please contact us.</p>
            </>
        ),
    },
    {
        title: "13. Your Privacy Choices",
        content: (
            <>
                <p>You can:</p>
                <ul>
                    <li>Modify or reset your Focusic profile preferences.</li>
                    <li>Remove liked songs through the application&apos;s available controls.</li>
                    <li>Clear Focusic&apos;s locally stored information using browser settings.</li>
                    <li>Restrict cookies using browser privacy controls.</li>
                    <li>Stop using Focusic at any time.</li>
                    <li>Contact us with questions or requests related to personal information.</li>
                </ul>
                <p>Depending on your location and applicable law, you may have additional rights concerning access, correction, or deletion of personal information.</p>
            </>
        ),
    },
    {
        title: "14. Changes to This Privacy Policy",
        content: (
            <>
                <p>We may update this Privacy Policy to reflect changes in Focusic&apos;s features, service providers, or applicable legal requirements.</p>
                <p>When significant changes occur, we will update the &quot;Last Updated&quot; date on this page and provide additional notice when required.</p>
            </>
        ),
    },
    {
        title: "15. Contact Us",
        content: (
            <>
                <p>If you have questions, concerns, or requests related to this Privacy Policy, please contact the Focusic developer.</p>
                <dl className="mt-5 grid gap-3 sm:grid-cols-[120px_1fr]">
                    <dt>Application</dt><dd>Focusic</dd>
                    <dt>Website</dt><dd><a href="https://focusic.vercel.app" target="_blank" rel="noreferrer">https://focusic.vercel.app</a></dd>
                    <dt>GitHub</dt><dd><a href="https://github.com/shivanikadirgamarajah/focusic" target="_blank" rel="noreferrer">https://github.com/shivanikadirgamarajah/focusic</a></dd>
                    <dt>Email</dt><dd>[shivanikadirgamarajah@gmail.com]</dd>
                </dl>
            </>
        ),
    },
];

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-black px-4 py-12 text-white sm:px-8">
            <article className="mx-auto max-w-full">
                <header className="mb-10 border-b border-gray-800 pb-8">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-blue-400">Focusic</p>
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Privacy Policy</h1>
                    <p className="mt-4 text-sm text-gray-400">Last Updated: October 22, 2026</p>
                </header>

                <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-6 sm:p-10">
                    <div className="space-y-10">
                        {sections.map((section) => (
                            <section key={section.title}>
                                <h2 className="mb-4 text-xl font-semibold text-white sm:text-2xl">
                                    {section.title}
                                </h2>

                                <div className="space-y-4 leading-7 text-gray-300 [&_a]:text-blue-300 [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-blue-200 [&_h3]:pt-2 [&_h3]:font-semibold [&_h3]:text-white [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2 [&_dd]:break-words [&_dt]:font-semibold [&_dt]:text-gray-100">
                                    {section.content}
                                </div>
                            </section>
                        ))}
                    </div>
                </div>
            </article>
        </main>
    );
}
