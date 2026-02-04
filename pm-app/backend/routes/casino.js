// routes/casino.js
// Esta API es para gestionar la tabla "casino"
// Rutas:
// GET  /api/casino         -> lista todos los registros
// GET  /api/casino/:id     -> obtiene un registro por id
// POST /api/casino         -> crea un registro
// PUT  /api/casino/:id     -> actualiza un registro
// DELETE /api/casino/:id   -> elimina un registro

import express from 'express'
import client from '../nhostClient.js'

const router = express.Router()

// Listar todos
router.get('/', async (req, res) => {
  const query = `
    query {
      casino {
        id
        nombre
        descripcion
      }
    }
  `
  try {
    const data = await client.request(query)
    res.json(data.casino)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error listando casino' })
  }
})

// Obtener por id
router.get('/:id', async (req, res) => {
  const query = `
    query($id: Int!) {
      casino_by_pk(id: $id) {
        id
        nombre
        descripcion
      }
    }
  `
  try {
    const data = await client.request(query, { id: parseInt(req.params.id) })
    res.json(data.casino_by_pk)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error obteniendo casino' })
  }
})

// Crear
router.post('/', async (req, res) => {
  const { nombre, descripcion } = req.body
  const mutation = `
    mutation($nombre: String!, $descripcion: String) {
      insert_casino_one(object: { nombre: $nombre, descripcion: $descripcion }) {
        id
        nombre
        descripcion
      }
    }
  `
  try {
    const data = await client.request(mutation, { nombre, descripcion })
    res.status(201).json(data.insert_casino_one)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error creando casino' })
  }
})

// Actualizar
router.put('/:id', async (req, res) => {
  const { nombre, descripcion } = req.body
  const mutation = `
    mutation($id: Int!, $nombre: String, $descripcion: String) {
      update_casino_by_pk(pk_columns: { id: $id }, _set: { nombre: $nombre, descripcion: $descripcion }) {
        id
        nombre
        descripcion
      }
    }
  `
  try {
    const data = await client.request(mutation, { id: parseInt(req.params.id), nombre, descripcion })
    res.json(data.update_casino_by_pk)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error actualizando casino' })
  }
})

// Eliminar
router.delete('/:id', async (req, res) => {
  const mutation = `
    mutation($id: Int!) {
      delete_casino_by_pk(id: $id) {
        id
      }
    }
  `
  try {
    const data = await client.request(mutation, { id: parseInt(req.params.id) })
    res.json({ deleted: data.delete_casino_by_pk })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error eliminando casino' })
  }
})

export default router
