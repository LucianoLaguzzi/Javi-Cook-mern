import mongoose from 'mongoose';

const NotificacionSchema = new mongoose.Schema({
  usuarioDestino: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  mensaje: {
    type: String,
    required: true,
  },
  enlace: {
    type: String, // URL para redirigir al usuario (ej: "/receta/123")
    required: false,
  },
  leida: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true }); // Agrega createdAt y updatedAt automáticamente

const Notificacion = mongoose.model('Notificacion', NotificacionSchema);

export default Notificacion;