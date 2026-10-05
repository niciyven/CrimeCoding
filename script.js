fetch('unload.php')
    .then(response => response.json())
    .then(daten => {

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
                summen[straftatbestand] = {
                    maennlich: 0,
                    weiblich: 0
                };
            }

            summen[straftatbestand].maennlich += maennlich;
            summen[straftatbestand].weiblich += weiblich;
        });


        let sortiert = Object.entries(summen).map(eintrag => {

            const name = eintrag[0];
            const maennlich = Number(eintrag[1].maennlich ?? 0);
            const weiblich = Number(eintrag[1].weiblich ?? 0);
            const total = maennlich + weiblich;

            return {
                name: name,
                maennlich: maennlich,
                weiblich: weiblich,
                total: total
            };
        });


        // Nach Gesamtanzahl sortieren
        sortiert.sort((a, b) =>
            b.total - a.total
        );


        // Die zwei untersten Straftatbestände entfernen
        sortiert = sortiert.slice(0, -2);


        const labels = sortiert.map(
            eintrag => eintrag.name
        );

        const weiblich = sortiert.map(
            eintrag => eintrag.weiblich
        );

        const maennlich = sortiert.map(
            eintrag => eintrag.maennlich
        );


        const dataGeschlecht = {
            labels: labels,

            datasets: [
                {
                    label: 'Weiblich',
                    data: weiblich,
                    backgroundColor: '#9cc9ea',
                    borderWidth: 0
                },

                {
                    label: 'Männlich',
                    data: maennlich,
                    backgroundColor: '#f2a7b5',
                    borderWidth: 0
                }
            ]
        };


        const configGeschlecht = {
            type: 'bar',

            data: dataGeschlecht,

            options: {

                // horizontale Balken
                indexAxis: 'y',

                responsive: true,
                maintainAspectRatio: false,

                layout: {
                    padding: {
                        left: 10,
                        right: 30,
                        top: 10,
                        bottom: 20
                    }
                },

                plugins: {

                    title: {
                        display: true,
                        text: 'Straftatbestände nach Geschlecht – Schweiz 2025',
                        font: {
                            size: 18
                        },
                        padding: {
                            bottom: 20
                        }
                    },

                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                size: 14
                            }
                        }
                    },

                    tooltip: {
                        callbacks: {

                            footer: function(tooltipItems) {

                                const index =
                                    tooltipItems[0].dataIndex;

                                const total =
                                    weiblich[index] +
                                    maennlich[index];

                                return 'Total: ' + total;
                            }
                        }
                    }
                },


                scales: {

                    x: {
                        stacked: true,
                        beginAtZero: true,
                        min: 0,

                        ticks: {
                            stepSize: 100,
                            font: {
                                size: 12
                            }
                        },

                        title: {
                            display: true,
                            text: 'Anzahl',
                            font: {
                                size: 14
                            }
                        }
                    },


                    y: {
                        stacked: true,

                        ticks: {
                            autoSkip: false,
                            font: {
                                size: 13
                            },
                            padding: 10
                        }
                    }
                }
            }
        };


        new Chart(
            document.getElementById('delikteChart'),
            configGeschlecht
        );


        // ===================================================
        // GRAFIK 2
        // VERGEWALTIGUNG NACH ALTERSRANGE
        // ===================================================

        // Nur Straftatbestand Vergewaltigung auswählen
        const vergewaltigungen = daten.filter(eintrag =>
            eintrag.straftatbestand
                .trim()
                .toLowerCase()
                .includes('vergewaltigung')
        );


        // Werte pro Altersgruppe zusammenrechnen
        // männlich + weiblich
        const altersSummen = {};

        vergewaltigungen.forEach(eintrag => {

            const altersgruppe = eintrag.altersgruppe;

            const maennlich = Number(eintrag.maennlich ?? 0);
            const weiblich = Number(eintrag.weiblich ?? 0);

            const total = maennlich + weiblich;

            if (!altersSummen[altersgruppe]) {
                altersSummen[altersgruppe] = 0;
            }

            altersSummen[altersgruppe] += total;
        });


        // Kontrollausgabe in der Console
        console.log(
            'Altersgruppen Vergewaltigung:',
            Object.keys(altersSummen)
        );


        // Alle Altersgruppen direkt aus den Daten übernehmen
        const altersLabels = Object.keys(altersSummen);


        // Altersgruppen automatisch nach Alter sortieren
        altersLabels.sort((a, b) => {

            // "<10 Jahre" soll ganz am Anfang stehen
            if (a.startsWith('<') && !b.startsWith('<')) {
                return -1;
            }

            if (b.startsWith('<') && !a.startsWith('<')) {
                return 1;
            }

            // Erste Zahl aus dem Text herauslesen
            const matchA = a.match(/\d+/);
            const matchB = b.match(/\d+/);

            const zahlA = matchA ? Number(matchA[0]) : 999;
            const zahlB = matchB ? Number(matchB[0]) : 999;

            return zahlA - zahlB;
        });


        const altersWerte = altersLabels.map(
            altersgruppe =>
                altersSummen[altersgruppe]
        );


        const ageData = {
            labels: altersLabels,

            datasets: [
                {
                    label: 'Vergewaltigungen',
                    data: altersWerte,
                    backgroundColor: '#9cc9ea',
                    borderWidth: 0
                }
            ]
        };


        const ageConfig = {
            type: 'bar',

            data: ageData,

            options: {

                responsive: true,
                maintainAspectRatio: false,

                plugins: {

                    title: {
                        display: true,
                        text: 'Vergewaltigungen nach Altersgruppen – Schweiz 2025',
                        font: {
                            size: 18
                        },
                        padding: {
                            bottom: 20
                        }
                    },

                    legend: {
                        display: false
                    },

                    tooltip: {
                        callbacks: {

                            label: function(context) {
                                return 'Anzahl: ' + context.raw;
                            }
                        }
                    }
                },


                scales: {

                    x: {

                        title: {
                            display: true,
                            text: 'Altersgruppe',
                            font: {
                                size: 14
                            }
                        },

                        ticks: {
                            autoSkip: false,

                            font: {
                                size: 12
                            },

                            maxRotation: 45,
                            minRotation: 0
                        }
                    },


                    y: {
                        beginAtZero: true,
                        min: 0,

                        title: {
                            display: true,
                            text: 'Anzahl',
                            font: {
                                size: 14
                            }
                        },

                        ticks: {
                            stepSize: 20,

                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        };


        new Chart(
            document.getElementById('ageChart'),
            ageConfig
        );

    })


    .catch(error => {

        console.error(
            'Fehler beim Laden der Daten:',
            error
        );

    });