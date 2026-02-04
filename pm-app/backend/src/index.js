require('dotenv').config();
const express = require('express');
const cors = require('cors');

const proyectosRoutes = require('./routes/proyectos');
const anticiposRoutes = require('./routes/anticipos');
const syncRoutes = require('./routes/sync');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/proyectos', proyectosRoutes);
app.use('/api/anticipos', anticiposRoutes);
app.use('/api/sync', syncRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
