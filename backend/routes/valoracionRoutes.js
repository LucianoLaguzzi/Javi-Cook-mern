import express from 'express';
import Receta from '../models/Receta.js';
import Valoracion from '../models/Valoracion.js';


const router = express.Router();



// Ruta para valorar una receta
router.post('/', async (req, res) => {
  const { recetaId, usuarioId, valor } = req.body;

  try {
    // Verificar si el usuario ya valoró esta receta
    const valoracionExistente = await Valoracion.findOne({ receta: recetaId, usuario: usuarioId });
    
    if (valoracionExistente) {
      // Si ya valoró, actualiza la valoración
      valoracionExistente.valor = valor;
      await valoracionExistente.save();
    } else {
      // Si no ha valorado, crea una nueva valoración
      const nuevaValoracion = new Valoracion({
        receta: recetaId,
        usuario: usuarioId,
        valor
      });
      await nuevaValoracion.save();
    }

    // Calcular el promedio de la receta
    const valoraciones = await Valoracion.find({ receta: recetaId });
    const promedio = Math.round(valoraciones.reduce((acumulado, val) => acumulado + val.valor, 0) / valoraciones.length);

    // Actualizar el promedio en el modelo Receta
    const receta = await Receta.findById(recetaId);
    receta.valoracion = promedio;
    await receta.save();

    res.status(200).json({ mensaje: 'Valoración guardada correctamente', valoracion: receta.valoracion });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al valorar la receta', error });
  }
});


// Ruta para obtener la valoración de un usuario para una receta
router.get('/:recetaId/usuario/:usuarioId', async (req, res) => {
  const { recetaId, usuarioId } = req.params;

  try {
    const valoracion = await Valoracion.findOne({ receta: recetaId, usuario: usuarioId });
    if (valoracion) {
      return res.json({ valoracionUsuario: valoracion.valor });
    } else {
      return res.json({ valoracionUsuario: 0 }); // Si no hay valoración, retornamos 0
    }
  } catch (error) {
    console.error('Error al obtener la valoración del usuario:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});


export default router;
