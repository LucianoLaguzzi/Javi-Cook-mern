import express from 'express';
import Comentario from '../models/Comentario.js'; // Asegúrate de que esté bien importado
import Receta from '../models/Receta.js';
import Notificacion from '../models/Notificacion.js';

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




// Ruta para agregar un comentario o respuesta a una receta
router.post('/:id/comentarios', async (req, res) => {
    const { id } = req.params; // ID de la receta
    const { comentario, usuario, parentCommentId } = req.body; // Datos del comentario y respuesta

    try {
        // Buscar la receta por su ID
        const receta = await Receta.findById(id);
        if (!receta) {
            return res.status(404).json({ message: 'Receta no encontrada' });
        }

        // Crear un nuevo comentario (respuesta si hay parentCommentId)
        const nuevoComentario = new Comentario({
            comentario,
            usuario,
            receta: receta._id,
            fecha: new Date(),
            parentCommentId: parentCommentId || null // Si es respuesta, asigna el ID del comentario padre
        });

        // Guardar el comentario en la base de datos
        const comentarioGuardado = await nuevoComentario.save();








        // Crear la notificación para el autor de la receta
        if (receta.usuario.toString() !== usuario) {  // No notificar si el autor comenta en su propia receta
            const nuevaNotificacion = new Notificacion({
                usuario: receta.usuario,  // El dueño de la receta recibe la notificación
                mensaje: `@${usuario.nombre} comentó en tu receta "${receta.titulo}"`,
                leida: false
            });

            await nuevaNotificacion.save();
        }






        



        // Agregar el ID del comentario al array de comentarios de la receta
        receta.comentarios.push(comentarioGuardado._id);
        await receta.save(); // Guardar la receta actualizada

        // Aquí hacemos un populate para incluir el usuario en el comentario
        const comentarioConUsuario = await Comentario.findById(comentarioGuardado._id)
            .populate('usuario', 'nombre imagenPerfil') // Aseguramos que se devuelvan estos campos
            .populate('parentCommentId'); // Poblar el comentario padre si existe

        // Devolver el comentario con la información del usuario
        res.status(201).json({ comentarioGuardado: comentarioConUsuario });
    } catch (error) {
        console.error('Error en el backend:', error);
        res.status(500).json({ message: 'Error al agregar el comentario' });
    }
});


// Ruta para editar un comentario o respuesta
router.put('/:id/comentarios/:comentarioId', async (req, res) => {
    const { id, comentarioId } = req.params; // ID de la receta y del comentario
    const { comentario, usuario } = req.body; // Comentario editado y usuario en sesión

    try {
        // Buscar la receta por su ID
        const receta = await Receta.findById(id);
        if (!receta) {
            return res.status(404).json({ message: 'Receta no encontrada' });
        }

        // Buscar el comentario por su ID
        const comentarioExistente = await Comentario.findById(comentarioId);
        if (!comentarioExistente) {
            return res.status(404).json({ message: 'Comentario no encontrado' });
        }

        // Verificar que el usuario sea el autor del comentario
        if (comentarioExistente.usuario.toString() !== usuario) {
            return res.status(403).json({ message: 'No tienes permiso para editar este comentario' });
        }

        // Actualizar el comentario
        comentarioExistente.comentario = comentario;
        await comentarioExistente.save();

        // Poblar el usuario para devolverlo con la información actualizada
        const comentarioActualizado = await Comentario.findById(comentarioId)
            .populate('usuario', 'nombre imagenPerfil');

        res.json({ comentarioActualizado });
    } catch (error) {
        console.error('Error al editar el comentario:', error);
        res.status(500).json({ message: 'Error al editar el comentario' });
    }
});


// Ruta para editar una re-respuesta específica
router.put('/:id/comentarios/:comentarioId/respuestas/:respuestaId', async (req, res) => {
    const { id, comentarioId, respuestaId } = req.params; // ID de la receta, comentario y respuesta
    const { comentario, usuario } = req.body; // Comentario editado y usuario en sesión

    try {
        // Buscar la receta por su ID
        const receta = await Receta.findById(id);
        if (!receta) {
            return res.status(404).json({ message: 'Receta no encontrada' });
        }

        // Buscar el comentario padre
        const comentarioPadre = await Comentario.findById(comentarioId);
        if (!comentarioPadre) {
            return res.status(404).json({ message: 'Comentario padre no encontrado' });
        }

        // Verificar que la respuesta existe dentro de las respuestas del comentario
        const respuestaExistente = comentarioPadre.respuestas.find(
            (respuesta) => respuesta._id.toString() === respuestaId
        );
        if (!respuestaExistente) {
            return res.status(404).json({ message: 'Respuesta no encontrada' });
        }

        // Verificar que el usuario sea el autor de la respuesta
        if (respuestaExistente.usuario.toString() !== usuario) {
            return res.status(403).json({ message: 'No tienes permiso para editar esta respuesta' });
        }

        // Actualizar la respuesta
        respuestaExistente.comentario = comentario;
        await comentarioPadre.save();

        // Poblar el usuario de la respuesta actualizada para devolverla
        const respuestaActualizada = comentarioPadre.respuestas
            .find((respuesta) => respuesta._id.toString() === respuestaId);

        res.json({ comentarioActualizado: respuestaActualizada });
    } catch (error) {
        console.error('Error al editar la respuesta:', error);
        res.status(500).json({ message: 'Error al editar la respuesta' });
    }
});


// Ruta para editar re-respuesta
router.put('/:id/rerespuesta/:comentarioId', async (req, res) => {
    const { id, comentarioId } = req.params; // IDs de la receta y el comentario a editar
    const { comentario, usuario } = req.body; // Texto del comentario y usuario autenticado

    try {
        // Validar existencia de la receta
        const receta = await Receta.findById(id);
        if (!receta) {
            return res.status(404).json({ message: 'Receta no encontrada' });
        }

        // Buscar el comentario a editar
        const comentarioAEditar = await Comentario.findById(comentarioId);
        if (!comentarioAEditar) {
            return res.status(404).json({ message: 'Comentario no encontrado' });
        }

        // Validar que el usuario sea el autor del comentario
        if (comentarioAEditar.usuario.toString() !== usuario) {
            return res.status(403).json({ message: 'No tienes permiso para editar este comentario' });
        }

        // Actualizar el comentario
        comentarioAEditar.comentario = comentario;
        const comentarioActualizado = await comentarioAEditar.save();

        // Poblar datos del usuario en el comentario actualizado
        const comentarioPoblado = await Comentario.findById(comentarioActualizado._id)
            .populate('usuario', 'nombre imagenPerfil');

        res.json({ comentarioActualizado: comentarioPoblado });
    } catch (error) {
        console.error('Error al editar el comentario:', error);
        res.status(500).json({ message: 'Error al editar el comentario', error });
    }
});












// Ruta para eliminar un comentario o respuesta (y sus respuestas en cadena) de una receta (MODIFICAR O BORRAR)
router.delete('/:id/comentarios/:commentId', async (req, res) => {
    const { id, commentId } = req.params; // id de la receta y id del comentario a borrar
    const { usuario } = req.body; // id del usuario que solicita el borrado
  
    try {
      // Buscar la receta
      const receta = await Receta.findById(id);
      if (!receta) {
        return res.status(404).json({ message: 'Receta no encontrada' });
      }
  
      // Buscar el comentario
      const comentario = await Comentario.findById(commentId);
      if (!comentario) {
        return res.status(404).json({ message: 'Comentario no encontrado' });
      }
  
      // Verificar permisos: debe ser el autor del comentario o el autor de la receta
      if (
        String(comentario.usuario) !== usuario && String(receta.usuario) !== usuario
      ) {
        return res.status(403).json({
          message: 'No tienes permiso para borrar este comentario',
        });
      }
  
     // Función recursiva para obtener los IDs de todos los comentarios descendientes
    async function obtenerIdsDescendientes(id) {
        // Buscar respuestas directas del comentario con id dado
        const hijos = await Comentario.find({ parentCommentId: id });
        // Extraer los IDs de los hijos encontrados
        let ids = hijos.map((hijo) => hijo._id.toString());
        // Por cada hijo, obtener recursivamente sus descendientes
        for (const hijo of hijos) {
          const subIds = await obtenerIdsDescendientes(hijo._id);
          ids = ids.concat(subIds);
        }
        return ids;
      }
  
      // Obtener todos los IDs descendientes del comentario a borrar
      const idsDescendientes = await obtenerIdsDescendientes(commentId);
  
      // Eliminar el comentario y TODOS sus descendientes (respuestas, re-respuestas, etc.)
      await Comentario.deleteMany({
        _id: { $in: [commentId, ...idsDescendientes] }
      });
  
      // Opcional: remover el id del comentario borrado del array de comentarios de la receta
      receta.comentarios = receta.comentarios.filter(
        (cId) => String(cId) !== commentId
      );
      await receta.save();
  
      res.status(200).json({ message: 'Comentario eliminado' });
    } catch (error) {
      console.error("Error al borrar el comentario:", error);
      res.status(500).json({ message: 'Error al borrar el comentario' });
    }
  });





export default router;
