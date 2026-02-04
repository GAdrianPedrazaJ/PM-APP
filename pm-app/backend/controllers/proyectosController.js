const db = require('../config/db');

exports.list = async (req, res) => {
  try {
    const rows = await db('proyectos').select('*').orderBy('nombre');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = req.params.id;
    const row = await db('proyectos').where({ proyecto_id: id }).first();
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const payload = req.body;
    const [id] = await db('proyectos').insert(payload).returning('proyecto_id');
    res.status(201).json({ proyecto_id: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    await db('proyectos').where({ proyecto_id: id }).update({ ...req.body, updated_at: db.fn.now() });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = req.params.id;
    await db('proyectos').where({ proyecto_id: id }).del();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
