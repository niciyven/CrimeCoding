// ===================================================
// CHART.JS AN DAS DUNKLE DESIGN ANPASSEN
// ===================================================

Chart.defaults.color = '#d9d2c5';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.08)';
Chart.defaults.font.family = "'Courier Prime', 'Courier New', monospace";

const FARBE_ROT = '#b8322f';
const FARBE_PAPIER = '#ddd3c0';


fetch('unload.php')
    .then(response => response.json())
    .then(daten => {

        // ===================================================
        // ANTEIL UNTER 30 JAHREN (Hypothese)
        // ===================================================
        // Dafür nehmen wir die Zeile "Total Sexualisierte Gewalt",
        // BEVOR wir sie weiter unten herausfiltern.

        const totalZeilen = daten.filter(eintrag =>
            eintrag.straftatbestand.trim().toLowerCase() === 'total sexualisierte gewalt'
        );

        let unter30 = 0;
        let alle = 0;

        totalZeilen.forEach(eintrag => {
            const anzahl = Number(eintrag.maennlich ?? 0) + Number(eintrag.weiblich ?? 0);
            const match = eintrag.altersgruppe.match(/\d+/);
            const startAlter = match ? Number(match[0]) : 999;

            alle += anzahl;

            // "<10 Jahre" beginnt mit "<" und zählt auch dazu
            if (eintrag.altersgruppe.trim().startsWith('<') || startAlter < 30) {
                unter30 += anzahl;
            }
        });

        if (alle > 0) {
            document.getElementById('anteilU30').textContent =
                Math.round(unter30 / alle * 100) + ' %';
        }


        // ===================================================
        // GRUNDDATEN BEREINIGEN
        // ===================================================

        // "Total Sexualisierte Gewalt" entfernen
        daten = daten.filter(eintrag =>
            eintrag.straftatbestand
                .trim()
                .toLowerCase() !== 'total sexualisierte gewalt'
        );


        // ===================================================
        // GRAFIK 1
        // STRAFTATBESTÄNDE NACH GESCHLECHT
        // ===================================================

        const summen = {};

        daten.forEach(eintrag => {

            const straftatbestand = eintrag.straftatbestand;
            const maennlich = Number(eintrag.maennlich ?? 0);
            const weiblich = Number(eintrag.weiblich ?? 0);

            if (!summen[straftatbestand]) {
                summen[straftatbestand] = { maennlich: 0, weiblich: 0 };
            }

            summen[straftatbestand].maennlich += maennlich;
            summen[straftatbestand].weiblich += weiblich;
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

        const labels = sortiert.map(eintrag => eintrag.name);
        const weiblich = sortiert.map(eintrag => eintrag.weiblich);
        const maennlich = sortiert.map(eintrag => eintrag.maennlich);


        new Chart(document.getElementById('delikteChart'), {
            type: 'bar',

            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Weiblich',
                        data: weiblich,
                        backgroundColor: FARBE_ROT,
                        borderWidth: 0
                    },
                    {
                        label: 'Männlich',
                        data: maennlich,
                        backgroundColor: FARBE_PAPIER,
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
                            footer: function (tooltipItems) {
                                const index = tooltipItems[0].dataIndex;
                                return 'Total: ' + (weiblich[index] + maennlich[index]);
                            }
                        }
                    }
                },

                scales: {
                    x: {
                        stacked: true,
                        beginAtZero: true,
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
                            font: { size: 13 },
                            padding: 10
                        }
                    }
                }
            }
        });


        // ===================================================
        // GRAFIK 2
        // VERGEWALTIGUNG NACH ALTERSGRUPPE
        // ===================================================

        // Nur Straftatbestand Vergewaltigung auswählen
        const vergewaltigungen = daten.filter(eintrag =>
            eintrag.straftatbestand
                .trim()
                .toLowerCase()
                .includes('vergewaltigung')
        );

        // Werte pro Altersgruppe zusammenrechnen (männlich + weiblich)
        const altersSummen = {};

        vergewaltigungen.forEach(eintrag => {
            const altersgruppe = eintrag.altersgruppe;
            const total = Number(eintrag.maennlich ?? 0) + Number(eintrag.weiblich ?? 0);

            if (!altersSummen[altersgruppe]) {
                altersSummen[altersgruppe] = 0;
            }

            altersSummen[altersgruppe] += total;
        });

        const altersLabels = Object.keys(altersSummen);

        // Altersgruppen nach Alter sortieren
        altersLabels.sort((a, b) => {

            // "<10 Jahre" soll ganz am Anfang stehen
            if (a.startsWith('<') && !b.startsWith('<')) return -1;
            if (b.startsWith('<') && !a.startsWith('<')) return 1;

            const matchA = a.match(/\d+/);
            const matchB = b.match(/\d+/);

            const zahlA = matchA ? Number(matchA[0]) : 999;
            const zahlB = matchB ? Number(matchB[0]) : 999;

            return zahlA - zahlB;
        });

        const altersWerte = altersLabels.map(gruppe => altersSummen[gruppe]);

        // Balken unter 30 Jahren rot, alle anderen papierfarben
        const altersFarben = altersLabels.map(gruppe => {
            const match = gruppe.match(/\d+/);
            const start = match ? Number(match[0]) : 999;
            return (gruppe.startsWith('<') || start < 30) ? FARBE_ROT : FARBE_PAPIER;
        });


        new Chart(document.getElementById('ageChart'), {
            type: 'bar',

            data: {
                labels: altersLabels,
                datasets: [
                    {
                        label: 'Vergewaltigungen',
                        data: altersWerte,
                        backgroundColor: altersFarben,
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
                            label: context => 'Anzahl: ' + context.raw
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