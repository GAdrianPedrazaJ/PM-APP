import { NhostClient } from '@nhost/nhost-js'

const nhost = new NhostClient({
  subdomain: "<tu-subdominio>",
  region: "us-east-1"
})

const result = await nhost.graphql.request(`
  query {
    proyectos {
      id
      nombre_proyecto
    }
  }
`)
console.log(result.data.proyectos)
