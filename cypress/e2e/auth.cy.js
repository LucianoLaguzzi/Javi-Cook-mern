/// <reference types="cypress" />

describe("Login testing" , () =>{

    it("Login form", () =>{

        cy.visit("/login");

        cy.location("pathname").should("eq", "/login");

        cy.contains("Login").should("be.visible");

        cy.get("input[placeholder='Usuario']").should("be.visible").click().type("test");
        cy.get("input[placeholder='Contraseña']").should("be.visible").click().type("test");

        cy.get("button[type='submit']").should("be.visible").click();


        cy.location("pathname").should("eq", "/inicio");

        cy.contains("Bienvenido")

        cy.window().then((win) => {
            const usuario = JSON.parse(win.localStorage.getItem("usuario"));

            expect(usuario).to.have.property("email");
            expect(usuario.email).to.eq("test@test.com");
        });
    })

    it("Login invalido", () =>{
        cy.visit("/login");
        cy.location("pathname").should("eq", "/login");

        cy.contains("Login").should("be.visible");

        cy.get("input[placeholder='Usuario']").should("be.visible").click().type("error");
        cy.get("input[placeholder='Contraseña']").should("be.visible").click().type("invalidPass");

        cy.get("button[type='submit']").should("be.visible").click();

       cy.get(".error-container").should("be.visible").and("contain", "Usuario o contraseña incorrectos");
    })

})