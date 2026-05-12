import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      SELECT key, value, updated_at
      FROM responses
      WHERE type = 'tool_approved'
      ORDER BY updated_at ASC
    `;
    res.status(200).json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
