import client from './nhostclient.js'

async function insertProyecto() {
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
      nombre: "Proyecto Demo",
      total: 5000,
      estado: "Activo"
    })
    console.log('Proyecto insertado ✅')
    console.log(data.insert_proyectos_one)
  } catch (error) {
    console.error('Error insertando proyecto ❌')
    console.error(error)
  }
}

insertProyecto()
