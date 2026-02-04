// routes/creos.js
// Esta API es para gestionar la tabla "creos"
// Rutas:
// GET  /api/creos
// GET  /api/creos/:id
// POST /api/creos
// PUT  /api/creos/:id
// DELETE /api/creos/:id

import express from 'express'
import client from '../nhostClient.js'

const router = express.Router()

router.get('/', async (req, res) => {
  const query = `
    query {
      creos {
        id
        nombre
        descripcion
      }
    }
  `
  try {
    const data = await client.request(query)
    res.json(data.creos)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error listando creos' })
  }
})

router.get('/:id', async (req, res) => {
  const query = `
    query($id: Int!) {
      creos_by_pk(id: $id) {
        id
        nombre
        descripcion
      }
    }
  `
  try {
    const data = await client.request(query, { id: parseInt(req.params.id) })
    res.json(data.creos_by_pk)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error obteniendo creos' })
  }
})

router.post('/', async (req, res) => {
  const { nombre, descripcion } = req.body
  const mutation = `
    mutation($nombre: String!, $descripcion: String) {
      insert_creos_one(object: { nombre: $nombre, descripcion: $descripcion }) {
        id
        nombre
        descripcion
      }
    }
  `
  try {
    const data = await client.request(mutation, { nombre, descripcion })
    res.status(201).json(data.insert_creos_one)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error creando creos' })
  }
})

router.put('/:id', async (req, res) => {
  const { nombre, descripcion } = req.body
  const mutation = `
    mutation($id: Int!, $nombre: String, $descripcion: String) {
      update_creos_by_pk(pk_columns: { id: $id }, _set: { nombre: $nombre, descripcion: $descripcion }) {
        id
        nombre
        descripcion
      }
    }
  `
  try {
    const data = await client.request(mutation, { id: parseInt(req.params.id), nombre, descripcion })
    res.json(data.update_creos_by_pk)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error actualizando creos' })
  }
})

router.delete('/:id', async (req, res) => {
  const mutation = `
    mutation($id: Int!) {
      delete_creos_by_pk(id: $id) {
        id
      }
    }
  `
  try {
    const data = await client.request(mutation, { id: parseInt(req.params.id) })
    res.json({ deleted: data.delete_creos_by_pk })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error eliminando creos' })
  }
})

export default router
