import express from 'express';
import Comentario from '../models/Comentario.js'; // Asegúrate de que esté bien importado
import Receta from '../models/Receta.js';

const router = express.Router();


// Ruta para obtener una receta con sus comentarios
router.get('/:id', async (req, res) => {
    try {
        const receta = await Receta.findById(req.params.id)
            .populate({
                path: 'comentarios',
                populate: {
                    path: 'usuario',
                    model: 'Usuario',
                    select: 'nombre imagenPerfil'
                }
            });

        if (!receta) {
            return res.status(404).json({ message: 'Receta no encontrada' });
        }

        res.json(receta);
    } catch (error) {
        console.error('Error al obtener receta con comentarios:', error);
        res.status(500).json({ message: 'Error al obtener la receta' });
    }
});



// Ruta para agregar un comentario a una receta
router.post('/:id/comentarios', async (req, res) => {
    const { id } = req.params; // ID de la receta
    const { comentario, usuario, parentComment } = req.body;

    try {
        const receta = await Receta.findById(id);
        if (!receta) {
            return res.status(404).json({ message: 'Receta no encontrada' });
        }

        const nuevoComentario = new Comentario({
            comentario,
            usuario,
            receta: receta._id,
            parentComment: parentComment || null, // Manejar si es respuesta o no
            fecha: new Date(),
        });

        const comentarioGuardado = await nuevoComentario.save();
        receta.comentarios.push(comentarioGuardado._id);
        await receta.save();

        const comentarioConUsuario = await Comentario.findById(comentarioGuardado._id)
            .populate('usuario', 'nombre imagenPerfil')
            .populate('parentComment');

        res.status(201).json({ comentarioGuardado: comentarioConUsuario });
    } catch (error) {
        console.error('Error al agregar el comentario:', error);
        res.status(500).json({ message: 'Error al agregar el comentario' });
    }
});


router.post('/:id/comentarios/respuesta', async (req, res) => {
    try {
      const { comentario, usuario, parentComment } = req.body;
  
      // Crear la nueva respuesta
      const nuevaRespuesta = new Comentario({
        comentario,
        usuario,
        parentComment,  // Asegúrate de que 'parentComment' sea el comentario al que se responde
      });
  
      await nuevaRespuesta.save();
  
      // Agregar la respuesta al comentario principal
      const comentarioPrincipal = await Comentario.findById(parentComment);
      if (!comentarioPrincipal) {
        return res.status(404).json({ mensaje: 'Comentario principal no encontrado' });
      }
  
      comentarioPrincipal.respuestas.push(nuevaRespuesta._id);
      await comentarioPrincipal.save();
  
      // Rellenar los datos del usuario para la respuesta antes de enviarla de vuelta
      await nuevaRespuesta.populate('usuario', 'nombre imagenPerfil').execPopulate();
  
      res.json({ comentarioGuardado: nuevaRespuesta });
    } catch (error) {
      console.error('Error en agregar respuesta:', error);
      res.status(500).json({ mensaje: 'Error al agregar la respuesta', error: error.message });
    }
  });


export default router;
