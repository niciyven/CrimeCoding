<?php

header('Content-Type: text/plain; charset=utf-8');

// Während der Entwicklung: alle Fehler und Warnungen anzeigen,
// damit wir sehen, WARUM etwas nicht funktioniert.
ini_set('display_errors', '1');
error_reporting(E_ALL);

// ---------------------------------------------------------------
// 1. Daten aus extract.php laden
// ---------------------------------------------------------------
// $nurLaden = true sorgt dafür, dass extract.php nichts ausgibt.
// extract.php gibt am Ende mit "return $daten;" das Array zurück.
$nurLaden = true;
$daten = require __DIR__ . '/extract.php';

// Kontrolle: Hat extract.php wirklich ein Array mit Daten geliefert?
if (!is_array($daten)) {
    echo "Fehler: extract.php hat kein Array zurückgegeben.\n";
    echo "Steht am Ende von extract.php die Zeile: return \$daten; ?\n";
    exit;
}

if (count($daten) === 0) {
    echo "Fehler: extract.php hat ein leeres Array geliefert.\n";
    echo "Bitte extract.php einzeln aufrufen und die Ausgabe prüfen.\n";
    exit;
}

// ---------------------------------------------------------------
// 2. Daten umbauen (Transform)
// ---------------------------------------------------------------
// Wir behalten pro Datensatz nur:
// - den Straftatbestand
// - pro Altersgruppe die Anzahl "männlich" und "weiblich"
//
// Wir lassen weg:
// - die Geschlecht-Spalten (z.B. "Geschlecht männlich")
// - pro Altersgruppe die Spalte "Total"
// - die Altersgruppe "ohne Angabe"
//
// Außerdem ersetzen wir jedes "X" durch null.
$transformiert = [];
$anzahlX = 0;

foreach ($daten as $datensatz) {

    // Neuer, leerer Datensatz – der Straftatbestand kommt immer zuerst
    $neuerDatensatz = [];
    $neuerDatensatz['Straftatbestand'] = trim($datensatz['Straftatbestand']);

    // Jetzt gehen wir alle Spalten dieses Datensatzes durch
    foreach ($datensatz as $spalte => $wert) {

        // Straftatbestand haben wir oben schon übernommen
        if ($spalte === 'Straftatbestand') {
            continue;
        }

        // Geschlecht-Spalten brauchen wir nicht
        if (str_starts_with($spalte, 'Geschlecht')) {
            continue;
        }

        // Altersgruppe "ohne Angabe" brauchen wir nicht
        if (str_starts_with($spalte, 'ohne Angabe')) {
            continue;
        }

        // "Total" pro Altersgruppe brauchen wir nicht
        if (str_ends_with($spalte, 'Total')) {
            continue;
        }

        // "X" durch null ersetzen, alle anderen Werte unverändert übernehmen
        if (trim($wert) === 'X') {
            $neuerDatensatz[$spalte] = null;
            $anzahlX++;
        } else {
            $neuerDatensatz[$spalte] = $wert;
        }
    }

    $transformiert[] = $neuerDatensatz;
    //print_r($neuerDatensatz);
}

// ---------------------------------------------------------------
// 3. Ergebnis prüfen
// ---------------------------------------------------------------
echo 'Anzahl Datensätze: ' . count($transformiert) . "\n";
echo 'Anzahl Spalten pro Datensatz: ' . count($transformiert[0]) . "\n";
echo 'Ersetzte X-Werte: ' . $anzahlX . "\n\n";

// Hinweis: print_r() zeigt null als leeren Wert an ("=> ").
// var_dump() würde es als NULL anzeigen.
//print_r($transformiert);

return $transformiert;