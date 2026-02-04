// routes/crisalida.js
// Esta API es para gestionar la tabla "crisalida"
// Rutas:
// GET  /api/crisalida
// GET  /api/crisalida/:id
// POST /api/crisalida
// PUT  /api/crisalida/:id
// DELETE /api/crisalida/:id

import express from 'express'
import client from '../nhostClient.js'

const router = express.Router()

router.get('/', async (req, res) => {
  const query = `
    query {
      crisalida {
        id
        nombre
        descripcion
      }
    }
  `
  try {
    const data = await client.request(query)
    res.json(data.crisalida)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error listando crisalida' })
  }
})

router.get('/:id', async (req, res) => {
  const query = `
    query($id: Int!) {
      crisalida_by_pk(id: $id) {
        id
        nombre
        descripcion
      }
    }
  `
  try {
    const data = await client.request(query, { id: parseInt(req.params.id) })
    res.json(data.crisalida_by_pk)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error obteniendo crisalida' })
  }
})

router.post('/', async (req, res) => {
  const { nombre, descripcion } = req.body
  const mutation = `
    mutation($nombre: String!, $descripcion: String) {
      insert_crisalida_one(object: { nombre: $nombre, descripcion: $descripcion }) {
        id
        nombre
        descripcion
      }
    }
  `
  try {
    const data = await client.request(mutation, { nombre, descripcion })
    res.status(201).json(data.insert_crisalida_one)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error creando crisalida' })
  }
})

router.put('/:id', async (req, res) => {
  const { nombre, descripcion } = req.body
  const mutation = `
    mutation($id: Int!, $nombre: String, $descripcion: String) {
      update_crisalida_by_pk(pk_columns: { id: $id }, _set: { nombre: $nombre, descripcion: $descripcion }) {
        id
        nombre
        descripcion
      }
    }
  `
  try {
    const data = await client.request(mutation, { id: parseInt(req.params.id), nombre, descripcion })
    res.json(data.update_crisalida_by_pk)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error actualizando crisalida' })
  }
})

router.delete('/:id', async (req, res) => {
  const mutation = `
    mutation($id: Int!) {
      delete_crisalida_by_pk(id: $id) {
        id
      }
    }
  `
  try {
    const data = await client.request(mutation, { id: parseInt(req.params.id) })
    res.json({ deleted: data.delete_crisalida_by_pk })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error eliminando crisalida' })
  }
})

export default router
