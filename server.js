const dns = require('dns');
dns.setServers(["1.1.1.1", "8.8.8.8"]); 

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
    console.error("ERROR crítico: Falta configurar la variable MONGODB_URI.");
    process.exit(1);
}

mongoose.connect(mongoURI)
    .then(() => console.log('Base de datos conectada en la nube.'))
    .catch(err => console.error('Error de conexión a MongoDB:', err));

const DataSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, 
    data: { type: Array, required: true }
}, { timestamps: true, versionKey: false });

const DashboardData = mongoose.model('DashboardData', DataSchema);

app.get('/api/data/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const record = await DashboardData.findOne({ key });
        res.json(record ? record.data : []);
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});


const handleSaveOrUpdate = async (req, res) => {
    try {
        const { key } = req.params;
        const arrayData = req.body;

        if (!Array.isArray(arrayData)) {
            return res.status(400).json({ error: true, message: "El cuerpo de la petición debe ser un Array válido." });
        }

        const result = await DashboardData.findOneAndUpdate(
            { key },
            { data: arrayData },
            { new: true, upsert: true }
        );

        res.json({ status: "OK", message: "Guardado correctamente.", count: result.data.length });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
};

app.post('/api/data/:key', handleSaveOrUpdate);
app.put('/api/data/:key', handleSaveOrUpdate);

app.listen(PORT, () => {
    console.log(`Backend de producción escuchando peticiones en el puerto ${PORT}`);
});
