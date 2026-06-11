import { defineConfig } from "cypress";

const baseUrl = "https://javicook-mern-front.onrender.com"; //"http://localhost:3000"

export default defineConfig({
  e2e: {
    baseUrl,
    
  },
});