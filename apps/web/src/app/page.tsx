export default function Home() {
  return (
    <main style={{ padding: '2rem', maxWidth: '48rem', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Dialectic</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
        AI Persona Seminar — invite agents into Zoom for Socratic-style discussions.
      </p>
      <nav style={{ display: 'flex', gap: '1rem' }}>
        <a
          href="/configure"
          style={{
            color: 'var(--accent)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Configure personas →
        </a>
        <a
          href="/session"
          style={{
            color: 'var(--accent)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Start session →
        </a>
      </nav>
    </main>
  );
}
