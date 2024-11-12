import express from 'express';
import bcrypt from 'bcryptjs'; // Importa bcrypt
import Usuario from '../models/Usuario.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Token from '../models/Token.js'; // el modelo de token que creaste
import nodemailer from 'nodemailer'; // usar para enviar el correo
import { randomBytes } from 'crypto'; // Importa randomBytes aquí

import cloudinary from 'cloudinary';


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





// Configurar multer para guardar la imagen temporalmente en el servidor
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/tmp/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Ruta para subir imagen de perfil
router.put('/imagen-perfil/:usuarioId', upload.single('imagenPerfil'), async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { path } = req.file; // Obtén la ruta temporal del archivo en el servidor

    // Subir la imagen a Cloudinary
    const resultado = await cloudinary.v2.uploader.upload(path, {
      folder: 'perfil',
      public_id: `${usuario.nombre.toLowerCase().replace(/\s+/g, '-')}-profile`,
      overwrite: true,
    });

    // Actualizar la URL de la imagen en la base de datos
    const usuario = await Usuario.findByIdAndUpdate(
      usuarioId,
      { imagenPerfil: resultado.secure_url }, // Guardar la URL de Cloudinary
      { new: true }
    );

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    res.status(200).json({ mensaje: 'Imagen de perfil actualizada con éxito.', imagenPerfil: usuario.imagenPerfil });
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






// Ruta para solicitar recuperación de contraseña
router.post('/recuperar', async (req, res) => {
  const { usuario } = req.body;

  try {
      // Buscar al usuario por nombre de usuario o email
      const user = await Usuario.findOne({ $or: [{ nombre: usuario }, { email: usuario }] });
      if (!user) {
          return res.status(404).json({ error: "Usuario no encontrado" });
      }

      // Generar token de recuperación
      const token = new Token({
          userId: user._id,
          token: randomBytes(32).toString('hex') // Cambiar a usar randomBytes
      });
      await token.save();

      // Crear el enlace de recuperación (aca iba `https://localhost:3000/recuperar/${token.token}`)
      const enlace = `https://192.168.0.178:3000/recuperar/${token.token}`;

      // Configurar y enviar el email
      const transporter = nodemailer.createTransport({
          service: 'gmail', // o el servicio que uses
          auth: {
              user: 'javicook.app@gmail.com',
              pass: 'tdhqvpfqpzqhrbys' // Asegúrate de que esto sea seguro
          }
      });

      const mailOptions = {
        from: 'javicook.app@gmail.com',
        to: user.email,
        subject: 'Recuperación de contraseña',
        html: `
        <div style="font-family: Arial, sans-serif; color: #333; text-align: center;">
            <h1 style="color: #3498db;">JaviCook</h1>
            <p>Hola ${user.nombre || 'usuario'},</p>
            <p>Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para cambiarla:</p>
            <a href="${enlace}" style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #3498db; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Cambiar contraseña
            </a>
            <p>O copia y pega el siguiente enlace en tu navegador:</p>
            <p style="color: #3498db;">${enlace}</p>
            <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
            <br>
            <p>Saludos,<br>Equipo de Javicook</p>
            <p style="color: #ccc;">© ${new Date().getFullYear()} Javicook. Todos los derechos reservados.</p>
        </div>
    `
    };

      await transporter.sendMail(mailOptions);

      res.status(200).json({ mensaje: "Revisa tu email para cambiar la contraseña" });
  } catch (error) {
      console.error("Error en recuperación de contraseña", error);
      res.status(500).json({ error: "Error en recuperación de contraseña" });
  }
});


// Ruta para cambiar la contraseña
router.post('/cambiar-contrasenia', async (req, res) => {
  const { token, nuevaContrasenia } = req.body;

  try {
      // Verificar el token
      const tokenRegistro = await Token.findOne({ token });
      if (!tokenRegistro) {
          return res.status(400).json({ error: "Token inválido" });
      }

      // Buscar al usuario
      const usuario = await Usuario.findById(tokenRegistro.userId);
      if (!usuario) {
          return res.status(404).json({ error: "Usuario no encontrado" });
      }

      // Encriptar la nueva contraseña
      const salt = await bcrypt.genSalt(10);
      const contraseniaEncriptada = await bcrypt.hash(nuevaContrasenia, salt);

      // Actualizar la contraseña del usuario
      usuario.contrasenia = contraseniaEncriptada;
      await usuario.save();

      // Eliminar el token después de usarlo
      await Token.deleteOne({ token });

      res.status(200).json({ mensaje: "Contraseña cambiada con éxito" });
  } catch (error) {
      console.error("Error al cambiar la contraseña:", error);
      res.status(500).json({ error: "Error al cambiar la contraseña" });
  }
});



export default router;