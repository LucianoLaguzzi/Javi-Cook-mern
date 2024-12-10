import express from 'express';
import Comentario from '../models/Comentario.js'; // Asegúrate de que esté bien importado
import Receta from '../models/Receta.js';

const router = express.Router();


// Ruta para obtener una receta con sus comentarios
router.get('/:id', async (req, res) => {
    try {
        const receta = await Receta.findById(req.params.id)
            .populate('usuario') // Popula el usuario que creó la receta
            .populate({ 
                path: 'comentarios', 
                populate: { 
                    path: 'usuario', // Popula el usuario de cada comentario
                    select: 'nombre imagenPerfil' // Puedes seleccionar los campos que quieres del usuario
                }
            })
            .populate({
                path: 'comentarios.respuestas', // Aquí solo se hace un populate para las respuestas de cada comentario
                populate: {
                    path: 'usuario', // Popula el usuario de cada respuesta
                    select: 'nombre imagenPerfil'
                }
            });

        if (!receta) {
            return res.status(404).json({ mensaje: 'Receta no encontrada' });
        }

        res.json(receta);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cargar la receta', error });
    }
});




// Ruta para agregar un comentario a una receta
// Ruta para agregar un comentario o respuesta
router.post('/:id/comentarios', async (req, res) => {
    try {
      const { comentario, usuario, parentCommentId } = req.body;
  
      const nuevoComentario = new Comentario({
        comentario,
        usuario,
        parentCommentId,
      });
  
      // Guarda el comentario en la base de datos
      await nuevoComentario.save();
  
      // Poblamos el comentario para incluir el usuario
      const comentarioGuardado = await Comentario.findById(nuevoComentario._id).populate('usuario');
  
      // Si el comentario es una respuesta, añadimos a la lista de respuestas del comentario padre
      if (parentCommentId) {
        await Comentario.findByIdAndUpdate(
          parentCommentId,
          { $push: { respuestas: comentarioGuardado._id } },
          { new: true }
        );
      }
  
      res.json({ comentarioGuardado });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al agregar comentario', error });
    }
  });


export default router;
