import express from 'express';
import Receta from '../models/Receta.js';
import Valoracion from '../models/Valoracion.js';
import Usuario from '../models/Usuario.js';
import Notificacion from '../models/Notificacion.js';


const router = express.Router();


const generarSlug = (texto) =>
  texto
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');



// Ruta para valorar una receta
router.post('/', async (req, res) => {
  const { recetaId, usuarioId, valor } = req.body;

  try {
    // Validar los datos recibidos
    if (!recetaId || !usuarioId) {
      return res.status(400).json({
        mensaje: 'Faltan datos para registrar la valoración.'
      });
    }

    const valorNumerico = Number(valor);

    if (
      !Number.isInteger(valorNumerico) ||
      valorNumerico < 1 ||
      valorNumerico > 5
    ) {
      return res.status(400).json({
        mensaje: 'La valoración debe ser un número entero entre 1 y 5.'
      });
    }

    // Comprobar que existan la receta y el usuario
    const receta = await Receta.findById(recetaId);

    if (!receta) {
      return res.status(404).json({
        mensaje: 'La receta no existe.'
      });
    }

    const usuarioEmisor = await Usuario.findById(usuarioId).select('nombre');

    if (!usuarioEmisor) {
      return res.status(404).json({
        mensaje: 'El usuario no existe.'
      });
    }

    // Comprobar si el usuario ya había valorado esta receta
    const valoracionExistente = await Valoracion.findOne({
      receta: recetaId,
      usuario: usuarioId
    });

    const esNuevaValoracion = !valoracionExistente;

    if (valoracionExistente) {
      // Modificar la valoración existente
      valoracionExistente.valor = valorNumerico;
      await valoracionExistente.save();
    } else {
      // Crear una valoración nueva
      const nuevaValoracion = new Valoracion({
        receta: recetaId,
        usuario: usuarioId,
        valor: valorNumerico
      });

      await nuevaValoracion.save();
    }

    // Recalcular el promedio
    const valoraciones = await Valoracion.find({ receta: recetaId });

    const promedio = Math.round(
      valoraciones.reduce(
        (acumulado, valoracion) => acumulado + valoracion.valor,
        0
      ) / valoraciones.length
    );

    receta.valoracion = promedio;
    await receta.save();

    // Notificar únicamente cuando se registra una valoración nueva
    // y el autor de la receta no es quien está valorando.
    if (
      esNuevaValoracion &&
      receta.usuario &&
      receta.usuario.toString() !== usuarioId.toString()
    ) {
      const slug = generarSlug(receta.titulo);

      try {
        const nuevaNotificacion = new Notificacion({
          usuarioDestino: receta.usuario,
          mensaje: `@${usuarioEmisor.nombre} valoró tu receta "${receta.titulo}"`,
          enlace: `${process.env.FRONTEND_URL}/detalle-receta/${slug}/${receta._id}`,
          leida: false
        });

        await nuevaNotificacion.save();
      } catch (errorNotificacion) {
        console.error(
          'Error al guardar la notificación:',
          errorNotificacion
        );
      }
    }

    res.status(200).json({
      mensaje: 'Valoración guardada correctamente',
      valoracion: receta.valoracion
    });

  } catch (error) {
    console.error('Error al valorar la receta:', error);

    res.status(500).json({
      mensaje: 'Error al valorar la receta.'
    });
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
