export default function SessionPage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '48rem', margin: '0 auto' }}>
      <h1>Start session</h1>
      <p style={{ color: 'var(--muted)' }}>
        Paste Zoom link, select 1–3 agents, click Start. Coming next.
      </p>
      <a href="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
        ← Back
      </a>
    </main>
  );
}
