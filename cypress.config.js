import { defineConfig } from "cypress";

const baseUrl = "http://localhost:3000"; //"https://javicook-mern-front.onrender.com"

export default defineConfig({
  e2e: {
    baseUrl,
    
  },
});