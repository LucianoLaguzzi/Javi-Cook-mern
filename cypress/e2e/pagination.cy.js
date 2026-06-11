    describe("Paginación de recetas", () => {

        it("Muestra solo 6 recetas por página y permite navegar", () => {

            const recetasMock = Array.from({ length: 12 }, (_, i) => ({
                _id: `${i + 1}`,
                titulo: `Receta ${i + 1}`,
                ingredientes: ["ingrediente"],
                imagen: "https://res.cloudinary.com/dzaqvpxqk/image/upload/v1773853635/recetas/ux6fcesvzxl3scqe0hmy.jpg",
                usuario: {
                    _id: "123",
                    nombre: "test"
                },
                categoria: "Postre",
                tiempoPreparacion: 10,
                dificultad: "Fácil"
            }));

            cy.intercept("GET", "**/api/recetas", {
                statusCode: 200,
                body: recetasMock
            }).as("getRecetas");

            cy.visit("/inicio");

            cy.wait("@getRecetas");

           // Página 1
        cy.get("#recetas .tarjeta-receta").should("have.length", 6);

        cy.get("#recetas").within(() => {
            cy.contains("Receta 1").should("be.visible");
            cy.contains("Receta 6").should("be.visible");
            cy.contains("Receta 7").should("not.exist");
        });

        // Ir a página 2
        cy.contains("button", "Siguiente").click();

        // Página 2
        cy.get("#recetas .tarjeta-receta").should("have.length", 6);

        cy.get("#recetas").within(() => {
            cy.contains("Receta 7").should("be.visible");
            cy.contains("Receta 12").should("be.visible");
            cy.contains("Receta 6").should("not.exist");
        });


        cy.contains("button", "Siguiente").should("be.disabled");

        // Volver a página 1
        cy.contains("button", "Anterior").click();

        cy.get("#recetas .tarjeta-receta").should("have.length", 6);

        cy.get("#recetas").within(() => {
            cy.contains("Receta 1").should("be.visible");
            cy.contains("Receta 6").should("be.visible");
        });

        cy.contains("Receta 7").should("not.exist");


    });

});