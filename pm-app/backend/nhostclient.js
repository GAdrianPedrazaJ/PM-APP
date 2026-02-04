import { GraphQLClient } from 'graphql-request'

// Reemplaza con tu endpoint y admin secret de Nhost
const client = new GraphQLClient(
  'https://cyesgrwisfdwqueprzmy.hasura.us-east-1.nhost.run/v1/graphql',
  {
    headers: {
      'x-hasura-admin-secret': 'y^GeKt@4z*&G4fmII21vty84ZSAmTKp*'
    }
  }
)

export default client
