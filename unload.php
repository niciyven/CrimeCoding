<?php
// --- Baustein 1: Verbinden --------------------------------------------------

// TODO 1: Antwort als JSON ankündigen
header('Content-Type: application/json; charset=utf-8');

try {

    // TODO 2: config.php einbinden und Verbindung aufbauen
    // Drei Ordner nach oben
    require __DIR__ . '/config.php';

    $pdo = new PDO($dsn, $username, $password, $options);


    // --- Baustein 2: Lesen --------------------------------------------------

    // TODO 7: Optionalen Filter aus der URL lesen
    // Beispiel:
    // upload.php?straftatbestand=Vergewaltigung%20(Art.%20190)

    $filter = $_GET['straftatbestand'] ?? null;


    // TODO 3: Daten aus statistik lesen und über JOIN
    // die Bezeichnung des Straftatbestands holen

    $sql = '
        SELECT
            s.id,
            st.bezeichnung AS straftatbestand,
            s.altersgruppe,
            s.maennlich,
            s.weiblich
        FROM statistik AS s
        JOIN straftatbestand AS st
            ON s.straftatbestand_id = st.id
    ';

    // Optional filtern
    if ($filter !== null && $filter !== '') {
        $sql .= ' WHERE st.bezeichnung = :straftatbestand';
    }

    // Sortierung
    $sql .= ' ORDER BY st.bezeichnung, s.altersgruppe';


    // Abfrage vorbereiten
    $stmt = $pdo->prepare($sql);


    // Parameter nur über execute() übergeben
    if ($filter !== null && $filter !== '') {
        $stmt->execute([
            'straftatbestand' => $filter
        ]);
    } else {
        $stmt->execute();
    }


    // TODO 4: Alle Zeilen holen
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);


    // --- Baustein 3: Antworten ----------------------------------------------

    // TODO 5: Datentypen festlegen
    $daten = array_map(function ($row) {

        return [
            'id' => (int)$row['id'],
            'straftatbestand' => $row['straftatbestand'],
            'altersgruppe' => $row['altersgruppe'],

            // NULL soll auch NULL bleiben
            'maennlich' => $row['maennlich'] === null
                ? null
                : (int)$row['maennlich'],

            'weiblich' => $row['weiblich'] === null
                ? null
                : (int)$row['weiblich']
        ];

    }, $rows);


    // TODO 6: Als JSON ausgeben
    echo json_encode(
        $daten,
        JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT
    );


// --- Baustein 4: Fehler -----------------------------------------------------

} catch (Throwable $e) {

    http_response_code(500);

    echo json_encode([
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}