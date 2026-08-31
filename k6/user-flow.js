import http from "k6/http";
import { check } from "k6";

export const options = {
  vus: 50,
  duration: "10s",
};

export default function () {

    //Simulo flujo, desde el login, obtencion de recetas y acceso a los detalles de una receta especifica

    //Enviamos credenciales de login para autenticar al usuario
    const loginUrl = "http://localhost:5000/api/usuarios/login";

    const body = JSON.stringify({
        nombre: "test",
        contrasenia: "test",
    });       

    const params = {
        headers: {
            "Content-Type": "application/json"
        }
    };

    //Recibimos la respuesta del login y verificamos que el status sea 200
    const loginResponse = http.post(loginUrl, body, params);

    check(loginResponse, {
        "login responde con 200": (r) => r.status === 200
    });


   //Una vez autenticado, obtenemos la lista de recetas
    const recetasUrl = "http://localhost:5000/api/recetas";

    const recetasResponse = http.get(recetasUrl);


    check(recetasResponse, {
        "recetas status es 200": (r) => r.status === 200
    });


    //Ahora deberia extraer el id de la primer receta dada la obtencion de recetasResponse, para luego acceder a los detalles de esa receta especifica.
    const primerRecetaId = recetasResponse.json()[0]._id;

    const recetaDetalleUrl = `http://localhost:5000/api/detalles/${primerRecetaId}`;

    const recetaDetalleResponse = http.get(recetaDetalleUrl);

    check(recetaDetalleResponse, {
        "detalle receta status es 200": (r) => r.status === 200
    });






}
