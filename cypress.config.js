import { defineConfig } from "cypress";

const baseUrl = "http://localhost:3000"; //"https://javicook-mern-front.onrender.com"

export default defineConfig({

  retries: {
    runMode: 1,
    openMode: 0,
  },

  reporter: "mochawesome",

  reporterOptions: {
    reportDir: "cypress/reports/json",
    overwrite: false,
    html: false,
    json: true,
  },


  e2e: {
    baseUrl,
    
  },
  
});