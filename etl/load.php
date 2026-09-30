<?php
header('Content-Type: text/plain; charset=utf-8');
require __DIR__ . '/../config.php';
$result = include __DIR__ . '/transform.php';
//$rows = $transformiert;

echo 'Der Transform liefert ' . count($transformiert) . " Zeilen.\n\n";


try {
    $pdo = new PDO($dsn, $username, $password, $options);
    echo "Verbindung steht.\n\n";
} catch (PDOException $e) {
    exit('Verbindung fehlgeschlagen: ' . $e->getMessage() . "\n");
}





// ---------------------------------------------------------------
// 1. Straftatbestände suchen, sonst anlegen
// ---------------------------------------------------------------

// Im Transform steht z.B. "Diebstahl".
// In der zweiten Tabelle brauchen wir aber die ID dieses
// Straftatbestands.

$findStraftatbestand = $pdo->prepare(
    'SELECT id FROM straftatbestand WHERE bezeichnung = ?'
);

$insertStraftatbestand = $pdo->prepare(
    'INSERT INTO straftatbestand (bezeichnung) VALUES (?)'
);


// $straftatbestandIds ist unser Merkzettel:
// Bezeichnung => ID
//
// So müssen wir denselben Straftatbestand nicht immer wieder
// in der Datenbank suchen.
$straftatbestandIds = [];

foreach ($transformiert as $row) {

    // Im Transform heißt die Spalte "Straftatbestand".
    // In der Datenbank heißt sie "bezeichnung".
    $bezeichnung = $row['Straftatbestand'];

    // Schon nachgeschlagen?
    if (isset($straftatbestandIds[$bezeichnung])) {
        continue;
    }

    // Straftatbestand in der Datenbank suchen
    $findStraftatbestand->execute([$bezeichnung]);
    $id = $findStraftatbestand->fetchColumn();

    // Nicht gefunden? Dann neu anlegen.
    if ($id === false) {
        $insertStraftatbestand->execute([$bezeichnung]);

        // Die gerade automatisch vergebene ID holen
        $id = $pdo->lastInsertId();
    }

    // ID für später merken
    $straftatbestandIds[$bezeichnung] = (int) $id;
}


echo 'Straftatbestände in der Datenbank: '
    . implode(', ', array_keys($straftatbestandIds))
    . ".\n\n";



$insertStatistik = $pdo->prepare(
    'INSERT INTO statistik
        (straftatbestand_id, altersgruppe, maennlich, weiblich)
     VALUES (?, ?, ?, ?)'
);

foreach ($transformiert as $row) {

    $bezeichnung = $row['Straftatbestand'];
    $straftatbestandId = $straftatbestandIds[$bezeichnung];

    $altersgruppen = [];

    foreach ($row as $spalte => $wert) {

        if ($spalte === 'Straftatbestand') {
            continue;
        }

        // männlich
        if (str_ends_with($spalte, 'männlich')) {

            $altersgruppe = trim(
                substr($spalte, 0, -strlen('männlich'))
            );

            $altersgruppen[$altersgruppe]['maennlich'] = $wert;
        }

        // weiblich
        if (str_ends_with($spalte, 'weiblich')) {

            $altersgruppe = trim(
                substr($spalte, 0, -strlen('weiblich'))
            );

            $altersgruppen[$altersgruppe]['weiblich'] = $wert;
        }
    }

    foreach ($altersgruppen as $altersgruppe => $werte) {

        $insertStatistik->execute([
            $straftatbestandId,
            $altersgruppe,
            $werte['maennlich'] ?? null,
            $werte['weiblich'] ?? null
        ]);
    }
}

echo "Statistik-Daten wurden eingefügt.\n";