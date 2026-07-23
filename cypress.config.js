import { defineConfig } from "cypress";

const baseUrl = "http://localhost:3000"; //"https://javicook-mern-front.onrender.com"

export default defineConfig({

  retries: {
    runMode: 1,
    openMode: 0,
  },

  e2e: {
    baseUrl,
    
  },
  
});