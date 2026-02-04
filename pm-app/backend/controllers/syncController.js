const db = require('../config/db');

exports.push = async (req, res) => {
  const ops = req.body.ops || [];
  const results = [];
  const trx = await db.transaction();
  try {
    for (const op of ops) {
      const { entidad, operacion, payload, local_id } = op;
      if (entidad === 'anticipos' && operacion === 'INSERT') {
        const [id] = await trx('anticipos').insert(payload).returning('anticipo_id');
        results.push({ local_id, server_id: id, status: 'ok' });
      } else {
        results.push({ local_id, status: 'skipped' });
      }
    }
    await trx.commit();
    res.json({ ok: true, results });
  } catch (err) {
    await trx.rollback();
    res.status(500).json({ ok: false, error: err.message });
  }
};

exports.pull = async (req, res) => {
  const since = req.query.since || '1970-01-01T00:00:00Z';
  try {
    const anticipos = await db('anticipos').where('updated_at', '>', since).select('*');
    res.json({ ok: true, anticipos });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
