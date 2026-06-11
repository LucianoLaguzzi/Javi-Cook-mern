describe("Verificar rutas protegidas", () =>{

    it("verifica que este restringida la ruta",() =>{
        cy.clearLocalStorage();
        cy.visit("/crear-receta");
        
        cy.contains("Acceso restringido").should("be.visible");

        cy.get(".btn-login").should("be.visible");
    })


    it("verificar que se muestra la pagina con un usuario logueado", ()=>{

        cy.visit("/inicio");

        cy.window().then((win) => {
            win.localStorage.setItem("usuario", JSON.stringify({ id: 1,
                nombre:"testing",
                email: "test@test.com",
                token: "fake-token"
            }));
        })

        cy.visit("/crear-receta");
        cy.contains("Agregar nueva receta").should("be.visible");


    });

})
   

