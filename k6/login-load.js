import http from "k6/http";
import { check } from "k6";

export const options = {
  vus: 50,
  duration: "10s",
};

export default function () {
  
  const url = "http://localhost:5000/api/usuarios/login";

  const body = JSON.stringify({
    nombre: "test",
    contrasenia: "test",
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = http.post(url, body, params);

  check(response, {
    "login responde con 200": (r) => r.status === 200,
  });
}