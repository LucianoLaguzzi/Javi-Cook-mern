import express from 'express';
import Receta from '../models/Receta.js';
import Valoracion from '../models/Valoracion.js';
import Usuario from '../models/Usuario.js';


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



      // Crear la notificación para el autor de la receta
      // Poblar el usuario para obtener su nombre
      const usuarioEmisor = await Usuario.findById(usuarioId).select('nombre'); 

      if (!usuarioEmisor) {
        console.error("Usuario emisor no encontrado para ID:", usuarioId);
      }

      // Crear la notificación para el autor de la receta
      if  (receta.usuario && receta.usuario.toString() !== usuarioId.toString()) {  // No notificar si el autor comenta en su propia receta
          const nuevaNotificacion = new Notificacion({
              usuarioDestino: receta.usuario,  
              mensaje: `@${usuarioEmisor.nombre} valoró la receta "${receta.titulo}"`, // Ahora usuarioEmisor tiene el nombre
              enlace: `https://javicook-mern-front.onrender.com/detalle-receta/${receta._id}`, // Enlace corregido
              leida: false
          });

          await nuevaNotificacion.save();
      }



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


// Ruta para eliminar la valoración de un usuario
router.delete('/:recetaId/usuario/:usuarioId', async (req, res) => {
  const { recetaId, usuarioId } = req.params;

  try {
    // Eliminar la valoración
    const valoracionEliminada = await Valoracion.findOneAndDelete({ receta: recetaId, usuario: usuarioId });

    if (!valoracionEliminada) {
      return res.status(404).json({ mensaje: 'Valoración no encontrada' });
    }

    // Recalcular el promedio de la receta
    const valoraciones = await Valoracion.find({ receta: recetaId });
    const promedio = valoraciones.length > 0
      ? Math.round(valoraciones.reduce((acumulado, val) => acumulado + val.valor, 0) / valoraciones.length)
      : 0; // Si no hay valoraciones, el promedio es 0

    // Actualizar el promedio en la receta
    const receta = await Receta.findById(recetaId);
    receta.valoracion = promedio;
    await receta.save();

    res.status(200).json({ mensaje: 'Valoración eliminada correctamente', valoracion: promedio });

  } catch (error) {
    console.error('Error al eliminar la valoración:', error);
    return res.status(500).json({ mensaje: 'Error al eliminar la valoración', error });
  }
});

export default router;
