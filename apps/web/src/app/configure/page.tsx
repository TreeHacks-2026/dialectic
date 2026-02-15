export default function ConfigurePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '48rem', margin: '0 auto' }}>
      <h1>Configure personas</h1>
      <p style={{ color: 'var(--muted)' }}>
        Name, system prompt, and document upload (PDF/TXT, max 3, 10MB). Coming next.
      </p>
      <a href="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
        ← Back
      </a>
    </main>
  );
}
