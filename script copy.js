document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("passengers-container");

    function renderArrowIcon() {
        return `
            <svg class="icon-arrow" viewBox="0 0 24 24">
                <path d="M6 9l6 6 6-6" />
            </svg>
        `;
    }

    function toggleAccordion(element) {
        element.classList.toggle("expanded");
    }

    function createPassengerCard(passenger, index) {
        const card = document.createElement("div");
        card.className = "passenger-card";
        card.style.animationDelay = `${index * 0.1}s`;

        const header = document.createElement("div");
        header.className = "passenger-header";
        header.innerHTML = `
            <div class="passenger-name">${passenger.nombre}</div>
            ${renderArrowIcon()}
        `;
        
        header.addEventListener("click", () => toggleAccordion(card));

        const content = document.createElement("div");
        content.className = "passenger-content";
        
        const contentInner = document.createElement("div");
        contentInner.className = "content-inner flights-list";

        if (passenger.vuelos && passenger.vuelos.length > 0) {
            passenger.vuelos.forEach((vuelo, vIndex) => {
                contentInner.appendChild(createFlightCard(vuelo, vIndex));
            });
        } else {
            contentInner.innerHTML = `<p style="color: var(--text-secondary)">No hay vuelos registrados para este pasajero.</p>`;
        }

        content.appendChild(contentInner);
        card.appendChild(header);
        card.appendChild(content);

        return card;
    }

    function createFlightCard(vuelo, index) {
        const card = document.createElement("div");
        card.className = "flight-card";
        
        const itinerario = vuelo.itinerario || [];
        // Determinar origen y destino general del vuelo
        const origenGeneral = itinerario.length > 0 ? itinerario[0].origen : "Desconocido";
        const destinoGeneral = itinerario.length > 0 ? itinerario[itinerario.length - 1].destino : "Desconocido";

        const header = document.createElement("div");
        header.className = "flight-header";
        header.innerHTML = `
            <div>
                <div class="flight-title">${origenGeneral} &rarr; ${destinoGeneral}</div>
                <div class="flight-subtitle">${vuelo.aerolinea} • ${itinerario.length} tramos</div>
            </div>
            ${renderArrowIcon()}
        `;

        header.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleAccordion(card);
        });

        const content = document.createElement("div");
        content.className = "flight-content";

        let metaHtml = `
            <div class="flight-meta">
                ${vuelo.codigo_reserva_aerolinea ? `<span class="badge badge-highlight">Código de reserva: ${vuelo.codigo_reserva_aerolinea}</span>` : ''}
            </div>
        `;

        let stepsHtml = '';
        itinerario.forEach(tramo => {
            stepsHtml += `
                <div class="itinerary-step">
                    <div class="step-title">
                        <span>Tramo: ${tramo.tramo} <span style="color:var(--text-secondary);font-size:0.85em;margin-left:8px;">${tramo.numero_vuelo}</span></span>
                        <span style="font-size: 0.85em; font-weight: 500">${tramo.clase}</span>
                    </div>
                    <div class="step-details">
                        <div class="detail-item">
                            <span class="detail-label">Origen</span>
                            <span class="detail-value">${tramo.origen}</span>
                            <span style="color:var(--text-secondary);font-size:0.8rem">${tramo.fecha_salida} - ${tramo.hora_salida}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Destino</span>
                            <span class="detail-value">${tramo.destino}</span>
                            <span style="color:var(--text-secondary);font-size:0.8rem">${tramo.fecha_llegada} - ${tramo.hora_llegada}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        const contentInner = document.createElement("div");
        contentInner.className = "content-inner";
        contentInner.innerHTML = metaHtml + stepsHtml;

        content.appendChild(contentInner);
        card.appendChild(header);
        card.appendChild(content);

        return card;
    }

    function renderError(message) {
        container.innerHTML = `
            <div class="error">
                <h3>Error al cargar los datos</h3>
                <p>${message}</p>
                <p style="margin-top: 1rem; font-size: 0.9em; opacity: 0.8;">
                    Nota: si abriste este archivo directamente en el navegador, 
                    necesitas usar un servidor local (Ej. Live Server en VSCode) 
                    para evitar el bloqueo por políticas de CORS.
                </p>
            </div>
        `;
    }

    // Fetch and render data
    fetch(`vuelos.json?nocache=${new Date().getTime()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP error " + response.status);
            }
            return response.json();
        })
        .then(data => {
            container.innerHTML = "";
            const pasajeros = data.pasajeros || [];
            
            if (pasajeros.length === 0) {
                container.innerHTML = `<p style="text-align:center; color: var(--text-secondary)">No se encontraron pasajeros.</p>`;
                return;
            }

            // Ordenar pasajeros alfabéticamente por nombre
            pasajeros.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

            // Ordenar vuelos de cada pasajero por fecha del primer tramo
            pasajeros.forEach(passenger => {
                if (passenger.vuelos) {
                    passenger.vuelos.sort((a, b) => {
                        const dateA = a.itinerario && a.itinerario[0] ? a.itinerario[0].fecha_salida : '';
                        const dateB = b.itinerario && b.itinerario[0] ? b.itinerario[0].fecha_salida : '';
                        return dateA.localeCompare(dateB);
                    });
                }
            });

            pasajeros.forEach((passenger, index) => {
                const card = createPassengerCard(passenger, index);
                container.appendChild(card);
            });
        })
        .catch(error => {
            console.error("Error cargando vuelos.json:", error);
            renderError(error.message);
        });
});
