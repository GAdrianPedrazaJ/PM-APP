// routes/otros.js
// Esta API es para gestionar la tabla "otros"
// Rutas:
// GET  /api/otros
// GET  /api/otros/:id
// POST /api/otros
// PUT  /api/otros/:id
// DELETE /api/otros/:id

import express from 'express'
import client from '../nhostClient.js'

const router = express.Router()

router.get('/', async (req, res) => {
  const query = `
    query {
      otros {
        id
        nombre
        descripcion
      }
    }
  `
  try {
    const data = await client.request(query)
    res.json(data.otros)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error listando otros' })
  }
})

router.get('/:id', async (req, res) => {
  const query = `
    query($id: Int!) {
      otros_by_pk(id: $id) {
        id
        nombre
        descripcion
      }
    }
  `
  try {
    const data = await client.request(query, { id: parseInt(req.params.id) })
    res.json(data.otros_by_pk)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error obteniendo otros' })
  }
})

router.post('/', async (req, res) => {
  const { nombre, descripcion } = req.body
  const mutation = `
    mutation($nombre: String!, $descripcion: String) {
      insert_otros_one(object: { nombre: $nombre, descripcion: $descripcion }) {
        id
        nombre
        descripcion
      }
    }
  `
  try {
    const data = await client.request(mutation, { nombre, descripcion })
    res.status(201).json(data.insert_otros_one)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error creando otros' })
  }
})

router.put('/:id', async (req, res) => {
  const { nombre, descripcion } = req.body
  const mutation = `
    mutation($id: Int!, $nombre: String, $descripcion: String) {
      update_otros_by_pk(pk_columns: { id: $id }, _set: { nombre: $nombre, descripcion: $descripcion }) {
        id
        nombre
        descripcion
      }
    }
  `
  try {
    const data = await client.request(mutation, { id: parseInt(req.params.id), nombre, descripcion })
    res.json(data.update_otros_by_pk)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error actualizando otros' })
  }
})

router.delete('/:id', async (req, res) => {
  const mutation = `
    mutation($id: Int!) {
      delete_otros_by_pk(id: $id) {
        id
      }
    }
  `
  try {
    const data = await client.request(mutation, { id: parseInt(req.params.id) })
    res.json({ deleted: data.delete_otros_by_pk })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error eliminando otros' })
  }
})

export default router
