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
