import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  if (req.query.secret !== process.env.ADMIN_SECRET) return res.status(401).end();

  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      SELECT visitor, type, key, value, created_at, updated_at
      FROM responses
      ORDER BY visitor, type, key
    `;
    res.status(200).json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
