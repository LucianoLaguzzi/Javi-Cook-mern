/// <reference types="cypress" />

describe("Smoke test - Home", () => {

    beforeEach(() => {
      cy.clearLocalStorage();
    });

  it("Muestra pantalla de inicio de app", () => {
    cy.visit("/");

    cy.contains("Cargando...").should("be.visible");
    cy.location("pathname", { timeout: 10000 }).should("eq", "/inicio");
    cy.contains("Cargando...").should("not.exist");

  });

  it("Llega al home y muestra bien la info", () => {
    cy.visit("/inicio")

    cy.contains("Inspírate con recetas exclusivas").should("be.visible");
    cy.contains("Recetas disponibles").should("be.visible");
    cy.get("img[alt='Logotipo']").should("be.visible")
    cy.contains("Iniciar sesión").should("be.visible");
    cy.contains("Registrarse").should("be.visible");

  });



});