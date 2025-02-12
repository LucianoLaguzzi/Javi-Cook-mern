import mongoose from 'mongoose';

const UsuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
  },
  contrasenia: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Asegura que el email sea único
  },
  imagenPerfil: {
    type: String,
    default:'/images/default-imagen-perfil.jpg', // Imagen por defecto
  },
  recetasFavoritas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Receta',
  }],

}, { timestamps: true }); // Agrega createdAt y updatedAt automáticamente

const Usuario = mongoose.model('Usuario', UsuarioSchema);

export default Usuario;