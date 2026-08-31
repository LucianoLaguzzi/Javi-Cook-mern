//Test de rendendimiento para el flujo de login, si pasa (status 200),  obtener recetas del usuario dado el id, si pasa (status 200), ir a pagina de detalles de la primera receta

import http from 'k6/http';
import { check} from 'k6';

export const options = {
    vus: 50, // Número de usuarios virtuales  
    duration: '10s', // Duración de la prueba
};

export default function () {
  // Paso 1: Login
  const loginPayload = JSON.stringify({
    nombre: 'test',
    contrasenia: 'test',
  });

    const loginHeaders = { 'Content-Type': 'application/json' };

    const loginResponse = http.post('http://localhost:5000/api/usuarios/login', loginPayload, { headers: loginHeaders });

    check(loginResponse, {
        'Login status es 200': (r) => r.status === 200,
    });

    if (loginResponse.status === 200) {
        const userId = loginResponse.json().usuario._id; // Extraer el ID del usuario del response del login
    
        // Paso 2: Obtener recetas del usuario
        const recetasResponse = http.get(`http://localhost:5000/api/recetas/usuario/${userId}`);

        check(recetasResponse, {
            'Obtener recetas status es 200': (r) => r.status === 200,
        });

    

        if (recetasResponse.status === 200) {
            const recetas = recetasResponse.json();

            if (recetas.length > 0) {
                const primeraRecetaId = recetas[0]._id;
            
        
                // Paso 3: Ir a la página de detalles de la primera receta
                const detalleRecetaResponse = http.get(`http://localhost:5000/api/detalles/${primeraRecetaId}`);

                check(detalleRecetaResponse, {
                    'Detalle receta status es 200': (r) => r.status === 200,
                });
            }
        }

    }

}
//PROBAR A VER SI ANDA