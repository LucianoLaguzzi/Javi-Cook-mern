describe("Flujo de recetas", () => {

    it("Muestra recetas correctamente en el listado", () => {
        cy.visit("/inicio");

        cy.get("#recetas .tarjeta-receta")
            .should("have.length.greaterThan", 0);

        cy.get("#recetas .tarjeta-receta").first().within(() => {

            cy.get("h2").should("not.be.empty");
            cy.contains("Categoría").should("be.visible");
            cy.contains("Tiempo de preparación").should("be.visible");

            cy.get("img").should("be.visible").and(($img) => {
                expect($img[0].naturalWidth).to.be.greaterThan(0);
            });

            cy.contains("Ver más").should("be.visible");
        });
    });


    it("Permite navegar al detalle de una receta", () => {
        cy.visit("/inicio");

        cy.get("#recetas .tarjeta-receta")
            .first()
            .within(() => {
            cy.contains("Ver más").click();
            });

        cy.url().should("include", "/detalle-receta");

        cy.contains("Detalles de la receta").should("be.visible");

        cy.get(".panel-img").should("be.visible").and(($img) => {
            expect($img[0].naturalWidth).to.be.greaterThan(0);
        });
    });




    it("Muestra mensaje cuando no hay recetas", () => {
        cy.intercept("GET", "**/api/recetas",{
            statusCode:200,
            body: []
        }).as("getRecetas");

        cy.visit("/inicio");

        cy.wait("@getRecetas");

        cy.contains("Aún no tienes recetas").should("be.visible");
    });


    it("Muestra correctamente la valoración promedio en las tarjetas", () => {

        cy.intercept("GET", "**/api/recetas", {
            statusCode: 200,
            body: [
                {
                    _id: "1",
                    titulo: "Receta test",
                    ingredientes: ["ingrediente"],
                    imagen: "https://res.cloudinary.com/dzaqvpxqk/image/upload/v1773853635/recetas/ux6fcesvzxl3scqe0hmy.jpg",
                    usuario: { _id: "1", nombre: "test" },
                    categoria: "Postre",
                    tiempoPreparacion: 10,
                    dificultad: "Fácil",
                    valoracion: 3
                }
            ]
        }).as("getRecetas");

        cy.visit("/inicio");

        cy.wait("@getRecetas");

        cy.get("#recetas .tarjeta-receta").first().within(() => {

            cy.get(".estrellas .fas.fa-star").should("have.length", 3);
            cy.get(".estrellas .far.fa-star").should("have.length", 2);

        });
    });



    it("Muestra correctamente los detalles de una receta", () => {
         cy.visit("/inicio");

        cy.get("#recetas .tarjeta-receta")
            .first()
            .within(() => {
            cy.contains("Ver más").click();
            });

        cy.url().should("include", "/detalle-receta");

        cy.get("#imagen-receta-preview").should("be.visible").and(($img) => {
            expect($img[0].naturalWidth).to.be.greaterThan(0);
        });

        cy.get(".detalles-titulo").should("not.be.empty");
        cy.get(".detalles-categoria").should("not.be.empty");
        cy.get(".detalles-tiempo-dificultad").should("not.be.empty");
        cy.get(".detalles-cantidades").should("not.be.empty");
        cy.get(".detalles-pasos").should("not.be.empty");

    });


    
    it("Simular usuario y mostrar elementos del dom ", () => {

        // Simular logueo de usuario para que se muestren los botones de crear receta, agregar a favoritos, que se muestre en la seccion y valorar receta
        cy.intercept("GET", "**/favoritos", {
            statusCode: 200,
            body: []
        }).as("getFavs");

        cy.intercept("POST", "**/favoritos", {
            statusCode: 200,
            body: { ok: true }
        }).as("postFav");

        
        cy.intercept("GET", "**/api/valoraciones/**", {
            statusCode: 200,
            body: { valoracionUsuario: 3 }
        }).as("getValoracion");


        cy.visit("/inicio", {
            onBeforeLoad(win) {
                win.localStorage.setItem("usuario", JSON.stringify({
                    _id: "123456789",
                    nombre: "test",
                    email: "test@test.com",
                }));
            }
        });

        cy.wait("@getFavs");

        cy.get(".add-recipe-btn").should("be.visible");
        
        cy.get("#recetas .tarjeta-receta").first().within(() => {
            cy.get(".icono-favorito").should("be.visible").click();
        });

        cy.wait("@postFav");
    
        cy.get("#favoritos .tarjeta-receta")
        .should("have.length.greaterThan", 0);

        cy.get(".mensaje-no-recetas-favoritas")
        .should("not.exist");

        //Verificar que el corazón cambió a estado "favorito" y que el boton de ver más lleva al detalle de la receta
         cy.get("#recetas .tarjeta-receta").first().within(() => {
            cy.get(".icono-favorito").should("have.class", "favorito");
            cy.contains("Ver más").should("be.visible").click();
            cy.url().should("include", "/detalle-receta");
        });


        // esperar valoración
        cy.wait("@getValoracion");

        // validar estrellas del usuario
        cy.get(".detalles-valoracion i")
        .should("have.length", 5);

        cy.get(".detalles-valoracion .fas.fa-star")
        .should("have.length", 3);

        cy.get(".detalles-valoracion .far.fa-star")
        .should("have.length", 2);


        //  botón volver
        cy.contains("Ver otras recetas").click();

        cy.url().should("include", "/inicio");
    });


    it("Permite cerrar sesión correctamente", () => {

        cy.intercept("GET", "**/favoritos", {
             statusCode: 200, body: [] 
        }).as("getFavs");

        cy.visit("/inicio", {
            onBeforeLoad(win) {
                win.localStorage.setItem("usuario", JSON.stringify({
                    _id: "123456789",
                    nombre: "test",
                    email: "test@test.com",
                }));
            }
        });

        // Verificar que está logueado
        cy.get(".add-recipe-btn").should("be.visible");

        // Click en logout
        cy.get(".img-cerrar-sesion").click();

        // Verificar que se deslogueó
        cy.get(".add-recipe-btn").should("not.exist");

        cy.url().should("include", "/login");

        // Opcional (mejor aún)
        cy.window().then((win) => {
            expect(win.localStorage.getItem("usuario")).to.be.null;
        });

    });

    it("Permite crear una nueva receta", () => {

        //  MOCK CLOUDINARY
        cy.intercept(
            {
                method: "POST",
                url: "**/image/upload"
            },
            {
                statusCode: 200,
                body: {
                secure_url: "https://fake-image-url.com/test.jpg"
                }
            }
        ).as("uploadImage");

        cy.intercept("POST", "**/api/recetas", {
            statusCode: 201,
            body: { ok: true, 
                receta: { 
                    _id: "1a2b3c4d5e6f",
                    titulo: "Mocking de prueba",
                    ingredientesCantidades: ["sal: 20gr, harina:200gr, Agua: 250cc"],
                    categoria: "Postre",
                    tiempoPreparacion: 30,
                    dificultad: "Intermedio",
                    ingredientes: ["carne, pan, lechuga, tomate, morron, zanhaoria"],
                    pasos: ["Este es el paso 1", "Este es el paso 2, Paso 3, Paso 4"],
                    imagen: "https://fake-image.com/test.jpg",
                    imagenesPasos:[null, null, null, null],
                    usuario: {
                        _id: "123456789",
                        nombre: "test",
                    },
                    valoracion: 0,
                    comentarios: [],
                    fecha: "2026-03-17T15:48:43.252+00:00",
                    createdAt: "2026-03-17T15:48:43.265+00:00",
                    updatedAt: "2026-03-26T19:34:07.370+00:00"
                    

                } 
            }
        }).as("postReceta");


        cy.visit("/inicio", {
            onBeforeLoad(win) {
                win.localStorage.setItem("usuario", JSON.stringify({
                    _id: "123456789",
                    nombre: "test",
                    email: "test@test.com",
                }));
            }
        });

        

        cy.get(".add-recipe-btn").should("be.visible").click();
        cy.url().should("include", "/crear-receta");
        cy.get("#titulo-r").type("Mocking de prueba");
        cy.get("#cantidadIngrediente").type("sal: 20gr\n harina:200gr \n Agua: 250cc");

        cy.get(".input-imagen ").selectFile("cypress/fixtures/Torta.jpg", { force: true });

        cy.get(".imagen-preview.visible").should("exist");


        cy.get("#paso1").type("Este es el paso 1");
        cy.get("#btnAgregarPaso").click();
        cy.get("#paso2").type("Este es el paso 2");
        cy.get("#btnAgregarPaso").click();
        cy.get("#paso3").type("Paso 3");
        cy.get("#btnAgregarPaso").click();
        cy.get("#paso4").type("Paso 4");
        cy.get("#dificultad").select("Intermedio");
        cy.get("#categoria").select("Postre");
        cy.get("#tiempoPreparacion").type("30");
        cy.get("#ingredientesInput").type("carne, pan, lechuga, tomate, morron, zanhaoria");
        
        cy.get(".btn-guardar-receta").click();

        cy.wait("@postReceta").then((interception) => {
            // validar response
            expect(interception.response.statusCode).to.eq(201);


            const body = interception.request.body;
            //Verificar que el título enviado en la petición es el correcto
            expect(body).to.include("Mocking de prueba");
            expect(body).to.contain("Postre");
            expect(body).to.contain("Intermedio");
            expect(body).to.contain("30");
        });


        cy.url().should("include", "/inicio");
        cy.get(".add-recipe-btn").should("be.visible");
        

    })


    it("Verificar que el formulario de creación de receta muestra errores de validación", () => {

        cy.visit("/crear-receta", {
            onBeforeLoad(win) {
                win.localStorage.setItem("usuario", JSON.stringify({
                    _id: "123456789",
                    nombre: "test",
                    email: "test@test.com",
                }));
            },
        });
        cy.contains("Agregar nueva receta");

        cy.get(".btn-guardar-receta").click();

        cy.get("#modalErrorTitulo").should("contain", "Por favor, ingrese el nombre de la receta");
        cy.get("#modalErrorIngredientesCantidades").should("contain", "Por favor, ingrese ingredientes y cantidades");
        cy.get("#modalErrorPasos").should("contain", "Por favor, ingrese pasos de la receta");
        cy.get("#modalErrorImagen").should("contain", "Por favor, ingrese una imagen de la receta");
        cy.get("#modalErrorDificultad").should("contain", "Por favor, seleccione dificultad");
        cy.get("#modalErrorCategoria").should("contain", "Por favor, seleccione categoria");
        cy.get("#modalErrorTiempoPreparacion").should("contain", "Por favor, coloque tiempo de preparación");
        cy.get("#modalErrorIngredientes").should("contain", "Por favor, inserte ingredientes de la receta");
        
    });


    it("Prueba seleccionar receta random en categoria que no existen recetas creadas aún", () => {

        cy.intercept("GET", "**/api/recetas/random/Postre", {
            statusCode: 200,
            body: {}
        }).as("getRandomReceta");

        cy.visit("/inicio");

        cy.get(".dropdown").trigger("mouseover");
        cy.contains("Postre").click();

        cy.wait("@getRandomReceta");

        cy.contains("No hay recetas disponibles en esta categoría.").should("be.visible");
        cy.contains("button", "Entendido").click();
    })

    it("Prueba seleccionar receta random en categoria existente y que muestre los detalles de la receta", () => {

       cy.intercept("GET", "**/api/recetas/random/Almuerzo%2FCena", {
            statusCode: 200,
            body: { _id: "abc123", titulo: "Receta random" }
        }).as("getRandom");

        cy.intercept("GET", "**/api/detalles/abc123", {
            statusCode: 200,
            body: {
                _id: "abc123",
                titulo: "Receta random",
                categoria: "Almuerzo/Cena",
                tiempoPreparacion: 30,
                dificultad: "Intermedio",
                imagen: "https://res.cloudinary.com/dzaqvpxqk/image/upload/v1773853635/recetas/ux6fcesvzxl3scqe0hmy.jpg",
                ingredientes: ["carne, pan, lechuga, tomate, morron, zanhaoria"],
                ingredientesCantidades: ["sal: 20gr \n harina:200gr \n Agua: 250cc"],
                pasos: ["Este es el paso 1", "Este es el paso 2" , "Tercer paso" ,  "Cuarto y ultimo paso"],
                usuario: {
                    _id: "123456789",
                    nombre: "test",
                },
                fecha:"2026-02-20T20:05:32.558+00:00",
                comentarios: [{
                    _id: "comentario1",
                    usuario: {
                        _id: "user1",
                        nombre: "Usuario 1",
                        imagenPerfil: "https://res.cloudinary.com/dzaqvpxqk/image/upload/v1773853635/recetas/ux6fcesvzxl3scqe0hmy.jpg"
                    },
                    comentario: "¡Excelente receta! Me encantó el sabor y la facilidad de preparación.",
                    fecha: "2026-02-21T15:30:00.000+00:00"
                }],
        
            }
        }).as("getDetalles");


        cy.visit("/inicio");

        cy.get(".dropdown").trigger("mouseover");
        cy.contains("Almuerzo/Cena").click();

        cy.wait("@getRandom");

        cy.wait("@getDetalles");    

        cy.url().should("include", "/detalle-receta/receta-random/abc123");

        cy.get(".detalles-titulo").should("contain", "Receta random");

        cy.get(".detalles-categoria span").should("contain", "Almuerzo/Cena");

        cy.get("#imagen-receta-preview").should("be.visible").and(($img) => {
            expect($img[0].naturalWidth).to.be.greaterThan(0);
        });

        cy.get(".detalles-pasos").should("contain", "Este es el paso 1");

        cy.get(".detalles-cantidades").should("contain", "Sal:20gr");


    })

    it("Verificar correcto funcionamiento del boton de compartir receta", () => {

         cy.intercept("GET", "**/api/detalles/abc123", {
            statusCode: 200,
            body: {
                _id: "abc123",
                titulo: "Receta random",
                categoria: "Almuerzo/Cena",
                tiempoPreparacion: 30,
                dificultad: "Intermedio",
                imagen: "https://res.cloudinary.com/dzaqvpxqk/image/upload/v1773853635/recetas/ux6fcesvzxl3scqe0hmy.jpg",
                ingredientes: ["carne, pan, lechuga, tomate, morron, zanhaoria"],
                ingredientesCantidades: ["sal: 20gr \n harina:200gr \n Agua: 250cc"],
                pasos: ["Paso 1", "Paso 2"],
                usuario: {
                    _id: "123456789",
                    nombre: "test",
                },
                fecha:"2026-02-20T20:05:32.558+00:00",
        
            }
        }).as("getDetalles");

        cy.visit("/detalle-receta/receta-random/abc123");

        cy.wait("@getDetalles");

        cy.window().then((win) => {
            cy.stub(win.navigator.clipboard, "writeText").as("copy");
        });

        cy.contains("Compartir receta").should("be.visible").click();

        cy.contains("Enlace copiado").should("be.visible");

        cy.location("href").then((currentUrl) => {
            cy.get("@copy").should("have.been.calledWith", currentUrl);
        });



    })

    it("Elimina una receta y verifica que ya no aparece en el listado", () => {

        cy.intercept("GET", "**/api/detalles/receta1", {
            statusCode: 200,
            body: {
                _id: "receta1",
                titulo: "Receta a eliminar",
                categoria: "Almuerzo/Cena",
                tiempoPreparacion: 10,
                dificultad: "Intermedio",
                imagen: "https://res.cloudinary.com/dzaqvpxqk/image/upload/v1773853635/recetas/ux6fcesvzxl3scqe0hmy.jpg",
                ingredientes: ["carne, pan, lechuga, tomate, morron, zanhaoria"],
                ingredientesCantidades: ["sal: 20gr \n harina:200gr \n Agua: 250cc"],
                pasos: ["Paso 1", "Paso 2"],
                usuario: {
                    _id: "123456789",
                    nombre: "test",
                },
                fecha:"2026-02-20T20:05:32.558+00:00",
                valoracion: 3,
                 comentarios: [],
                    fecha: "2026-03-17T15:48:43.252+00:00",
                    createdAt: "2026-03-17T15:48:43.265+00:00",
                    updatedAt: "2026-03-26T19:34:07.370+00:00"
            }
        }).as("getRecetas");

        cy.intercept("DELETE", "**/api/recetas/receta1", {
            statusCode: 200,
            body: { ok: true }
        }).as("deleteReceta");

         cy.intercept("GET", "**/api/valoraciones/**", {
            statusCode: 200,
            body: { valoracionUsuario: 3 }
        }).as("getValoracion");

        cy.visit("/inicio", {
            onBeforeLoad(win) {
                win.localStorage.setItem("usuario", JSON.stringify({
                _id: "123456789",
                nombre: "test",
                email: "test@example.com"
                }));
            }
        });

        cy.contains("Nueva receta").should("be.visible");

        cy.visit("/detalle-receta/receta-a-eliminar/receta1", {
            onBeforeLoad(win) {
                win.localStorage.setItem("usuario", JSON.stringify({
                _id: "123456789",
                nombre: "test",
                email: "test@example.com"
                }));
            }
        });


        cy.window().then((win) => {
            console.log("LOCAL STORAGE:", win.localStorage.getItem("usuario"));
        });

        cy.wait("@getRecetas");

        cy.wait("@getValoracion");


        cy.url().should("include", "/detalle-receta/receta-a-eliminar/receta1");

        cy.get(".link-eliminar-receta").should("be.visible").click();
        cy.contains("¿Estás seguro? ¡No podrás revertir esto!").should("be.visible");
        cy.get(".boton-confirmar-verde").should("be.visible").click();
        cy.contains("La receta ha sido eliminada con éxito.").should("be.visible");
        cy.get(".boton-confirmar-verde").should("be.visible").click();

        cy.wait("@deleteReceta");

        cy.url().should("include", "/inicio");


    });


    it("Verificar correcto funcionamiento del filtro de búsqueda por título o ingredientes", () => {
        cy.intercept("GET", "**/api/recetas", {
            statusCode: 200,
            body: [
                {
                    _id: "1",
                    titulo: "Torta de frutilla",
                    ingredientes: ["frutilla, harina, azucar"],
                    imagen: "https://res.cloudinary.com/dzaqvpxqk/image/upload/v1773853635/recetas/ux6fcesvzxl3scqe0hmy.jpg",
                    usuario: {
                        _id: "123456789",
                        nombre: "test",
                    },
                    categoria: "Postre",
                    tiempoPreparacion: 45,
                    dificultad: "Difícil",
                },
                {
                    _id: "2",
                    titulo: "Hamburguesa",
                    ingredientes: ["carne, pan, lechuga"],
                    imagen: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
                    usuario: {
                        _id: "123456789",
                        nombre: "test",
                    },
                    categoria: "Almuerzo/Cena",
                    tiempoPreparacion: 10,
                    dificultad: "Intermedio",
                }
            ]
        }).as("getRecetas");

        cy.visit("/inicio", {
            onBeforeLoad(win) {
                win.localStorage.setItem("usuario", JSON.stringify({
                _id: "123456789",
                nombre: "test",
                email: "test@example.com"
                }));
            }
        });

        cy.wait("@getRecetas");

        cy.get("#recetas .tarjeta-receta").should("have.length", 2);

        cy.get(".text-filtro").type("Torta");

        cy.get("#recetas .tarjeta-receta").should("have.length", 1).first().within(() => {
            cy.get("h2").should("contain", "Torta de frutilla");
        });

        cy.get("#recetas .tarjeta-receta").contains("Hamburguesa").should("not.exist");

        cy.get(".text-filtro").clear().type("fakeingrediente");
        
        cy.get("#recetas .tarjeta-receta").should("have.length", 0);
        cy.contains("No se encontraron recetas con esos ingredientes.").should("be.visible");

        cy.get(".text-filtro").clear();

        cy.get(".text-filtro").type("carne");
        cy.get("#recetas .tarjeta-receta").should("have.length", 1).first().within(() => {
            cy.get("h2").should("contain", "Hamburguesa");
        });


        cy.get(".text-filtro").clear().type("frutilla harina");

        cy.get("#recetas .tarjeta-receta")
        .should("have.length", 1)
        .first()
        .within(() => {
            cy.get("h2").should("contain", "Torta de frutilla");
        });


    });


    it("Deberia permitir editar una receta desde el detalle", () => {

        const usuarioMock = {
            _id: "123456789",
            nombre: "test",
            email: "test@test.com",
        };

        // Mock GET detalle inicial
        cy.intercept("GET", "**/api/detalles/id1", {
            statusCode: 200,
            body: {
                _id: "id1",
                titulo: "Receta 1",
                categoria: "Postre",
                dificultad: "Intermedio",
                ingredientes: ["harina", "agua"],
                pasos: ["Paso 1"],
                ingredientesCantidades: ["harina: 100g"],
                usuario: { 
                    _id: usuarioMock._id,
                    nombre: usuarioMock.nombre,
                    email: usuarioMock.email,
                },
                valoracion: 0,
                comentarios: [],
                imagen: "/images/default-imagen-perfil.jpg",
                fecha: "2026-06-16T20:05:32.558+00:00",
                 createdAt: "2026-06-16T20:05:32.558+00:00",
                 updatedAt: "2026-06-16T20:05:32.558+00:00",
            }
        }).as("getDetalleReceta");

        // Mock PUT edición
        cy.intercept("PUT", "**/api/recetas/id1/titulo", {
            statusCode: 200,
            body: {
                ok: true,
                receta: {
                    _id: "id1",
                    titulo: "Receta Editada"
                }
            }
        }).as("updateReceta");

        // Mock valoraciones
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

        // Ir al detalle
        cy.visit("/detalle-receta/receta-1/id1");

        cy.wait("@getDetalleReceta");

        // Activar modo edición en el titulo de la receta
        cy.get(".btn-editar-titulo").should("be.visible").click();

        // Editar título
        cy.get(".nuevo-titulo").clear().type("Receta Editada");

        // Guardar cambios
        cy.get(".btn-guardar-titulo").click();

        // Verificar request PUT
        cy.wait("@updateReceta").then((interception) => {
            expect(interception.response.statusCode).to.eq(200);

            const body = interception.request.body;
             
            //ver que body sea un json y no un string
            //console.log("El body es", body);

            //como es un json, verificar que tenga la propiedad titulo con el valor "Receta Editada"
            expect(body).to.have.property("titulo", "Receta Editada");


        });

        // Verificar UI actualizada
        cy.contains("Receta Editada").should("be.visible");
    });






});


