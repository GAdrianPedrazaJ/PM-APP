const db = require('../config/db');

exports.list = async (req, res) => {
  try {
    const { proyecto_id } = req.query;
    const q = db('anticipos').select('*').orderBy('fecha_pago', 'desc');
    if (proyecto_id) q.where({ proyecto_id });
    const rows = await q;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = req.params.id;
    const row = await db('anticipos').where({ anticipo_id: id }).first();
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const payload = req.body;
    const [id] = await db('anticipos').insert(payload).returning('anticipo_id');
    res.status(201).json({ anticipo_id: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    await db('anticipos').where({ anticipo_id: id }).update({ ...req.body, updated_at: db.fn.now() });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = req.params.id;
    await db('anticipos').where({ anticipo_id: id }).del();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
