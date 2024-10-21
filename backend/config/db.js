import mongoose from 'mongoose';

const conectarDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/javicook');
    console.log('Conectado a MongoDB');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

export default conectarDB;
