import express from 'express';
import bcrypt from 'bcryptjs'; // Importa bcrypt
import Usuario from '../models/Usuario.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ruta para crear un nuevo usuario (registrar)
router.post('/registrar', async (req, res) => {
  console.log('Datos recibidos:', req.body); // Imprime los datos que llegan
  try {
    const { nombre, contrasenia, email } = req.body;
    

     // Validación simple
     if (!nombre || !contrasenia || !email) {
      return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
    }

    // Hashear la contraseña
    const hashedContrasenia = await bcrypt.hash(contrasenia, 10); 

    // Crear el nuevo usuario
    const nuevoUsuario = new Usuario({ nombre, contrasenia: hashedContrasenia, email});

   

    await nuevoUsuario.save();
    
    res.status(201).json({ mensaje: 'Usuario creado exitosamente', usuario: nuevoUsuario }
    );
  } catch (error) {
    if (error.code === 11000) { // Código de error para clave duplicada
      return res.status(400).json({ mensaje: 'El correo electrónico ya está registrado' });
    }
    res.status(500).json({ mensaje: 'Error al crear el usuario', error });
  }
});


// Ruta para loguear un usuario
router.post('/login', async (req, res) => {
    try {
      const { nombre, contrasenia } = req.body;
      
      // Buscar el usuario por nombre
      const usuario = await Usuario.findOne({ nombre });
      
      if (!usuario) {
        return res.status(401).json({ mensaje: 'Credenciales inválidas' });
      }
  
      // Comparar la contraseña proporcionada con la contraseña hasheada
      const isMatch = await bcrypt.compare(contrasenia, usuario.contrasenia);
      if (!isMatch) {
        return res.status(401).json({ mensaje: 'Credenciales inválidas' });
      }
      
      res.status(200).json({ mensaje: 'Usuario logueado exitosamente', usuario });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al loguear', error });
    }
});


// Ruta para actualizar el perfil del usuario
router.put('/actualizarPerfil/:id', async (req, res) => {
  try {
      const { nombre, email } = req.body;
      const usuarioId = req.params.id;

      // Actualizar usuario en la base de datos
      const usuarioActualizado = await Usuario.findByIdAndUpdate(
          usuarioId,
          { nombre, email },
          { new: true } // Para que devuelva el documento actualizado
      );

      if (!usuarioActualizado) {
          return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json(usuarioActualizado);
  } catch (error) {
      res.status(500).json({ error: 'Error al actualizar el perfil del usuario' });
  }
});


// Cambiar foto de perfil:
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'images/perfil';
    
    // Verificar si la carpeta existe, si no, crearla
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: async (req, file, cb) => {
    const usuarioId = req.params.usuarioId;
    
    try {
      const usuario = await Usuario.findById(usuarioId); // Obtener los detalles del usuario
      if (!usuario) {
        return cb(new Error('Usuario no encontrado'));
      }

      const extension = path.extname(file.originalname); // Obtener la extensión del archivo
      const nombreUsuario = usuario.nombre.toLowerCase().replace(/\s+/g, '-'); // Formatear el nombre del usuario

      cb(null, `${nombreUsuario}-profile${extension}`); // Usar el nombre de usuario en el nombre del archivo
    } catch (error) {
      console.error('Error al obtener el nombre del usuario:', error);
      cb(new Error('Error al obtener el nombre del usuario'));
    }
  }
});

const upload = multer({ storage });

router.put('/imagen-perfil/:usuarioId', upload.single('imagenPerfil'), async (req, res) => {
  try {
    const usuarioId = req.params.usuarioId;
    if (!usuarioId) {
      return res.status(400).json({ mensaje: 'No se proporcionó un ID de usuario válido.' });
    }

    // Obtener el usuario y actualizar su imagen de perfil
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    // Guardar la ruta de la nueva imagen en la base de datos
    usuario.imagenPerfil = `/images/perfil/${usuario.nombre.toLowerCase().replace(/\s+/g, '-')}-profile${path.extname(req.file.originalname)}`;
    await usuario.save();

    return res.status(200).json({ mensaje: 'Imagen de perfil actualizada con éxito.', imagenPerfil: usuario.imagenPerfil });
  } catch (error) {
    console.error('Error al actualizar la imagen de perfil:', error);
    res.status(500).json({ mensaje: 'Error al actualizar la imagen de perfil.' });
  }
});





// Obtener recetas favoritas
router.get('/:id/favoritos', async (req, res) => {
  const { id } = req.params;

  try {
      const usuario = await Usuario.findById(id).populate('recetasFavoritas');
      if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

      res.status(200).json(usuario.recetasFavoritas);
  } catch (error) {
      res.status(500).json({ mensaje: 'Error al obtener recetas favoritas' });
  }
});

// Añadir una receta a favoritos
router.post('/:id/favoritos', async (req, res) => {
  const { id } = req.params;
  const { recetaId } = req.body;

  try {
      const usuario = await Usuario.findById(id);
      if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

      if (!usuario.recetasFavoritas.includes(recetaId)) {
          usuario.recetasFavoritas.push(recetaId);
          await usuario.save();
          res.status(200).json({ mensaje: 'Receta añadida a favoritos' });
      } else {
          res.status(400).json({ mensaje: 'La receta ya está en favoritos' });
      }
  } catch (error) {
      res.status(500).json({ mensaje: 'Error al agregar a favoritos' });
  }
});

// Eliminar una receta de favoritos
router.delete('/:id/favoritos', async (req, res) => {
  const { id } = req.params;
  const { recetaId } = req.body;

  try {
      const usuario = await Usuario.findById(id);
      if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

      usuario.recetasFavoritas = usuario.recetasFavoritas.filter(fav => fav.toString() !== recetaId);
      await usuario.save();
      res.status(200).json({ mensaje: 'Receta eliminada de favoritos' });
  } catch (error) {
      res.status(500).json({ mensaje: 'Error al eliminar de favoritos' });
  }
});




export default router;