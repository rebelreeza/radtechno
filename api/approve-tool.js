import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (req.query.secret !== process.env.ADMIN_SECRET) return res.status(401).end();

  const { key, value, action } = req.body;
  if (!key || !action) return res.status(400).json({ error: 'Missing fields' });

  const type = action === 'approve' ? 'tool_approved' : 'tool_rejected';

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`
      INSERT INTO responses (visitor, type, key, value, updated_at)
      VALUES ('admin', ${type}, ${key}, ${value ?? ''}, now())
      ON CONFLICT (visitor, type, key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `;
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
