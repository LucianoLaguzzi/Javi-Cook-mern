import http from "k6/http";
import { check } from "k6";

export const options = {
  vus: 50,
  duration: "10s",
};

export default function () {
  const response = http.get("http://localhost:5000/api/recetas");

  check(response, {
    "status es 200": (r) => r.status === 200,
  });

}




