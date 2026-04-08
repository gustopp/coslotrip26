// ─────────────────────────────────────────────
//  Global state
// ─────────────────────────────────────────────
let allData = null;
let currentMode = 'passenger';

window.setMode = function (mode) {
    currentMode = mode;
    document.getElementById('btn-by-passenger').classList.toggle('active', mode === 'passenger');
    document.getElementById('btn-by-flight').classList.toggle('active', mode === 'flight');
    if (allData) renderAll();
};

// ─────────────────────────────────────────────
//  Shared helpers
// ─────────────────────────────────────────────
function renderArrowIcon() {
    return `
        <svg class="icon-arrow" viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6" />
        </svg>
    `;
}

function toggleAccordion(element) {
    element.classList.toggle('expanded');
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

// ─────────────────────────────────────────────
//  MODE 1: Por Pasajero
// ─────────────────────────────────────────────
function createFlightCard(vuelo) {
    const card = document.createElement('div');
    card.className = 'flight-card';

    const itinerario = Array.isArray(vuelo.itinerario) ? [...vuelo.itinerario] : [];
    const origenGeneral = itinerario[0]?.origen ?? 'Desconocido';
    const destinoGeneral = itinerario[itinerario.length - 1]?.destino ?? 'Desconocido';

    const header = document.createElement('div');
    header.className = 'flight-header';
    header.innerHTML = `
        <div>
            <div class="flight-title">${origenGeneral} ${getFlag(origenGeneral)} &rarr; ${destinoGeneral} ${getFlag(destinoGeneral)}</div>
            <div class="flight-subtitle">${vuelo.aerolinea ?? 'Aerolínea desconocida'} &bull; ${itinerario.length} ${itinerario.length === 1 ? 'tramo' : 'tramos'}</div>
        </div>
        ${renderArrowIcon()}
    `;

    header.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAccordion(card);
    });

    const content = document.createElement('div');
    content.className = 'flight-content';

    const metaHtml = `
        <div class="flight-meta">
            ${vuelo.codigo_reserva_aerolinea
            ? `<span class="badge badge-highlight">Código de reserva: ${vuelo.codigo_reserva_aerolinea}</span>`
            : ''}
        </div>
    `;

    let stepsHtml = '';
    itinerario.forEach(tramo => {
        if (!tramo) return;
        const tramo_nombre = tramo.tramo ?? '—';
        const numero_vuelo = tramo.numero_vuelo ?? '—';
        const clase = tramo.clase ?? '—';
        const origen = tramo.origen ?? '—';
        const destino = tramo.destino ?? '—';
        const fecha_salida = tramo.fecha_salida ?? '—';
        const hora_salida = tramo.hora_salida ?? '—';
        const fecha_llegada = tramo.fecha_llegada ?? '—';
        const hora_llegada = tramo.hora_llegada ?? '—';

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

    const contentInner = document.createElement('div');
    contentInner.className = 'content-inner';
    contentInner.innerHTML = metaHtml + stepsHtml;

    content.appendChild(contentInner);
    card.appendChild(header);
    card.appendChild(content);

    return card;
}

function createPassengerCard(passenger, index) {
    const card = document.createElement('div');
    card.className = 'passenger-card';
    card.style.animationDelay = `${index * 0.07}s`;

    const header = document.createElement('div');
    header.className = 'passenger-header';
    header.innerHTML = `
        <div class="passenger-name">${passenger.nombre}</div>
        ${renderArrowIcon()}
    `;

    header.addEventListener('click', () => toggleAccordion(card));

    const content = document.createElement('div');
    content.className = 'passenger-content';

    const contentInner = document.createElement('div');
    contentInner.className = 'content-inner flights-list';

    if (passenger.vuelos && passenger.vuelos.length > 0) {
        passenger.vuelos.forEach(vuelo => {
            contentInner.appendChild(createFlightCard(vuelo));
        });
    } else {
        contentInner.innerHTML = `<p style="color: var(--text-secondary)">No hay vuelos registrados para este pasajero.</p>`;
    }

    content.appendChild(contentInner);
    card.appendChild(header);
    card.appendChild(content);

    return card;
}

function renderByPassenger(pasajeros) {
    const container = document.getElementById('passengers-container');
    container.innerHTML = '';

    const sorted = [...pasajeros].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    sorted.forEach(passenger => {
        if (Array.isArray(passenger.vuelos)) {
            passenger.vuelos = [...passenger.vuelos].sort((a, b) => {
                const dateA = a?.itinerario?.[0]?.fecha_salida ?? '';
                const dateB = b?.itinerario?.[0]?.fecha_salida ?? '';
                return dateA.localeCompare(dateB);
            });
        }
    });

    sorted.forEach((passenger, index) => {
        container.appendChild(createPassengerCard(passenger, index));
    });
}

// ─────────────────────────────────────────────
//  MODE 2: Por Vuelo
// ─────────────────────────────────────────────
function buildFlightIndex(pasajeros) {
    // Structure: { "Origen → Destino": { "reservaCode": { vuelo, passengers[] } } }
    const index = {};

    pasajeros.forEach(passenger => {
        if (!Array.isArray(passenger.vuelos)) return;

        passenger.vuelos.forEach(vuelo => {
            const itinerario = Array.isArray(vuelo.itinerario) ? vuelo.itinerario : [];
            const origen = itinerario[0]?.origen ?? 'Desconocido';
            const destino = itinerario[itinerario.length - 1]?.destino ?? 'Desconocido';
            const routeKey = `${origen}|||${destino}`;
            const flightKey = vuelo.codigo_reserva_aerolinea ?? `${vuelo.aerolinea}__${routeKey}`;

            if (!index[routeKey]) index[routeKey] = {};
            if (!index[routeKey][flightKey]) {
                index[routeKey][flightKey] = { vuelo, passengers: [] };
            }
            index[routeKey][flightKey].passengers.push(passenger.nombre);
        });
    });

    return index;
}

function createFlightGroupCard(flightKey, { vuelo, passengers }) {
    const card = document.createElement('div');
    card.className = 'flight-group-card';

    const itinerario = Array.isArray(vuelo.itinerario) ? vuelo.itinerario : [];
    const firstDate = itinerario[0]?.fecha_salida ?? '';

    const header = document.createElement('div');
    header.className = 'flight-group-header';
    header.innerHTML = `
        <div>
            <div class="flight-group-title">
                ${vuelo.aerolinea ?? 'Aerolínea desconocida'}
                ${vuelo.codigo_reserva_aerolinea
                    ? `<span style="margin-left:0.5rem;" class="badge badge-highlight">Cód. reserva: ${vuelo.codigo_reserva_aerolinea}</span>`
                    : ''}
            </div>
            <div class="flight-group-subtitle">
                ${firstDate ? `Salida: ${firstDate} &bull;` : ''} ${passengers.length} pasajero${passengers.length !== 1 ? 's' : ''}
            </div>
        </div>
        ${renderArrowIcon()}
    `;

    header.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAccordion(card);
    });

    const content = document.createElement('div');
    content.className = 'flight-content';

    const contentInner = document.createElement('div');
    contentInner.className = 'content-inner';

    // Itinerary details
    let stepsHtml = '';
    itinerario.forEach(tramo => {
        if (!tramo) return;
        stepsHtml += `
            <div class="itinerary-step">
                <div class="step-title">
                    <span>Tramo: ${tramo.tramo ?? '—'} <span style="color:var(--text-secondary);font-size:0.85em;margin-left:8px;">${tramo.numero_vuelo ?? '—'}</span></span>
                    <span style="font-size: 0.85em; font-weight: 500">${tramo.clase ?? '—'}</span>
                </div>
                <div class="step-details">
                    <div class="detail-item">
                        <span class="detail-label">Origen</span>
                        <span class="detail-value">${tramo.origen ?? '—'} ${getFlag(tramo.origen)}</span>
                        <span style="color:var(--text-secondary);font-size:0.8rem">${tramo.fecha_salida ?? '—'} - ${tramo.hora_salida ?? '—'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Destino</span>
                        <span class="detail-value">${tramo.destino ?? '—'} ${getFlag(tramo.destino)}</span>
                        <span style="color:var(--text-secondary);font-size:0.8rem">${tramo.fecha_llegada ?? '—'} - ${tramo.hora_llegada ?? '—'}</span>
                    </div>
                </div>
            </div>
        `;
    });

    // Passenger list
    const passengerItems = passengers
        .sort((a, b) => a.localeCompare(b, 'es'))
        .map(name => `<div class="passenger-item">${name}</div>`)
        .join('');

    contentInner.innerHTML = `
        ${stepsHtml}
        <div style="margin-top:1rem;padding-top:0.75rem;border-top:1px dashed var(--border-color)">
            <div class="detail-label" style="margin-bottom:0.5rem">Pasajeros (${passengers.length})</div>
            <div class="passenger-list">${passengerItems}</div>
        </div>
    `;

    content.appendChild(contentInner);
    card.appendChild(header);
    card.appendChild(content);

    return card;
}

function createRouteCard(routeKey, flights, index) {
    const [origen, destino] = routeKey.split('|||');
    const card = document.createElement('div');
    card.className = 'route-card';
    card.style.animationDelay = `${index * 0.07}s`;

    const totalPassengers = new Set(
        Object.values(flights).flatMap(f => f.passengers)
    ).size;
    const totalFlights = Object.keys(flights).length;

    const header = document.createElement('div');
    header.className = 'route-header';
    header.innerHTML = `
        <div>
            <div class="route-title">
                ${origen} ${getFlag(origen)} &rarr; ${destino} ${getFlag(destino)}
            </div>
            <div class="route-subtitle">${totalFlights} vuelo${totalFlights !== 1 ? 's' : ''} &bull; ${totalPassengers} pasajero${totalPassengers !== 1 ? 's' : ''}</div>
        </div>
        ${renderArrowIcon()}
    `;

    header.addEventListener('click', () => toggleAccordion(card));

    const content = document.createElement('div');
    content.className = 'passenger-content'; // reuse same accordion CSS

    const contentInner = document.createElement('div');
    contentInner.className = 'content-inner flights-list';

    // Sort flights within route by first leg departure date
    const sortedFlights = Object.entries(flights).sort(([, a], [, b]) => {
        const dateA = a.vuelo?.itinerario?.[0]?.fecha_salida ?? '';
        const dateB = b.vuelo?.itinerario?.[0]?.fecha_salida ?? '';
        return dateA.localeCompare(dateB);
    });

    sortedFlights.forEach(([flightKey, flightData]) => {
        contentInner.appendChild(createFlightGroupCard(flightKey, flightData));
    });

    content.appendChild(contentInner);
    card.appendChild(header);
    card.appendChild(content);

    return card;
}

function renderByFlight(pasajeros) {
    const container = document.getElementById('passengers-container');
    container.innerHTML = '';

    const index = buildFlightIndex(pasajeros);

    // Sort routes alphabetically
    const sortedRoutes = Object.entries(index).sort(([a], [b]) => a.localeCompare(b, 'es'));

    sortedRoutes.forEach(([routeKey, flights], i) => {
        container.appendChild(createRouteCard(routeKey, flights, i));
    });
}

// ─────────────────────────────────────────────
//  Error + Render dispatcher
// ─────────────────────────────────────────────
function renderError(message) {
    document.getElementById('passengers-container').innerHTML = `
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

function renderAll() {
    const pasajeros = allData.pasajeros || [];
    if (pasajeros.length === 0) {
        document.getElementById('passengers-container').innerHTML =
            `<p style="text-align:center; color: var(--text-secondary)">No se encontraron pasajeros.</p>`;
        return;
    }

    if (currentMode === 'passenger') {
        renderByPassenger(pasajeros);
    } else {
        renderByFlight(pasajeros);
    }
}

// ─────────────────────────────────────────────
//  Bootstrap
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    fetch(`vuelos.json?nocache=${new Date().getTime()}`)
        .then(response => {
            if (!response.ok) throw new Error('HTTP error ' + response.status);
            return response.json();
        })
        .then(data => {
            allData = data;
            renderAll();
        })
        .catch(error => {
            console.error('Error cargando vuelos.json:', error);
            renderError(error.message);
        });
});