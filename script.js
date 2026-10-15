// ===================================================
// FARBEN & GRUNDEINSTELLUNGEN
// ===================================================

const FARBE_ROT = '#b8322f';
const FARBE_BEIGE = '#ddd3c0';

// true  = Grafik 2: unter 30 Jahre rot, Rest beige
// false = Grafik 2: alle Balken rot
const ALTER_HERVORHEBEN = true;

// Ab dieser Fensterbreite gilt die "grosse" Ansicht
const BREAKPOINT_GROSS = 900;

// Grosser Bildschirm: Namen, die länger sind, kommen auf 2 Zeilen
const MAX_ZEICHEN_EINZEILIG = 70;

// Schriftgrösse der Namen in Grafik 1
const SCHRIFT_GROSS = 13;
const SCHRIFT_HANDY = 11;
const ZEILENHOEHE = 1.3;

// Courier ist eine Festbreiten-Schrift: jedes Zeichen ist
// ca. 0.6 × Schriftgrösse breit (mit etwas Reserve).
const ZEICHEN_BREITE = 0.62;

Chart.defaults.color = '#d9d2c5';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.08)';
Chart.defaults.font.family = "'Courier Prime', 'Courier New', monospace";


// ===================================================
// ANIMATION BEIM SCROLLEN
// ===================================================
// Die Balken wachsen nacheinander heraus, sobald die Grafik
// ins Bild kommt – und zwar jedes Mal beim Durchscrollen.

const balkenAnimation = {
    duration: 1200,
    easing: 'easeOutQuart',
    delay: function (context) {
        if (context.type === 'data' && context.mode === 'default') {
            return context.dataIndex * 90 + context.datasetIndex * 150;
        }
        return 0;
    }
};

// Merkt sich pro Grafik die echten Werte
const echteWerte = new Map();

// Merkt sich pro Grafik eine Funktion, die die Beschriftung
// an die aktuelle Breite anpasst (nur Grafik 1)
const anpassungen = new Map();

// Alle Balken auf 0 setzen (ohne Animation)
function balkenVerstecken(chart) {
    chart.data.datasets.forEach(dataset => {
        dataset.data = dataset.data.map(() => 0);
    });
    chart.update('none');
}

// Echte Werte wieder einsetzen (mit Animation)
function balkenZeigen(chart) {
    const werte = echteWerte.get(chart);
    chart.data.datasets.forEach((dataset, i) => {
        dataset.data = [...werte[i]];
    });
    chart.update();
}

// Beobachtet, ob eine Grafik im Bild ist
const beobachter = new IntersectionObserver(eintraege => {
    eintraege.forEach(eintrag => {
        const chart = Chart.getChart(eintrag.target);
        if (!chart) return;

        if (eintrag.isIntersecting) {
            // Jetzt ist die Akte offen und die echte Breite messbar
            const anpassen = anpassungen.get(chart);
            if (anpassen) anpassen();

            balkenZeigen(chart);
        } else {
            balkenVerstecken(chart);
        }
    });
}, {
    threshold: 0.3   // 30 % der Grafik sichtbar -> Animation startet
});

// Grafik erstellen, die zuerst leer ist
function animierteGrafik(canvasId, config) {
    const canvas = document.getElementById(canvasId);

    const werte = config.data.datasets.map(dataset => [...dataset.data]);
    config.data.datasets.forEach(dataset => {
        dataset.data = dataset.data.map(() => 0);
    });

    config.options.animation = balkenAnimation;

    const chart = new Chart(canvas, config);
    echteWerte.set(chart, werte);

    beobachter.observe(canvas);
    return chart;
}


// ===================================================
// HILFSFUNKTIONEN
// ===================================================

// Startalter einer Altersgruppe ("<10 Jahre" -> 0)
function startAlter(altersgruppe) {
    if (altersgruppe.trim().startsWith('<')) return 0;
    const match = altersgruppe.match(/\d+/);
    return match ? Number(match[0]) : 999;
}

// Fussnoten-Zahl am Ende entfernen: "(Art. 197a)4" -> "(Art. 197a)"
function nameBereinigen(name) {
    return name.trim().replace(/\)\s*\d+$/, ')');
}

function istGross() {
    return window.innerWidth > BREAKPOINT_GROSS;
}

// Breite der Grafik. Solange die Akte noch zu ist (display: none),
// ist die echte Breite 0 – dann wird sie aus der Fensterbreite geschätzt.
function grafikBreite(canvas) {
    const breite = canvas.parentElement.clientWidth;
    if (breite > 0) return breite;

    // Abstände auf dem Handy: main 2×16, Kapitel 2×24, Tafel 2×14
    return Math.max(200, window.innerWidth - 110);
}

// Wie viele Zeichen passen pro Zeile in die Namen-Spalte?
// WICHTIG: Chart.js gibt der Y-Achse höchstens die HALBE Breite
// der Grafik. Alles, was breiter ist, wird links abgeschnitten.
// Das war der Fehler: 30 Zeichen passten auf dem Handy nicht.
function maxZeichenProZeile(canvas, schrift) {
    const platz = grafikBreite(canvas) / 2 - 24;   // 24 = Abstand zu den Balken + Reserve
    return Math.max(8, Math.floor(platz / (schrift * ZEICHEN_BREITE)));
}

// Grosser Bildschirm: Sehr lange Namen (z. B. Art. 191 und Art. 197a)
// werden in der Mitte auf 2 Zeilen aufgeteilt, alle anderen bleiben einzeilig.
function zweiZeilen(text) {
    if (text.length <= MAX_ZEICHEN_EINZEILIG) {
        return text;
    }

    const woerter = text.split(' ');
    const mitte = text.length / 2;

    // Trennstelle suchen, die am nächsten bei der Textmitte liegt
    let besteStelle = 1;
    let besterAbstand = Infinity;
    let laenge = 0;

    for (let i = 0; i < woerter.length - 1; i++) {
        laenge += woerter[i].length + 1;
        const abstand = Math.abs(laenge - mitte);

        if (abstand < besterAbstand) {
            besterAbstand = abstand;
            besteStelle = i + 1;
        }
    }

    return [
        woerter.slice(0, besteStelle).join(' '),
        woerter.slice(besteStelle).join(' ')
    ];
}

// Nur fürs Handy: Name umbrechen, Artikel in eigener Zeile
// "Exhibitionismus (Art. 194)" -> ["Exhibitionismus", "Art. 194"]
function umbrechen(text, maxZeichen) {
    const match = text.match(/^(.*?)\s*\((Art\.[^)]*)\)$/);
    const name = match ? match[1] : text;
    const artikel = match ? match[2] : null;

    // Wörter, die allein schon zu lang sind, mit Bindestrich trennen
    const woerter = [];
    name.split(' ').forEach(wort => {
        while (wort.length > maxZeichen) {
            woerter.push(wort.slice(0, maxZeichen - 1) + '-');
            wort = wort.slice(maxZeichen - 1);
        }
        if (wort !== '') woerter.push(wort);
    });

    const zeilen = [];
    let zeile = '';

    woerter.forEach(wort => {
        if ((zeile + ' ' + wort).trim().length > maxZeichen && zeile !== '') {
            zeilen.push(zeile);
            zeile = wort;
        } else {
            zeile = (zeile + ' ' + wort).trim();
        }
    });

    if (zeile !== '') zeilen.push(zeile);
    if (artikel) zeilen.push(artikel);

    return zeilen;
}

// Handy: Höhe der Grafik so wählen, dass jeder Name in seine Zeile
// passt und nichts überlappt. Chart.js gibt jedem Balken gleich viel
// Platz – darum zählt der Name mit den meisten Zeilen.
function grafikHoeheSetzen(canvas, labels, schrift) {
    const container = canvas.parentElement;

    if (istGross()) {
        container.style.height = '';   // Höhe aus dem CSS
        return;
    }

    const maxZeilen = Math.max(...labels.map(l => Array.isArray(l) ? l.length : 1));
    const proBalken = maxZeilen * schrift * ZEILENHOEHE + 16;   // 16 = Luft zwischen den Namen
    const hoehe = labels.length * proBalken + 90;               // 90 = Legende + X-Achse

    container.style.height = Math.max(480, Math.ceil(hoehe)) + 'px';
}


// ===================================================
// DATEN LADEN
// ===================================================

fetch('unload.php')
    .then(response => response.json())
    .then(daten => {

        // ===================================================
        // ANTEIL UNTER 30 JAHREN (Hypothese)
        // ===================================================

        // Nur Vergewaltigungen – gleiche Grundlage wie Grafik 2 daneben
        const vergewaltigungsZeilen = daten.filter(eintrag =>
            eintrag.straftatbestand.trim().toLowerCase().includes('vergewaltigung')
        );

        let unter30 = 0;
        let alle = 0;

        vergewaltigungsZeilen.forEach(eintrag => {
            const anzahl = Number(eintrag.maennlich ?? 0) + Number(eintrag.weiblich ?? 0);
            alle += anzahl;

            if (startAlter(eintrag.altersgruppe) < 30) {
                unter30 += anzahl;
            }
        });

        const anteilFeld = document.getElementById('anteilU30');
        if (anteilFeld && alle > 0) {
            anteilFeld.textContent = Math.round(unter30 / alle * 100) + ' %';
        }


        // ===================================================
        // GRUNDDATEN BEREINIGEN
        // ===================================================

        daten = daten.filter(eintrag =>
            eintrag.straftatbestand.trim().toLowerCase() !== 'total sexualisierte gewalt'
        );


        // ===================================================
        // GRAFIK 1
        // STRAFTATBESTÄNDE NACH GESCHLECHT
        // ===================================================

        const summen = {};

        daten.forEach(eintrag => {
            const name = nameBereinigen(eintrag.straftatbestand);

            if (!summen[name]) {
                summen[name] = { maennlich: 0, weiblich: 0 };
            }

            summen[name].maennlich += Number(eintrag.maennlich ?? 0);
            summen[name].weiblich += Number(eintrag.weiblich ?? 0);
        });

        let sortiert = Object.entries(summen).map(([name, werte]) => ({
            name: name,
            maennlich: werte.maennlich,
            weiblich: werte.weiblich,
            total: werte.maennlich + werte.weiblich
        }));

        // Nach Gesamtanzahl sortieren
        sortiert.sort((a, b) => b.total - a.total);

        // Die zwei untersten Straftatbestände entfernen
        sortiert = sortiert.slice(0, -2);

        const namenVoll = sortiert.map(e => e.name);

        const delikteCanvas = document.getElementById('delikteChart');

        // Beschriftung passend zur aktuellen Breite berechnen
        // Grosser Bildschirm: einzeilig, nur sehr lange Namen auf 2 Zeilen
        // Handy / schmales Fenster: Namen so umbrechen, dass sie Platz haben
        function beschriftungBerechnen() {
            if (istGross()) {
                return {
                    schrift: SCHRIFT_GROSS,
                    labels: namenVoll.map(name => zweiZeilen(name))
                };
            }

            const maxZeichen = maxZeichenProZeile(delikteCanvas, SCHRIFT_HANDY);
            return {
                schrift: SCHRIFT_HANDY,
                labels: namenVoll.map(name => umbrechen(name, maxZeichen))
            };
        }

        const start = beschriftungBerechnen();
        grafikHoeheSetzen(delikteCanvas, start.labels, start.schrift);

        const weiblich = sortiert.map(e => e.weiblich);
        const maennlich = sortiert.map(e => e.maennlich);

        const delikteChart = animierteGrafik('delikteChart', {
            type: 'bar',

            data: {
                labels: start.labels,
                datasets: [
                    {
                        label: 'Weiblich',
                        data: weiblich,
                        backgroundColor: FARBE_ROT,
                        hoverBackgroundColor: FARBE_ROT,
                        borderWidth: 0
                    },
                    {
                        label: 'Männlich',
                        data: maennlich,
                        backgroundColor: FARBE_BEIGE,
                        hoverBackgroundColor: FARBE_BEIGE,
                        borderWidth: 0
                    }
                ]
            },

            options: {
                indexAxis: 'y',          // horizontale Balken
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end',
                        labels: { font: { size: 14 }, boxWidth: 14 }
                    },
                    tooltip: {
                        callbacks: {
                            title: items => namenVoll[items[0].dataIndex],
                            label: context => context.dataset.label + ': ' +
                                echteWerte.get(context.chart)[context.datasetIndex][context.dataIndex],
                            footer: function (items) {
                                const i = items[0].dataIndex;
                                return 'Total: ' + (weiblich[i] + maennlich[i]);
                            }
                        }
                    }
                },

                scales: {
                    x: {
                        stacked: true,
                        beginAtZero: true,
                        // feste Obergrenze, damit die Achse beim Animieren nicht springt
                        suggestedMax: Math.max(...sortiert.map(e => e.total)),
                        ticks: { font: { size: 12 } },
                        title: {
                            display: true,
                            text: 'Anzahl geschädigte Personen',
                            font: { size: 13 }
                        }
                    },
                    y: {
                        stacked: true,
                        grid: { display: false },
                        ticks: {
                            autoSkip: false,
                            font: { size: start.schrift, lineHeight: ZEILENHOEHE },
                            padding: 10
                        }
                    }
                }
            }
        });

        // Beschriftung neu berechnen (beim Öffnen der Akte und beim Drehen
        // des Handys / Ändern der Fenstergrösse)
        function beschriftungAnpassen() {
            const neu = beschriftungBerechnen();

            // Nur aktualisieren, wenn sich wirklich etwas geändert hat
            if (JSON.stringify(neu.labels) === JSON.stringify(delikteChart.data.labels) &&
                delikteChart.options.scales.y.ticks.font.size === neu.schrift) {
                return;
            }

            grafikHoeheSetzen(delikteCanvas, neu.labels, neu.schrift);
            delikteChart.data.labels = neu.labels;
            delikteChart.options.scales.y.ticks.font.size = neu.schrift;
            delikteChart.update('none');
        }

        anpassungen.set(delikteChart, beschriftungAnpassen);

        // Nur auf Breitenänderungen reagieren (auf dem iPhone löst schon
        // das Scrollen ein "resize" aus, weil die Adressleiste die Höhe ändert)
        let letzteBreite = window.innerWidth;
        let resizeTimer;

        window.addEventListener('resize', () => {
            if (window.innerWidth === letzteBreite) return;
            letzteBreite = window.innerWidth;

            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(beschriftungAnpassen, 200);
        });


        // ===================================================
        // GRAFIK 2
        // VERGEWALTIGUNG NACH ALTERSGRUPPE
        // ===================================================

        const vergewaltigungen = daten.filter(eintrag =>
            eintrag.straftatbestand.trim().toLowerCase().includes('vergewaltigung')
        );

        const altersSummen = {};

        vergewaltigungen.forEach(eintrag => {
            const gruppe = eintrag.altersgruppe;
            const total = Number(eintrag.maennlich ?? 0) + Number(eintrag.weiblich ?? 0);

            altersSummen[gruppe] = (altersSummen[gruppe] ?? 0) + total;
        });

        const altersLabels = Object.keys(altersSummen);

        // Nach Alter sortieren ("<10 Jahre" zuerst)
        altersLabels.sort((a, b) => startAlter(a) - startAlter(b));

        const altersWerte = altersLabels.map(gruppe => altersSummen[gruppe]);

        const altersFarben = altersLabels.map(gruppe => {
            if (!ALTER_HERVORHEBEN) return FARBE_ROT;
            return startAlter(gruppe) < 30 ? FARBE_ROT : FARBE_BEIGE;
        });

        animierteGrafik('ageChart', {
            type: 'bar',

            data: {
                labels: altersLabels,
                datasets: [
                    {
                        label: 'Vergewaltigungen',
                        data: altersWerte,
                        backgroundColor: altersFarben,
                        hoverBackgroundColor: altersFarben,
                        borderWidth: 0
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: context => 'Anzahl: ' + altersWerte[context.dataIndex]
                        }
                    }
                },

                scales: {
                    x: {
                        grid: { display: false },
                        title: {
                            display: true,
                            text: 'Altersgruppe',
                            font: { size: 13 }
                        },
                        ticks: {
                            autoSkip: false,
                            font: { size: 12 },
                            maxRotation: 45,
                            minRotation: 0
                        }
                    },
                    y: {
                        beginAtZero: true,
                        // feste Obergrenze, damit die Achse beim Animieren nicht springt
                        suggestedMax: Math.max(...altersWerte),
                        title: {
                            display: true,
                            text: 'Anzahl',
                            font: { size: 13 }
                        },
                        ticks: { font: { size: 12 } }
                    }
                }
            }
        });

    })

    .catch(error => {
        console.error('Fehler beim Laden der Daten:', error);
    });