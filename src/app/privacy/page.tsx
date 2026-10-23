export default function Privacy() {
  return (
    <article className="legal">
      <span className="eyebrow">YOUR DATA, IN CONTEXT</span>
      <h1>Privacy at IdeaDNA</h1>
      <p>
        IdeaDNA stores your account email, public profile, contributions, and
        reactions in the workspace’s Supabase project. Email addresses are used
        for authentication and are not shown on public profiles.
      </p>
      <h2>What you share</h2>
      <p>
        Public trees and their contribution histories are visible to everyone.
        Unlisted trees are visible to anyone with the link. Private trees are
        accessible only to their creator. Choose visibility before publishing.
      </p>
      <h2>AI synthesis</h2>
      <p>
        When you request synthesis, the two selected contributions and your
        instructions are sent to the configured AI provider. Avoid including
        personal or confidential information. The resulting blueprint is stored
        in the same tree.
      </p>
      <h2>Browser storage</h2>
      <p>
        Demo mode keeps ideas and preferences on this device. Connected mode
        uses authentication cookies. Appearance preferences remain in browser
        storage. This application does not include advertising or third-party
        analytics.
      </p>
      <h2>Managing your information</h2>
      <p>
        You can edit your profile and archive your contributions. Workspace
        operators manage account deletion and data retention through Supabase.
        Operators must provide a support contact and retention policy before a
        public launch.
      </p>
    </article>
  );
}
