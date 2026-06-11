describe("Verificacion de perfil de usuario", () => {
    const usuarioMock = {
        _id: 123456789,
        nombre: "testProfile",
        email: "testProfile@example.com",
        imagenPerfil: "/images/default-imagen-perfil.jpg"
    };


    it("Deberia mostrar el perfil del usuario", () => {
        
        // Simular login
        cy.visit("/inicio", {
            onBeforeLoad(win) {
                win.localStorage.setItem("usuario", JSON.stringify(usuarioMock));
            }
        });

        // Ir a la página de perfil
        cy.visit("/perfil/123456789");
 

        cy.contains("Perfil del usuario").should("be.visible");

        cy.get(".output-nombre-usuario-texto").should("contain", usuarioMock.nombre);
        cy.get(".output-email-usuario-texto").should("contain", usuarioMock.email);
        cy.get(".imagen-perfil").should("have.attr", "src", usuarioMock.imagenPerfil);

    });


    it("Deberia mostrar recetas del usuario", () => {
        // Simular login
        cy.visit("/inicio", {
            onBeforeLoad(win) {
                win.localStorage.setItem("usuario", JSON.stringify(usuarioMock));
            }
        });

        cy.intercept("GET", "/api/recetas/usuario/123456789", {
            statusCode: 200,
            body: [
                {
                    _id: "id1",
                    titulo: "Receta 1",
                    descripcion: "Descripción de la receta 1"
                },
                {
                    _id: "id2",
                    titulo: "Receta 2",
                    descripcion: "Descripción de la receta 2"
                }
            ]
        }).as("getRecetasUsuario");

        // Ir a la página de perfil
        
        cy.visit("/perfil/123456789");

        cy.wait("@getRecetasUsuario");

        
        cy.contains("Perfil del usuario").should("be.visible");

        // Verificar que las recetas del usuario se muestran
        cy.contains("Ver recetas del usuario").should("be.visible").click();

        //Verifico que se encuentren las 2 recetas mockeadas en el panel
        cy.get(".recetas-del-usuario").within(() => {
            cy.contains("Receta 1").should("be.visible");
            cy.contains("Receta 2").should("be.visible");
        });

    });

    it("Navegacion a detalle de receta desde el panel de recetas en el perfil del usuario", () => {

        // Simular login
        cy.visit("/inicio", {
            onBeforeLoad(win) {
                win.localStorage.setItem("usuario", JSON.stringify(usuarioMock));
            }
        });

        cy.intercept("GET", "/api/recetas/usuario/123456789", {
            statusCode: 200,
            body: [
                {
                    _id: "id1",
                    titulo: "Receta 1",
                    descripcion: "Descripción de la receta 1"
                },

            ]}).as("getRecetasUsuario");

        // Ir a la página de perfil
        cy.visit("/perfil/123456789");
        cy.wait("@getRecetasUsuario");

        // Verificar que las recetas del usuario se muestran
        cy.contains("Ver recetas del usuario").should("be.visible").click();

        // Verificar que se navega al detalle de la receta al hacer click
        cy.get(".recetas-del-usuario").within(() => {
            cy.contains("Receta 1").should("be.visible").click();
        });

        // Verificar que se navega a la página de detalle de la receta
        cy.url().should("include", "/detalle-receta/receta-1/id1");
    });
        

    it("Deberia mostrar mensaje de error al no encontrar recetas del usuario", () => {
        // Simular login
        cy.visit("/inicio", {
            onBeforeLoad(win) {
                win.localStorage.setItem("usuario", JSON.stringify(usuarioMock));
            }
        }); 

        // Simular error al obtener recetas del usuario trayendio un array vacio
       cy.intercept("GET", "/api/recetas/usuario/123456789", {
            statusCode: 200,
            body: []
        }).as("getRecetasUsuarioVacio");

        // Ir a la página de perfil
        cy.visit("/perfil/123456789");
        cy.wait("@getRecetasUsuarioVacio");

        cy.get(".link-lista-recetas").should("be.visible").click();
        
        // Verificar que se muestra el mensaje de error
        cy.get(".recetas-del-usuario").contains("No tienes recetas subidas aún.").should("be.visible");
    });


    //Probar que no hay notificaciones en el perfil del usuario
    it("Deberia mostrar mensaje de no notificaciones en el perfil del usuario", () => {
        // Simular login
        cy.visit("/inicio", {
            onBeforeLoad(win) {
                win.localStorage.setItem("usuario", JSON.stringify(usuarioMock));
            }
        });

        // Ir a la página de perfil
        cy.visit("/perfil/123456789");
        // Verificar que se muestra el mensaje de que no hay notificaciones
        cy.get(".icono-notificaciones").should("be.visible").click();
        cy.get(".lista-notificaciones").contains("No tienes notificaciones.").should("be.visible");

    });


    //Probar que se muestran las notificaciones en el perfil del usuario
    it.only("Deberia mostrar notificaciones en el perfil del usuario", () => {
        // Simular login
        cy.visit("/inicio", {
            onBeforeLoad(win) {
                win.localStorage.setItem("usuario", JSON.stringify(usuarioMock));
            }
        });
        cy.intercept("GET", "**/api/notificaciones/123456789", {
            statusCode: 200,
            body: [
                {
                    _id: "notificacion1",
                    usuarioDestino: 123456789,
                    mensaje: "@usuario1 comentó en tu receta 'Receta 1'",
                    enlace: "/detalle-receta/receta-1/id1",
                    leida: false,
                }
            ]
        }).as("getNotificacionesUsuario");

        // Ir a la página de perfil
        cy.visit("/perfil/123456789");
        cy.wait("@getNotificacionesUsuario");
        // Verificar que se muestra la notificación
        cy.get(".icono-notificaciones").should("be.visible").click();
        cy.get(".lista-notificaciones").within(() => {
            cy.contains("@usuario1 comentó en tu receta 'Receta 1'").should("be.visible").click();
        });
        // Verificar que se navega al detalle de la receta al hacer click en la notificación
        cy.location("pathname").should("eq", "/detalle-receta/receta-1/id1"); 






    });

});
  