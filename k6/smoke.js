import http from "k6/http";
import { check } from "k6";

export const options = {
  vus: 1,
  iterations: 1,
};

export default function () {
  const response = http.get("http://localhost:5000/");

  check(response, {
    "servidor responde con 200": (r) => r.status === 200,
  });
  
}