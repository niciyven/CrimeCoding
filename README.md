# CrimeCoding – Sexualisierte Gewalt in der Schweiz 2025

## Projektidee

Für unser Projekt **CrimeCoding** beschäftigen wir uns mit sexualisierter Gewalt in der Schweiz. Als erzählerischen Ausgangspunkt verwenden wir den aktuellen Fall eines ehemaligen Aargauer SVP-Grossrats. Dieser Fall soll später als roter Faden dienen und mit den statistischen Daten zu sexualisierter Gewalt in der Schweiz 2025 verknüpft werden.

Ziel ist es, den einzelnen Fall in einen grösseren statistischen Kontext einzuordnen. Dabei möchten wir unter anderem untersuchen, welche Straftatbestände besonders häufig vorkommen und wie sich die erfassten Fälle nach Geschlecht und Alter der geschädigten Personen verteilen.

## Datengrundlage

Als Grundlage verwenden wir einen Datensatz vom Bundesamt für Statistik zu **sexualisierter Gewalt in der Schweiz im Jahr 2025**.

Der Datensatz enthält unter anderem:

- verschiedene Straftatbestände nach StGB
- Anzahl männlicher und weiblicher geschädigter Personen
- verschiedene Altersgruppen
- Aufteilung der Altersgruppen nach Geschlecht

Die ursprünglichen Daten wurden für unser Projekt auf die benötigten Informationen reduziert und als CSV-Datei aufbereitet.


## Vorgehen

### 21.09.2026 – Themenwahl und Recherche
- Thema **CrimeCoding** gewählt
- erste Fragestellungen und Hypothesen formuliert: Bei mindestens jedem zweiten registrierten Sexualdelikt ist die geschädigte Person unter 30 Jahre alt.
- geeigneten Datensatz gesucht und gefunden
- Idee entwickelt, den statistischen Datensatz mit dem Fall des ehemaligen Aargauer Grossrats als erzählerischem Einstieg zu verbinden

### 28.09.2026 – Datenaufbereitung
- ursprüngliche Daten heruntergeladen
- für unsere Fragestellung nicht relevante Informationen aussortiert
- eigenen CSV-Datensatz erstellt

### 29.09.2026 – Extract & Transform
Die CSV-Datei wurde mit PHP eingelesen und in ein PHP-Array umgewandelt. Wir mussten den ursprünglichen Datensatz im Transform-Schritt bereinigen 
und auf die für unsere Fragestellung relevanten Werte reduzieren. Dabei wurden alle mit „X“ gekennzeichneten Werte durch null ersetzt, da hier keine konkrete Zahl angegeben war.
Zusätzlich haben wir Total-Spalten, die Altersgruppe „ohne Angabe“ sowie weitere für unsere Auswertung nicht benötigte Angaben wie die Nationalität entfernt. So enthält der Datensatz nur noch die für unsere Visualisierungen relevanten Informationen zu Straftatbestand, Altersgruppen und Geschlecht.

### 30.09.2026 – Load & Datenbank
Die transformierten Daten wurden anschliessend in unsere Datenbank geladen.

Wir haben uns bewusst für **zwei miteinander verknüpfte Tabellen** entschieden:

1. eine Tabelle für die Straftatbestände
2. eine Tabelle für die statistischen Werte nach Alter und Geschlecht

Die Tabellen werden über einen **Fremdschlüssel** miteinander verbunden. Dadurch wird der Name eines Straftatbestandes nur einmal gespeichert. Sollte sich beispielsweise die Bezeichnung eines Straftatbestandes ändern, muss sie nur an einer Stelle angepasst werden.
![WhatsApp Image 2026-09-30 at 10.15.24.jpeg](../../../../../Downloads/WhatsApp%20Image%202026-09-30%20at%2010.15.24.jpeg)

## Frontend & Gestaltung

Nachdem die Daten erfolgreich in die Datenbank geladen waren, haben wir uns an die Gestaltung der Website gemacht.

Für das visuelle Konzept wollten wir eine Darstellung entwickeln, die an einen **Aktenfall bzw. eine Ermittlungsakte** erinnert. Dadurch soll der Fall auch gestalterisch als roter Faden durch die Data-Story führen.

Für die Datenvisualisierung haben wir uns hauptsächlich für **Bar Charts mit Chart.js** entschieden. Diese Darstellungsform eignete sich für unsere Daten am besten, da sich Unterschiede zwischen den verschiedenen Straftatbeständen, Geschlechtern und Altersgruppen übersichtlich vergleichen lassen.

Die Daten werden über unser Backend aus der Datenbank geladen und anschliessend mit JavaScript in die verschiedenen Grafiken übertragen.

## Learnings

Ein wichtiges Learning aus dem Projekt war, wie entscheidend eine gute Vorbereitung der Daten ist. Je sauberer die Daten bereits bei **Extract und Transform** aufbereitet werden, desto einfacher funktionieren später sowohl die Datenbank als auch das Frontend.

Da unsere Daten nach der Bereinigung bereits eine klare Struktur hatten, konnten wir sie im Frontend relativ problemlos aus der Datenbank übernehmen und mit Chart.js visualisieren.

Wir haben dadurch gemerkt, dass ein funktionierendes Frontend stark davon abhängt, wie gut die Arbeit im Backend vorbereitet wurde.

## Schwierigkeiten

Eine erste Schwierigkeit hatten wir beim Erstellen des **Datenvertrags**. Zu Beginn war für uns noch schwer vorstellbar, wie die Daten später in der Datenbank verwendet werden und welche Informationen wir dafür tatsächlich benötigen. Dadurch hatten wir anfangs noch einige Unklarheiten in der Struktur.

Nachdem wir den Aufbau der Datenbank und die spätere Nutzung besser verstanden hatten, konnten wir den Datensatz gezielt bereinigen und auf die wirklich benötigten Werte reduzieren.

Eine weitere Schwierigkeit entstand beim Einbauen der Hintergrundmusik auf der Website. Wir wollten, dass die Musik automatisch beim Öffnen der Seite startet. Moderne Browser blockieren jedoch in vielen Fällen das automatische Abspielen von Audio, solange die Nutzer*innen noch nicht mit der Website interagiert haben. Dadurch startet die Musik erst nach dem ersten Klick auf die Seite. Die Suche nach einer technischen Lösung dafür hat uns vergleichsweise viel Zeit gekostet.

## Verwendete Ressourcen & Tools

Für die Umsetzung des Projekts haben wir verschiedene Tools und Ressourcen verwendet:

- **ChatGPT & Claude** – Unterstützung bei PHP, JavaScript, Chart.js und Fehlersuche
- **Chart.js** – Darstellung der Datenvisualisierungen
- **Pinterest** – Inspiration für das visuelle Konzept und die Gestaltung im Stil einer Ermittlungsakte
- **Squoosh** – Komprimierung und Optimierung der verwendeten Bilder
- **Envato** – Sounds und Audioelemente
- **Adobe Audition** – Bearbeitung und Anpassung der Sounds