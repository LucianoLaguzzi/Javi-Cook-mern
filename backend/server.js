console.log("Iniciando servidor...");

import express from 'express';
import cors from 'cors';
import open from 'open';  // Cambiado a import
import conectarDB from './config/db.js';
import path from 'path';
import usuarioRoutes from './routes/usuarioRoutes.js'; // Importa las rutas de usuario
import recetaRoutes from './routes/recetaRoutes.js'; // Importa las rutas de recetas
import detalleRoutes from './routes/detalleRoutes.js'; // Importa las rutas de detalles
import comentarioRoutes from './routes/comentarioRoutes.js'; // Importa las rutas de comentarios
import valoracionRoutes from './routes/valoracionRoutes.js'; // Importa las rutas de valoraciones

const app = express();
const PORT = process.env.PORT || 5000; // Definir el puerto aquí

// Middleware
app.use(cors());
app.use(express.json());


// Conexión a MongoDB
const startServer = async () => {
  try {
    await conectarDB(); // Asegúrate de que esto maneje los errores
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
      if (process.env.NODE_ENV !== 'production') {
        open(`http://localhost:${PORT}`);
      }
    });
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    process.exit(1); // Terminar la aplicación si falla la conexión
  }
};

startServer();

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente');
});



// Configurar la ruta para servir archivos estáticos
const __dirname = path.resolve(); // Esto es necesario para obtener la ruta absoluta en Node.js
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

app.use('/images', express.static(path.join(__dirname, 'images')));




// Rutas de usuario
app.use('/api/usuarios', usuarioRoutes); // Agrega esta línea para usar las rutas de usuario

// Rutas de recetas
app.use('/api/recetas', recetaRoutes); // Usar las rutas de recetas

// Usar las rutas en la aplicación
app.use('/api/detalles', detalleRoutes);

// Usar las rutas de comentarios en la aplicación
app.use('/api/recetas', comentarioRoutes); // Aquí simplemente usas '/api/recetas'

// Usar las rutas de las valoraciones en la aplicación
app.use('/api/valoraciones', valoracionRoutes); // Aquí simplemente usas '/api/recetas'