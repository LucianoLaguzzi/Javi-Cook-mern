console.log("Iniciando servidor...");

import express from 'express';
import cors from 'cors';
import open from 'open';
import conectarDB from './config/db.js';
import path from 'path';
import usuarioRoutes from './routes/usuarioRoutes.js';
import recetaRoutes from './routes/recetaRoutes.js';
import detalleRoutes from './routes/detalleRoutes.js';
import comentarioRoutes from './routes/comentarioRoutes.js';
import valoracionRoutes from './routes/valoracionRoutes.js';
//import fs from 'fs';
//import https from 'https';

// Importa e inicializa Cloudinary
import cloudinary from 'cloudinary';



cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});



const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'https://javicook-mern-front.onrender.com', // Dominio del frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());


// Conexión a MongoDB
const startServer = async () => {
  try {
    await conectarDB();

    // Cambia a servidor HTTP en lugar de HTTPS
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      if (process.env.NODE_ENV !== 'production') {
        open(`http://localhost:${PORT}`);
      }
    });
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    process.exit(1);
  }
};

startServer();

// Rutas de prueba
app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente');
});

// Configurar la ruta para servir archivos estáticos
const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/images', express.static(path.join(__dirname, 'images')));
// Habilitar acceso público a la carpeta donde están las imágenes de perfil
app.use('/images/perfil', express.static(path.join(__dirname, 'images', 'perfil')));

// Rutas de la aplicación
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/recetas', recetaRoutes);
app.use('/api/detalles', detalleRoutes);
app.use('/api/recetas', comentarioRoutes);
app.use('/api/valoraciones', valoracionRoutes);
app.use('/api/recuperar', usuarioRoutes);
app.use('/api/temporizador', recetaRoutes);