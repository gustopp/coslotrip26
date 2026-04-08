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

    function getFlag(location) {
        if (!location) return '';
        const loc = location.toUpperCase();
        let code = '';
        
        if (loc.includes('AEP') || loc.includes('EZE') || loc.includes('BUENOS AIRES')) code = 'ar';
        if (loc.includes('SCL') || loc.includes('SANTIAGO')) code = 'cl';
        if (loc.includes('MAD') || loc.includes('MADRID') || loc.includes('BCN') || loc.includes('BARCELONA')) code = 'es';
        if (loc.includes('LIS') || loc.includes('LISBOA')) code = 'pt';
        if (loc.includes('AMS') || loc.includes('AMSTERDAM')) code = 'nl';
        if (loc.includes('GRU') || loc.includes('SAO PAULO')) code = 'br';
        if (loc.includes('TOS') || loc.includes('TROMSO')) code = 'no';
        if (loc.includes('CPH') || loc.includes('COPENHAGEN')) code = 'dk';
        
        if (code) {
            return `<img src="https://flagcdn.com/w20/${code}.png" class="flag-icon" alt="${code}">`;
        }
        return '';
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
        // FIX: El content-inner necesita estar directamente bajo passenger-content
        // para que el selector CSS funcione. La clase flights-list solo agrega estilos de layout.
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

        // FIX: Copia defensiva del itinerario para evitar mutaciones cruzadas entre vuelos
        const itinerario = Array.isArray(vuelo.itinerario) ? [...vuelo.itinerario] : [];

        // FIX: Acceso defensivo con optional chaining para evitar "undefined" en el título
        const origenGeneral = itinerario[0]?.origen ?? "Desconocido";
        const destinoGeneral = itinerario[itinerario.length - 1]?.destino ?? "Desconocido";

        const header = document.createElement("div");
        header.className = "flight-header";
        header.innerHTML = `
            <div>
                <div class="flight-title">${origenGeneral} ${getFlag(origenGeneral)} &rarr; ${destinoGeneral} ${getFlag(destinoGeneral)}</div>
                <div class="flight-subtitle">${vuelo.aerolinea ?? "Aerolínea desconocida"} • ${itinerario.length} ${itinerario.length === 1 ? "tramo" : "tramos"}</div>
            </div>
            ${renderArrowIcon()}
        `;

        header.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleAccordion(card);
        });

        const content = document.createElement("div");
        content.className = "flight-content";

        const metaHtml = `
            <div class="flight-meta">
                ${vuelo.codigo_reserva_aerolinea
                ? `<span class="badge badge-highlight">Código de reserva: ${vuelo.codigo_reserva_aerolinea}</span>`
                : ''}
            </div>
        `;

        // FIX: Acceso defensivo a cada campo del tramo para evitar "undefined" en pantalla
        let stepsHtml = '';
        itinerario.forEach(tramo => {
            if (!tramo) return; // saltar tramos nulos/undefined
            const tramo_nombre = tramo.tramo ?? "—";
            const numero_vuelo = tramo.numero_vuelo ?? "—";
            const clase = tramo.clase ?? "—";
            const origen = tramo.origen ?? "—";
            const destino = tramo.destino ?? "—";
            const fecha_salida = tramo.fecha_salida ?? "—";
            const hora_salida = tramo.hora_salida ?? "—";
            const fecha_llegada = tramo.fecha_llegada ?? "—";
            const hora_llegada = tramo.hora_llegada ?? "—";

            stepsHtml += `
                <div class="itinerary-step">
                    <div class="step-title">
                        <span>Tramo: ${tramo_nombre} <span style="color:var(--text-secondary);font-size:0.85em;margin-left:8px;">${numero_vuelo}</span></span>
                        <span style="font-size: 0.85em; font-weight: 500">${clase}</span>
                    </div>
                    <div class="step-details">
                        <div class="detail-item">
                            <span class="detail-label">Origen</span>
                            <span class="detail-value">${origen} ${getFlag(origen)}</span>
                            <span style="color:var(--text-secondary);font-size:0.8rem">${fecha_salida} - ${hora_salida}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Destino</span>
                            <span class="detail-value">${destino} ${getFlag(destino)}</span>
                            <span style="color:var(--text-secondary);font-size:0.8rem">${fecha_llegada} - ${hora_llegada}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        // FIX: El content-inner del vuelo debe ser hijo directo de flight-content
        // para que el selector CSS ".expanded > .flight-content > .content-inner" funcione
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

            // FIX: Copia del array de vuelos antes de ordenar para evitar mutaciones
            // que corrompían referencias entre pasajeros con vuelos compartidos
            pasajeros.forEach(passenger => {
                if (Array.isArray(passenger.vuelos)) {
                    passenger.vuelos = [...passenger.vuelos].sort((a, b) => {
                        const dateA = a?.itinerario?.[0]?.fecha_salida ?? '';
                        const dateB = b?.itinerario?.[0]?.fecha_salida ?? '';
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