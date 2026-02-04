// index.js (o integra en tu servidor existente)
import express from 'express'
import casinoRoutes from './routes/casino.js'
import creosRoutes from './routes/creos.js'
import crisalidaRoutes from './routes/crisalida.js'
import lcRoutes from './routes/lc.js'
import otrosRoutes from './routes/otros.js'

const app = express()
app.use(express.json())

app.use('/api/casino', casinoRoutes)
app.use('/api/creos', creosRoutes)
app.use('/api/crisalida', crisalidaRoutes)
app.use('/api/lc', lcRoutes)
app.use('/api/otros', otrosRoutes)

app.listen(3000, () => console.log('API corriendo en http://localhost:3000'))
