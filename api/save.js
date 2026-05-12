import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { visitor, type, key, value } = req.body;
  if (!visitor || !type || !key) return res.status(400).json({ error: 'Missing fields' });

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`
      INSERT INTO responses (visitor, type, key, value, updated_at)
      VALUES (${visitor}, ${type}, ${key}, ${value}, now())
      ON CONFLICT (visitor, type, key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `;
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
