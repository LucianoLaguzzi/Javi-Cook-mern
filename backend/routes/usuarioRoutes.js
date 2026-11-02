import express from 'express';
import bcrypt from 'bcryptjs'; 
import Usuario from '../models/Usuario.js';
import Notificacion from '../models/Notificacion.js'
import Receta from '../models/Receta.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Token from '../models/Token.js'; 
import nodemailer from 'nodemailer'; 
import { randomBytes } from 'crypto'; 
import cloudinary from 'cloudinary';

import SibApiV3Sdk from 'sib-api-v3-sdk';




const router = express.Router();

// Ruta para crear un nuevo usuario (registrar)
router.post('/registrar', async (req, res) => {
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
      //Asigna en la variable nombre y email los valores que vienen en el body de la request llamados nombre y email (el objeto).    
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
      // Si el error es de duplicidad (duplicate key error) se verifica con error.code === 11000
      if (error.code === 11000) {
          return res.status(400).json({ error: 'El email o el usuario que intentas modificar ya están en uso' });
      }
      res.status(500).json({ error: 'Error al actualizar el perfil del usuario' });
  }
});





// Configurar multer para guardar la imagen temporalmente en el servidor (esto ya no se deberia usar)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      const uploadPath = 'uploads/perfil';
      if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });  // Crear la carpeta si no existe
      }
      cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
      cb(null, `${req.params.usuarioId}-profile-${Date.now()}.${file.mimetype.split('/')[1]}`);
  },
});

const upload = multer({ storage });




// Ruta para subir imagen de perfil
router.put('/imagen-perfil/:usuarioId', upload.single('imagenPerfil'), async (req, res) => {
  try {

      if (!req.file) {
          return res.status(400).json({ mensaje: 'No se ha enviado ningún archivo.' });
      }

      // Subir la imagen a Cloudinary
      const resultado = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: 'perfil',
          public_id: `${req.params.usuarioId}-profile`,
          overwrite: true,
      });

      // Actualizar la URL de la imagen en la base de datos
      const usuario = await Usuario.findByIdAndUpdate(
          req.params.usuarioId,
          { imagenPerfil: resultado.secure_url },
          { new: true }
      );

      if (!usuario) {
          return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
      }

      res.status(200).json({
          mensaje: 'Imagen de perfil actualizada con éxito.',
          imagenPerfil: usuario.imagenPerfil,
      });
  } catch (error) {
      console.error('Error al actualizar la imagen de perfil:', error);
      res.status(500).json({ mensaje: 'Error al actualizar la imagen de perfil.', error: error.message });
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


const generarSlug = (texto) =>
  texto
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');


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

            

            // Buscar la receta para obtener datos (autor y título)
            const receta = await Receta.findById(recetaId);
            if (!receta) {
                console.error("Receta no encontrada");
            } else {
                // No notificar si el usuario agregó su propia receta a favoritos
                if (receta.usuario.toString() !== usuario._id.toString()) {
                    // Obtener el nombre del usuario que agregó a favoritos
                    const usuarioEmisor = await Usuario.findById(id).select('nombre');

                    const slug = generarSlug(receta.titulo);
    
                    // Crear la notificación para el autor de la receta
                    const nuevaNotificacion = new Notificacion({
                        usuarioDestino: receta.usuario,
                        mensaje: `@${usuarioEmisor.nombre} ha agregado a favoritos tu receta "${receta.titulo}"`,
                        enlace:  `${process.env.FRONTEND_URL}/detalle-receta/${slug}/${receta._id}`,
                        leida: false
                    });
                    await nuevaNotificacion.save();
                }
            }

            res.status(200).json({ mensaje: 'Receta añadida a favoritos' });
        } else {
            res.status(400).json({ mensaje: 'La receta ya está en favoritos' });
        }
    } catch (error) {
        console.error("ERROR FAVORITOS:", error);
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
        const user = await Usuario.findOne({
            $or: [{ nombre: usuario }, { email: usuario }]
        });

        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        // Generar token de recuperación
        const token = new Token({
            userId: user._id,
            token: randomBytes(32).toString('hex')
        });
        await token.save();

        // Crear el enlace de recuperación
        const enlace =  `${process.env.FRONTEND_URL}/recuperar/${token.token}`;

        // 👉 CONFIGURAR ACA (IMPORTANTE)
        const client = SibApiV3Sdk.ApiClient.instance;
        client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

        const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

        const nombreSeguro = String(user.nombre || 'usuario').replace(
            /[&<>"']/g,
            caracter => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[caracter]
        );





        await apiInstance.sendTransacEmail({
            sender: {
                email: process.env.EMAIL_USER,
                name: "JaviCook"
            },
            to: [
                {
                    email: user.email,
                    name: user.nombre || "Usuario"
                }
            ],
            subject: "Recuperación de contraseña",
            htmlContent: `
                <div style="margin:0;padding:0;background-color:#f5eee5;font-family:Arial,Helvetica,sans-serif;color:#342a22;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#f5eee5;">
                        <tr>
                            <td align="center" style="padding:36px 16px;">
                                <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;background-color:#fffaf4;border:1px solid #e4d2bc;border-radius:14px;overflow:hidden;">

                                    <tr>
                                        <td align="center" style="padding:27px 24px;background-color:#342a22;border-bottom:3px solid #deb887;">
                                            <h1 style="margin:0;color:#f0d3a0;font-size:30px;line-height:1.2;font-weight:700;letter-spacing:0.3px;">
                                                JaviCook
                                            </h1>
                                            <p style="margin:8px 0 0;color:#d5c5b3;font-size:13px;line-height:1.5;">
                                                Recuperación de contraseña
                                            </p>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding:32px 28px 20px;">
                                            <p style="margin:0 0 18px;color:#342a22;font-size:16px;line-height:1.6;">
                                                ¡Hola ${nombreSeguro}!
                                            </p>

                                            <h2 style="margin:0 0 14px;color:#342a22;font-size:22px;line-height:1.35;">
                                                Recuperá el acceso a tu cuenta
                                            </h2>

                                            <p style="margin:0 0 24px;color:#68594b;font-size:15px;line-height:1.75;">
                                                Recibimos una solicitud para restablecer tu contraseña de JaviCook. Para elegir una nueva, hacé clic en el siguiente botón.
                                            </p>

                                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 24px;">
                                                <tr>
                                                    <td align="center" bgcolor="#ea6e12" style="border-radius:9px;">
                                                        <a href="${enlace}" target="_blank" style="display:inline-block;padding:14px 28px;border:1px solid #ea6e12;border-radius:9px;color:#ffffff;font-size:15px;font-weight:bold;line-height:1.3;text-decoration:none;">
                                                            Cambiar contraseña
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p style="margin:0 0 10px;color:#68594b;font-size:13px;line-height:1.6;">
                                                Si el botón no funciona, copiá y pegá este enlace en tu navegador:
                                            </p>

                                            <p style="margin:0 0 24px;padding:12px;background-color:#f5eee5;border:1px solid #e4d2bc;border-radius:7px;font-size:12px;line-height:1.7;overflow-wrap:anywhere;word-break:break-word;">
                                                <a href="${enlace}" target="_blank" style="color:#9b5b1d;text-decoration:underline;overflow-wrap:anywhere;word-break:break-word;">
                                                    ${enlace}
                                                </a>
                                            </p>

                                            <p style="margin:0;color:#68594b;font-size:13px;line-height:1.7;">
                                                Si no solicitaste este cambio, podés ignorar este correo. Tu contraseña actual no cambiará por recibirlo.
                                            </p>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td align="center" style="padding:20px 24px;background-color:#f0e5d8;border-top:1px solid #e4d2bc;">
                                            <p style="margin:0 0 5px;color:#68594b;font-size:13px;line-height:1.5;">
                                                Equipo JaviCook
                                            </p>
                                            <p style="margin:0;color:#8b7a69;font-size:11px;line-height:1.5;">
                                                Este es un correo automático. Por favor, no respondas a este mensaje.
                                            </p>
                                        </td>
                                    </tr>

                                </table>
                            </td>
                        </tr>
                    </table>
                </div>
            `
        });

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
        console.error("Usuario no encontrado para el token:", tokenRegistro.userId);
          return res.status(404).json({ error: "Usuario no encontrado" });
      }

      // Encriptar la nueva contraseña
      const salt = await bcrypt.genSalt(10);
      const contraseniaEncriptada = await bcrypt.hash(nuevaContrasenia, salt);

      // Actualizar la contraseña del usuario
      usuario.contrasenia = contraseniaEncriptada;
      await usuario.save(); // Guardar el usuario con la nueva contraseña
     

      // Eliminar el token después de usarlo
      await Token.deleteOne({ token });
      console.log('Token eliminado');

      res.status(200).json({ mensaje: "Contraseña cambiada con éxito" });
  } catch (error) {
      console.error("Error al cambiar la contraseña:", error);
      res.status(500).json({ error: "Error al cambiar la contraseña" });
  }
});




router.get('/:idUsuario', async (req, res) => {
  try {
      const notificaciones = await Notificacion.find({ usuarioDestino: req.params.idUsuario }).sort({ fecha: -1 });
      res.json(notificaciones);
  } catch (error) {
      res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});




router.put('/marcarLeida/:id', async (req, res) => {
  try {
      await Notificacion.findByIdAndUpdate(req.params.id, { leida: true });
      res.json({ mensaje: 'Notificación marcada como leída' });
  } catch (error) {
      res.status(500).json({ error: 'Error al actualizar la notificación' });
  }
});


// Eliminar una notificación por ID
router.delete('/eliminar/:id', async (req, res) => {
  try {
      const { id } = req.params;
      await Notificacion.findByIdAndDelete(id);
      res.json({ mensaje: 'Notificación eliminada correctamente' });
  } catch (error) {
      console.error('Error al eliminar la notificación:', error);
      res.status(500).json({ error: 'Hubo un problema al eliminar la notificación' });
  }
});


export default router;