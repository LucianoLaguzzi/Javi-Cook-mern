import mongoose from 'mongoose';

const conectarDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI no está definida');
    }

    const conexion = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB conectado en: ${conexion.connection.host}`);
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

export default conectarDB;
