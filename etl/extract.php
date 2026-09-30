<?php

header('Content-Type: text/plain; charset=utf-8');

// Trennzeichen der CSV (in unserer Datei ein Komma).
// Falls die Datei mit Excel neu gespeichert wurde, kann es ';' sein.
$trennzeichen = ',';

// CSV öffnen
$handle = fopen('../data/Datensatz_2025.csv', 'r');

// ---------------------------------------------------------------
// 1. Kopfzeile mit "Straftatbestand" suchen
// ---------------------------------------------------------------
// Wir verlassen uns NICHT darauf, dass der Header in einer bestimmten
// Zeilennummer steht. Titelzeilen oder Leerzeilen oberhalb würden sonst
// alles verschieben. Wir lesen so lange, bis die erste Zelle mit
// "Straftatbestand" beginnt. Das ist die Zeile mit den Gruppen
// (männlich, weiblich, <10 Jahre, 10 - 14 Jahre, ...).
$kopfGruppe = null;

while (($row = fgetcsv($handle, null, $trennzeichen, '"', '')) !== false) {

    $ersteZelle = trim($row[0] ?? '');

    if (str_starts_with($ersteZelle, 'Straftatbestand')) {
        $kopfGruppe = array_map('trim', $row);
        break;
    }
}

// Ohne diese Zeile können wir keine Spaltennamen bauen -> abbrechen
if ($kopfGruppe === null) {
    echo "Fehler: Keine Zeile gefunden, die mit 'Straftatbestand' beginnt.\n";
    echo "Bitte Dateipfad und Trennzeichen prüfen.\n";
    exit;
}

// ---------------------------------------------------------------
// 2. Nächste nicht-leere Zeile = Unterteilung (Total/männlich/weiblich)
// ---------------------------------------------------------------
$kopfUnterteilung = [];

while (($row = fgetcsv($handle, null, $trennzeichen, '"', '')) !== false) {

    // Komplett leere Zeile: fgetcsv() liefert [null] -> überspringen
    if ($row[0] === null) {
        continue;
    }

    $kopfUnterteilung = array_map('trim', $row);
    break;
}

// ---------------------------------------------------------------
// 3. Eindeutige Spaltennamen zusammenbauen
// ---------------------------------------------------------------
// Eine Altersgruppe wie "<10 Jahre" steht nur über der ERSTEN ihrer
// drei Spalten. Darum merken wir uns die letzte Altersgruppe und
// verwenden sie für die leeren Zellen daneben weiter.
//
// Geschlecht-Spalten erkennen wir daran, dass darunter KEINE
// Unterteilung steht. Altersspalten haben immer Total/männlich/weiblich.
$header = [];
$aktuelleAltersgruppe = '';

for ($i = 0; $i < count($kopfGruppe); $i++) {

    $gruppe = $kopfGruppe[$i];
    $unterteilung = $kopfUnterteilung[$i] ?? '';

    // Erste Spalte: Straftatbestand
    if ($i === 0) {
        $header[] = 'Straftatbestand';
        continue;
    }

    // Leere Spalten am Ende -> fertig
    if ($gruppe === '' && $unterteilung === '') {
        break;
    }

    if ($unterteilung === '') {
        // z.B. "Geschlecht männlich"
        $header[] = 'Geschlecht ' . $gruppe;
    } else {
        if ($gruppe !== '') {
            $aktuelleAltersgruppe = $gruppe;
        }
        // z.B. "10 - 14 Jahre weiblich"
        $header[] = $aktuelleAltersgruppe . ' ' . $unterteilung;
    }
}

$anzahlSpalten = count($header);

// ---------------------------------------------------------------
// 4. Datensätze lesen
// ---------------------------------------------------------------
$daten = [];

while (($row = fgetcsv($handle, null, $trennzeichen, '"', '')) !== false) {

    // Leere Zeilen überspringen
    if ($row[0] === null || trim($row[0]) === '') {
        continue;
    }

    // Zeilen ohne Zahl in der zweiten Spalte sind keine Datensätze,
    // sondern z.B. Fußnoten ("X = ...") oder Quellenangaben
    if (trim($row[1] ?? '') === '') {
        continue;
    }

    // Nur so viele Werte nehmen, wie wir Spaltennamen haben
    // (die leeren Spalten am Zeilenende fallen so weg)
    $werte = array_slice($row, 0, $anzahlSpalten);

    // array_combine() braucht gleich viele Namen und Werte
    if (count($werte) !== $anzahlSpalten) {
        echo 'Zeile übersprungen (zu wenige Werte): ' . $row[0] . "\n";
        continue;
    }

    // Werte bleiben unverändert (auch "X" und "4'521")
    $daten[] = array_combine($header, $werte);
}

fclose($handle);

// ---------------------------------------------------------------
// 5. Struktur prüfen
// ---------------------------------------------------------------
// Wenn eine andere Datei (z.B. transform.php) extract.php nur
// laden will, setzt sie vorher $nurLaden = true. Dann wird hier
// nichts ausgegeben, nur das Array $daten steht bereit.
if (!isset($nurLaden)) {

    echo 'Anzahl Spalten: ' . $anzahlSpalten . "\n";
    echo 'Anzahl Datensätze: ' . count($daten) . "\n\n";

    echo "Spaltennamen:\n";
    foreach ($header as $nummer => $name) {
        echo $nummer . ': ' . $name . "\n";
    }

    // Zeigt, welche Zeilen wirklich als Datensatz erkannt wurden
    echo "\nEingelesene Straftatbestände:\n";
    foreach ($daten as $nummer => $datensatz) {
        echo $nummer . ': ' . $datensatz['Straftatbestand'] . "\n";
    }

    // Alle Datensätze vollständig ausgeben
    echo "\nAlle Datensätze:\n";
    //print_r($daten);
}

// Das fertige Array an die Datei zurückgeben, die extract.php lädt
return $daten;