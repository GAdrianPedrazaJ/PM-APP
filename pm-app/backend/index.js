import express from 'express'
import client from './nhostclient.js'

const app = express()
app.use(express.json())

// Endpoint para listar proyectos
app.get('/proyectos', async (req, res) => {
  const query = `
    query {
      proyectos {
        id
        nombre_proyecto
        estado
        total_proyecto
      }
    }
  `
  try {
    const data = await client.request(query)
    res.json(data.proyectos)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error consultando proyectos' })
  }
})

// Endpoint para insertar un proyecto
app.post('/proyectos', async (req, res) => {
  const { nombre_proyecto, total_proyecto, estado } = req.body

  const mutation = `
    mutation($nombre: String!, $total: numeric!, $estado: String!) {
      insert_proyectos_one(object: {
        nombre_proyecto: $nombre,
        total_proyecto: $total,
        estado: $estado
      }) {
        id
        nombre_proyecto
        total_proyecto
        estado
      }
    }
  `

  try {
    const data = await client.request(mutation, {
      nombre: nombre_proyecto,
      total: total_proyecto,
      estado
    })
    res.json(data.insert_proyectos_one)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error insertando proyecto' })
  }
})

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000')
})
