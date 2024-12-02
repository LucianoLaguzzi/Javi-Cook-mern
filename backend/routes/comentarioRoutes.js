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
    const { comentario, usuario, comentarioPadre } = req.body; // Datos del comentario
  
    try {
      // Buscar la receta
      const receta = await Receta.findById(id);
      if (!receta) {
        return res.status(404).json({ message: 'Receta no encontrada' });
      }
  
      // Crear el nuevo comentario
      const nuevoComentario = new Comentario({
        comentario,
        usuario,
        receta: receta._id,
        fecha: new Date(),
      });
  
      // Si es una respuesta a un comentario
      if (comentarioPadre) {
        const comentarioPadreEncontrado = await Comentario.findById(comentarioPadre);
        if (!comentarioPadreEncontrado) {
          return res.status(404).json({ message: 'Comentario padre no encontrado' });
        }
  
        // Agregar respuesta al comentario padre
        comentarioPadreEncontrado.respuestas.push(nuevoComentario._id);
        await comentarioPadreEncontrado.save();
      } else {
        // Si es un comentario principal, agregarlo a la receta
        receta.comentarios.push(nuevoComentario._id);
        await receta.save();
      }
  
      // Guardar el comentario en la base de datos
      const comentarioGuardado = await nuevoComentario.save();
  
      // Poblar los datos del usuario antes de devolverlos
      const comentarioConUsuario = await Comentario.findById(comentarioGuardado._id).populate('usuario', 'nombre imagenPerfil');
  
      res.status(201).json({ comentarioGuardado: comentarioConUsuario });
    } catch (error) {
      console.error('Error en el backend:', error);
      res.status(500).json({ message: 'Error al agregar el comentario' });
    }
  });

export default router;
