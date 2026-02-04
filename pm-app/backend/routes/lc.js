// routes/lc.js
// Esta API es para gestionar la tabla "lc"
// Rutas:
// GET  /api/lc
// GET  /api/lc/:id
// POST /api/lc
// PUT  /api/lc/:id
// DELETE /api/lc/:id

import express from 'express'
import client from '../nhostClient.js'

const router = express.Router()

router.get('/', async (req, res) => {
  const query = `
    query {
      lc {
        id
        nombre
        descripcion
      }
    }
  `
  try {
    const data = await client.request(query)
    res.json(data.lc)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error listando lc' })
  }
})

router.get('/:id', async (req, res) => {
  const query = `
    query($id: Int!) {
      lc_by_pk(id: $id) {
        id
        nombre
        descripcion
      }
    }
  `
  try {
    const data = await client.request(query, { id: parseInt(req.params.id) })
    res.json(data.lc_by_pk)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error obteniendo lc' })
  }
})

router.post('/', async (req, res) => {
  const { nombre, descripcion } = req.body
  const mutation = `
    mutation($nombre: String!, $descripcion: String) {
      insert_lc_one(object: { nombre: $nombre, descripcion: $descripcion }) {
        id
        nombre
        descripcion
      }
    }
  `
  try {
    const data = await client.request(mutation, { nombre, descripcion })
    res.status(201).json(data.insert_lc_one)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error creando lc' })
  }
})

router.put('/:id', async (req, res) => {
  const { nombre, descripcion } = req.body
  const mutation = `
    mutation($id: Int!, $nombre: String, $descripcion: String) {
      update_lc_by_pk(pk_columns: { id: $id }, _set: { nombre: $nombre, descripcion: $descripcion }) {
        id
        nombre
        descripcion
      }
    }
  `
  try {
    const data = await client.request(mutation, { id: parseInt(req.params.id), nombre, descripcion })
    res.json(data.update_lc_by_pk)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error actualizando lc' })
  }
})

router.delete('/:id', async (req, res) => {
  const mutation = `
    mutation($id: Int!) {
      delete_lc_by_pk(id: $id) {
        id
      }
    }
  `
  try {
    const data = await client.request(mutation, { id: parseInt(req.params.id) })
    res.json({ deleted: data.delete_lc_by_pk })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error eliminando lc' })
  }
})

export default router
