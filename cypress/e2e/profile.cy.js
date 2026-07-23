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

        //Intercept necesario para mostrar el detalle de la receta al hacer click en la receta mockeada
        cy.intercept("GET", "/api/detalles/id1", {
            statusCode: 200,
            body: {
                _id: "id1",
                titulo: "Receta 1",
                ingredientesCantidades: [],
                pasos: [],
                comentarios: [],
                usuario: {
                    _id: usuarioMock._id,
                    nombre: usuarioMock.nombre,
                    email: usuarioMock.email,
                }
            }
        }).as("getDetalleReceta");

        cy.intercept("GET", "**/api/valoraciones/**", {
            statusCode: 200,
            body: {
                valoracionUsuario: 0
            }
        }).as("getValoracion");



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

        cy.wait("@getDetalleReceta");

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
    it("Deberia mostrar notificaciones en el perfil del usuario", () => {
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
        cy.location("pathname").should("include", "/detalle-receta");
    });



    it("Deberia navegar al detalle y mostrar la receta", () => {

        // Simular click en una receta del usuario
        cy.intercept("GET", "**/api/recetas/usuario/123456789", {
            statusCode: 200,
            body: [
                {
                    _id: "id1",
                    titulo: "Receta 1",
                    categoria: "Veggie",
                    dificultad: "Intermedia",
                    ingredientes: ["Ingrediente 1", "Ingrediente 2"],
                    pasos: ["Paso 1", "Paso 2"],
                    descripcion: "Descripción de la receta 1",
                    usuario:usuarioMock._id,
                    valoracion:0,
                    ingredientesCantidades: ["Ingrediente 1:100g \n Ingrediente 2: 200g"],
                },
            ]
        }).as("getRecetasUsuario");

        cy.intercept("GET", "**/api/detalles/id1", {
            statusCode: 200,
            body: {
                _id: "id1",
                titulo: "Receta 1",
                categoria: "Veggie",
                dificultad: "Intermedio",
                ingredientes: ["Ingrediente 1", "Ingrediente 2"],
                pasos: ["Paso 1", "Paso 2"],
                usuario:{
                        _id: usuarioMock._id,
                        nombre: usuarioMock.nombre,
                        email: usuarioMock.email,
                },
                valoracion:0,
                tiempoPreparacion: 30,
                ingredientesCantidades: ["Ingrediente 1:100g \n Ingrediente 2: 200g"],
                comentarios: [],
                imagen: "/images/default-imagen-perfil.jpg",
            }
        }).as("getDetalleReceta");

        
        cy.intercept("GET", "**/api/valoraciones/**", {
            statusCode: 200,
            body: { valoracionUsuario: 0 }
        }).as("getValoracion");

        // Simular login
        cy.visit("/inicio", {
            onBeforeLoad(win) {
                win.localStorage.setItem("usuario", JSON.stringify(usuarioMock));
            }
        });

        // Ir a la página de perfil
        cy.visit("/perfil/123456789");

        cy.wait("@getRecetasUsuario");

        cy.contains("Ver recetas del usuario").should("be.visible").click();

        cy.get(".recetas-del-usuario").within(() => {
            cy.contains("Receta 1").should("be.visible").click();
        });

        cy.wait("@getDetalleReceta");

        // Verificar que se navega a la página de detalle de la receta
        cy.url().should("include", "/detalle-receta/receta-1/id1");
        // Verificar que se muestra el título y descripción de la receta
        cy.contains("Receta ").should("be.visible");
       
    });


    it("Deberia permitir editar el perfil del usuario", () => {

        // Simular login
        cy.visit("/inicio", {
            onBeforeLoad(win) {
                win.localStorage.setItem("usuario", JSON.stringify(usuarioMock));
            }
        });

        cy.intercept("PUT", "**/api/usuarios/actualizarPerfil/123456789", (req) => {
            req.reply({
                statusCode: 200,
                body: req.body
            });
        }).as("putUsuario");


        // Ir a la página de perfil
        cy.visit("/perfil/usuarioMock._id");

        cy.get(".output-nombre-usuario-texto").should("contain", usuarioMock.nombre);
        cy.get(".output-email-usuario-texto").should("contain", usuarioMock.email);

        cy.get(".btn-editar-user").should("be.visible").click();
        cy.get(".input-nuevo-nombre").should("be.visible").clear().type("NuevoNombre");

        cy.get(".btn-guardar-icon").should("be.visible").click();

        cy.contains("OK").should("be.visible").click();
        
        cy.wait("@putUsuario").then(({ request }) => {
            expect(request.body.nombre).to.eq("NuevoNombre");
        });


        cy.get(".btn-editar-email").should("be.visible").click();
        cy.get(".input-nuevo-email").should("be.visible").clear().type("nuevoemail@example.com");

        cy.get(".btn-guardar-icon").should("be.visible").click();

        cy.contains("OK").should("be.visible").click();

        cy.wait("@putUsuario").then(({ request }) => {
            expect(request.body.email).to.eq("nuevoemail@example.com");
            expect(request.body.nombre).to.eq("NuevoNombre");
        });

    });

});
  