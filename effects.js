// ===================================================
// EFFEKTE – Akten fliegen rein, Schreibmaschine, Navigation
// ===================================================

// Hat die Person "Bewegung reduzieren" im Betriebssystem aktiviert?
const wenigBewegung = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


// ===================================================
// 1. AKTEN FLIEGEN REIN
// ===================================================
// Alle Papierkarten, Fotos und Fakten-Kästchen starten unsichtbar,
// etwas tiefer und schräg. Sobald sie ins Bild kommen, "landen" sie
// auf dem Tisch.
//
// Die Grafik-Tafeln (.beweis-tafel) sind bewusst NICHT dabei:
// Sie haben ihre eigene Balken-Animation in script.js. Würden sie
// zusätzlich einfliegen, liefe die Balken-Animation ab, während die
// Tafel noch unsichtbar ist – und man sähe sie nicht.

const akten = document.querySelectorAll(
    '.papier, .foto, .fakt'
);

akten.forEach((element, index) => {

    element.classList.add('einfliegen');

    // Jede Akte bekommt eine leicht andere Drehung (abwechselnd links/rechts)
    const richtung = index % 2 === 0 ? -1 : 1;
    const drehung = richtung * (4 + Math.random() * 4);   // 4–8 Grad
    element.style.setProperty('--dreh', drehung + 'deg');

    // Elemente, die nebeneinander liegen, kommen leicht nacheinander
    const geschwister = element.parentElement.querySelectorAll(':scope > .foto, :scope > .fakt');
    const position = Array.from(geschwister).indexOf(element);
    if (position > 0) {
        element.style.setProperty('--verzoegerung', (position * 0.15) + 's');
    }
});

const aktenBeobachter = new IntersectionObserver(eintraege => {
    eintraege.forEach(eintrag => {
        if (eintrag.isIntersecting) {
            eintrag.target.classList.add('gelandet');

            // Nur einmal einfliegen lassen.
            // Soll es jedes Mal passieren, diese Zeile löschen
            // und im else-Zweig die Klasse wieder entfernen.
            aktenBeobachter.unobserve(eintrag.target);
        }
    });
}, {
    threshold: 0.15
});

// Gibt es den Startbildschirm, fliegen die Karten und Fotos oben
// erst ein, wenn die Akte geöffnet wurde (Teil 5).
const mitStartbildschirm = !!document.getElementById('intro');

akten.forEach(element => {
    if (mitStartbildschirm && element.closest('.hero')) return;
    aktenBeobachter.observe(element);
});


// ===================================================
// 2. SCHREIBMASCHINEN-EFFEKT
// ===================================================
// "Untersiggenthal" tippt sich Buchstabe für Buchstabe,
// danach knallt der Stempel "Es gilt die Unschuldsvermutung" drauf.

const titel = document.querySelector('.hero h1');
const stempel = document.querySelector('.stempel');

// ---------- Schreibmaschinen-Ton ----------
// Der Ton kommt aus einer Audiodatei (<audio id="tippton"> in index.html).
// Damit Ton und Buchstaben zusammen fertig werden, passt sich das
// Tipptempo an die Länge der Datei an:
//   Tempo = Länge der Datei / Anzahl Buchstaben
// Ist der Ton aus (oder die Datei fehlt), tippt der Titel im normalen
// Tempo ohne Ton.
//
// Der Ton wird direkt beim ersten Tippen versucht. Manche Browser
// blockieren Ton, bis man geklickt hat – dann tippt der Titel stumm.
// Klickt man oben rechts auf "Ton an", tippt er sich nochmals mit Ton.

const tippton = document.getElementById('tippton');

const NORMALES_TEMPO = 95;     // Millisekunden pro Buchstabe ohne Ton
const MIN_TEMPO = 40;          // schneller wird's nie
const MAX_TEMPO = 300;         // langsamer wird's nie

// Ist der Ton eingeschaltet? (wird im Teil 6 "Ton" gesetzt)
let tonAn = false;

// Hat jemand den Ton absichtlich ausgeschaltet?
// Dann gibt es keinen Ton mehr, auch nicht beim Öffnen der Akte.
let tonBewusstAus = false;

function tippen(element, tempo, fertig) {

    // Den Originaltext beim ersten Mal merken, damit man den Titel
    // später nochmals tippen lassen kann (beim Einschalten des Tons).
    if (element.dataset.text === undefined) {
        element.dataset.text = element.textContent;
    }
    const text = element.dataset.text;

    // Läuft schon ein Tippen? Dann abbrechen und neu beginnen.
    clearInterval(element._tippen);

    // Für Screenreader bleibt der ganze Titel lesbar
    element.setAttribute('aria-label', text.replace(/\u00AD/g, ''));

    // Jeden Buchstaben in ein eigenes <span> packen.
    // Noch nicht getippte Buchstaben sind unsichtbar, nehmen aber
    // schon ihren Platz ein. So bricht der Titel von Anfang an
    // genau gleich um wie am Schluss und nichts springt.
    element.textContent = '';
    const buchstaben = [];

    for (const zeichen of text) {
        const span = document.createElement('span');
        span.className = 'taste';
        span.setAttribute('aria-hidden', 'true');
        span.textContent = zeichen;
        element.appendChild(span);
        buchstaben.push(span);
    }

    // Der blinkende Cursor ist KEIN eigenes Element zwischen den
    // Buchstaben (das hat den Titel umbrechen lassen), sondern hängt
    // per CSS (::after) am zuletzt getippten Buchstaben und braucht
    // keinen Platz.
    //
    // Damit er auf derselben Grundlinie sitzt wie die Buchstaben,
    // messen wir einmal, wie weit die Grundlinie vom oberen Rand
    // eines Buchstabens entfernt ist. offsetTop ignoriert Drehungen,
    // darum stört die schräge Karte die Messung nicht.
    const messpunkt = document.createElement('span');
    messpunkt.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    buchstaben[0].appendChild(messpunkt);
    const grundlinie = messpunkt.offsetTop - buchstaben[0].offsetTop;
    messpunkt.remove();
    element.style.setProperty('--grundlinie', grundlinie + 'px');

    let i = 0;

    // Ein Buchstabe pro Schritt. Der erste kommt sofort (nicht erst
    // nach einer Pause), damit er genau mit dem Ton beginnt.
    let intervall;

    function schritt() {
        if (i > 0) buchstaben[i - 1].classList.remove('cursor-hier');
        buchstaben[i].classList.add('getippt', 'cursor-hier');

        i++;

        if (i >= buchstaben.length) {
            clearInterval(intervall);
            if (fertig) fertig();

            // Cursor nach kurzer Zeit ausblenden
            setTimeout(() => buchstaben[i - 1].classList.remove('cursor-hier'), 1800);
        }
    }

    schritt();
    intervall = setInterval(schritt, tempo);

    element._tippen = intervall;
}

// Titel tippen, danach den Stempel draufknallen.
// Mit Ton: Tempo so wählen, dass Tippen und Tondatei gleich lang sind.
//
// Der Schreibmaschinen-Ton wird JEDES Mal versucht, auch direkt beim
// Laden der Seite. Ob er wirklich erklingt, entscheidet der Browser:
// Erlaubt er es, tippt der Titel synchron zum Ton. Blockiert er es,
// tippt der Titel im normalen Tempo stumm weiter.
function titelTippen() {
    stempel.classList.remove('gestempelt');

    const text = titel.dataset.text ?? titel.textContent;
    const anzahl = text.replace(/\u00AD/g, '').length;   // ohne Trennstrich

    function starten(tempo) {
        titel.style.visibility = '';
        tippen(titel, tempo, () => {
            setTimeout(() => {
                stempel.classList.add('gestempelt');

                // Erst wenn der Titel fertig ist, setzt die Musik ein
                if (tonAn) musikStarten();
            }, 300);
        });
    }

    // Kein Ton gewünscht oder keine Datei: stumm tippen
    if (!tippton || tonBewusstAus) {
        starten(NORMALES_TEMPO);
        return;
    }

    let gestartet = false;
    function einmalStarten(tempo) {
        if (gestartet) return;
        gestartet = true;
        starten(tempo);
    }

    function tonVersuchen() {
        let tempo = NORMALES_TEMPO;
        if (tippton.duration > 0 && isFinite(tippton.duration)) {
            tempo = (tippton.duration * 1000) / anzahl;
            tempo = Math.min(MAX_TEMPO, Math.max(MIN_TEMPO, tempo));
        }

        tippton.currentTime = 0;
        tippton.play()
            .then(() => einmalStarten(tempo))                // Ton läuft -> synchron tippen
            .catch(() => einmalStarten(NORMALES_TEMPO));     // blockiert -> stumm tippen
    }

    // Länge der Datei muss bekannt sein, bevor wir das Tempo berechnen
    if (tippton.duration > 0) {
        tonVersuchen();
    } else {
        tippton.addEventListener('loadedmetadata', tonVersuchen, { once: true });
        tippton.load();
        // Datei fehlt oder lädt zu langsam: nach 1 s stumm loslegen
        setTimeout(() => einmalStarten(NORMALES_TEMPO), 1000);
    }
}

if (titel && stempel) {
    if (wenigBewegung) {
        stempel.classList.add('gestempelt');
    } else {
        // Titel verstecken, damit er nicht kurz aufblitzt
        titel.style.visibility = 'hidden';

        // Erst tippen, wenn die Schrift (Oswald) geladen ist.
        // Sonst wechselt die Schrift mitten im Tippen, die Buchstaben
        // werden breiter und der Titel springt in eine neue Zeile.
        const schriftBereit = document.fonts ? document.fonts.ready : Promise.resolve();

        // Gibt es einen Einstiegsbildschirm, startet das Tippen erst
        // nach dem Klick dort (Teil 7). Sonst wie gewohnt nach dem Laden.
        if (!document.getElementById('intro')) {
            schriftBereit.then(() => setTimeout(titelTippen, 600));
        }
    }
}


// ===================================================
// 3. AKTIVE NAVIGATION
// ===================================================
// Ein roter Strich wandert unter den Menüpunkt des Kapitels,
// in dem man sich gerade befindet.

const navListe = document.querySelector('.nav ul');
const navLinks = document.querySelectorAll('.nav a[href^="#"]');

// Den roten Strich erzeugen
const navStrich = document.createElement('span');
navStrich.className = 'nav-strich';
navListe.appendChild(navStrich);

function strichSetzen(link) {
    navLinks.forEach(l => l.classList.remove('aktiv'));
    link.classList.add('aktiv');

    navStrich.style.width = link.offsetWidth + 'px';
    navStrich.style.left = link.offsetLeft + 'px';
    navStrich.style.top = (link.offsetTop + link.offsetHeight) + 'px';
}

// Welcher Link gehört zu welchem Kapitel?
const kapitelZuLink = new Map();

navLinks.forEach(link => {
    const ziel = document.querySelector(link.getAttribute('href'));
    if (ziel) {
        kapitelZuLink.set(ziel, link);
    }
});

// Ein Kapitel gilt als aktiv, wenn es die Bildschirmmitte berührt
const navBeobachter = new IntersectionObserver(eintraege => {
    eintraege.forEach(eintrag => {
        if (eintrag.isIntersecting) {
            strichSetzen(kapitelZuLink.get(eintrag.target));
        }
    });
}, {
    rootMargin: '-45% 0px -50% 0px'
});

kapitelZuLink.forEach((link, kapitel) => navBeobachter.observe(kapitel));

// Startposition und Anpassung bei Fenstergrösse
window.addEventListener('load', () => {
    strichSetzen(document.querySelector('.nav a.aktiv') || navLinks[0]);
});

window.addEventListener('resize', () => {
    const aktiv = document.querySelector('.nav a.aktiv');
    if (aktiv) strichSetzen(aktiv);
});


// ===================================================
// 4. ZAHLEN ZÄHLEN HOCH
// ===================================================
// 140, 44, 3 und der Prozentwert der unter 30-Jährigen laufen beim
// Reinscrollen von 0 hoch – jedes Mal, wie die Balken der Grafiken.

const zaehlZahlen = document.querySelectorAll('.fakt-zahl, #anteilU30');

// Zielwert und Zusatz (z. B. " %") aus dem Text lesen und merken.
// Der Prozentwert wird erst von script.js eingesetzt, sobald die
// Daten geladen sind – darum wird er erst beim Reinscrollen gelesen.
function zielLesen(element) {
    if (element.dataset.ziel !== undefined) {
        return true;
    }

    const match = element.textContent.trim().match(/^(\d+)(.*)$/);
    if (!match) {
        return false;   // noch keine Zahl da (z. B. "–")
    }

    element.dataset.ziel = match[1];
    element.dataset.zusatz = match[2];
    return true;
}

function zahlSetzen(element, wert) {
    element.textContent = wert + (element.dataset.zusatz || '');
}

function hochzaehlen(element) {
    const ziel = Number(element.dataset.ziel);
    const dauer = 1500;   // Millisekunden
    const start = performance.now();

    // laufende Zählung abbrechen, falls man schnell hin und her scrollt
    cancelAnimationFrame(element._zaehler);

    function schritt(jetzt) {
        const fortschritt = Math.min((jetzt - start) / dauer, 1);

        // schnell starten, sanft abbremsen (wie die Balken)
        const sanft = 1 - Math.pow(1 - fortschritt, 4);

        zahlSetzen(element, Math.round(ziel * sanft));

        if (fortschritt < 1) {
            element._zaehler = requestAnimationFrame(schritt);
        }
    }

    element._zaehler = requestAnimationFrame(schritt);
}

// Zahlen, die schon im HTML stehen (140, 44, 3), gleich auf 0 setzen
if (!wenigBewegung) {
    zaehlZahlen.forEach(element => {
        if (zielLesen(element)) {
            zahlSetzen(element, 0);
        }
    });
}

const zahlenBeobachter = new IntersectionObserver(eintraege => {
    eintraege.forEach(eintrag => {
        const element = eintrag.target;

        if (wenigBewegung || !zielLesen(element)) {
            return;
        }

        if (eintrag.isIntersecting) {
            hochzaehlen(element);
        } else {
            // beim Wegscrollen zurück auf 0 – so zählt es beim nächsten Mal neu
            cancelAnimationFrame(element._zaehler);
            zahlSetzen(element, 0);
        }
    });
}, {
    threshold: 0.6
});

zaehlZahlen.forEach(element => zahlenBeobachter.observe(element));


// ===================================================
// 5. AKTE ÖFFNEN (Startbildschirm)
// ===================================================
// Beim Laden zeigt der Startbildschirm nur die geschlossene Akte.
// Klick auf "Akte öffnen":
//   1. Ton wird freigeschaltet (der Klick erlaubt es dem Browser)
//   2. Deckel klappt auf, der Startbildschirm blendet aus
//   3. Oben erscheint die Seite, die Karten fliegen ein
//   4. "Untersiggenthal" tippt sich mit Schreibmaschinen-Ton
//   5. Stempel, danach setzt die Musik ein

const intro = document.getElementById('intro');
const aktendeckel = document.querySelector('.aktendeckel');
const akteKnopf = document.querySelector('.akte-oeffnen');
const akteInhalt = document.getElementById('akte-inhalt');

let akteIstOffen = false;

// Tondateien innerhalb des Klicks einmal stumm anspielen und sofort
// stoppen. Danach darf der Browser sie später abspielen
// (wichtig vor allem für Safari und iPhone).
function tonFreischalten(audio) {
    if (!audio) return;
    audio.muted = true;
    audio.play()
        .then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.muted = false;
        })
        .catch(() => { audio.muted = false; });
}

function akteOeffnen() {
    if (akteIstOffen) return;
    akteIstOffen = true;

    akteKnopf.setAttribute('aria-expanded', 'true');

    // 1. Ton freischalten – muss direkt im Klick passieren
    if (!tonBewusstAus) {
        tonFreischalten(tippton);
        tonFreischalten(musik);
        tonEinschalten(false, false);   // Musik kommt erst nach dem Titel
    }

    const pause = wenigBewegung ? 0 : 900;

    // 2. Deckel klappt auf
    aktendeckel.classList.add('offen');
    intro.classList.add('offen');

    setTimeout(() => {
        // Startbildschirm ausblenden, Seite freigeben
        intro.classList.add('weg');
        document.body.classList.remove('intro-aktiv');
        akteInhalt.classList.add('offen');
        window.scrollTo(0, 0);

        // Die Grafiken kennen jetzt ihre richtige Grösse
        window.dispatchEvent(new Event('resize'));

        // 3. Karten und Fotos oben einfliegen lassen
        document.querySelectorAll('.hero .einfliegen').forEach(element => {
            aktenBeobachter.observe(element);
        });

        // 4. Titel tippen (mit Ton, falls eingeschaltet)
        if (titel && stempel && !wenigBewegung) {
            const schriftBereit = document.fonts ? document.fonts.ready : Promise.resolve();
            schriftBereit.then(() => setTimeout(titelTippen, 600));
        } else if (tonAn) {
            musikStarten();
        }
    }, pause);
}

if (akteKnopf) {
    akteKnopf.addEventListener('click', akteOeffnen);
}

// "Ohne Ton öffnen": Ton bleibt aus (keine Musik, keine Schreibmaschine).
// Oben rechts kann man ihn später trotzdem mit "Ton an" einschalten.
const stummKnopf = document.querySelector('.intro-stumm');

if (stummKnopf) {
    stummKnopf.addEventListener('click', () => {
        tonBewusstAus = true;
        tonKnopf.setAttribute('aria-pressed', 'false');
        tonText.textContent = 'Ton an';
        akteOeffnen();
    });
}


// ===================================================
// 6. TON (Musik + Schreibmaschine)
// ===================================================
// Der Knopf oben rechts ist von Anfang an da.
// - Klick auf "Ton an": Musik startet, und der Titel tippt sich
//   nochmals mit Schreibmaschinen-Ton (Datei, siehe Teil 2).
// - Klick auf "Akte öffnen" (Startbildschirm): Ton geht an, der Titel
//   tippt mit Schreibmaschinen-Ton, danach setzt die Musik ein.
// - Klick auf "Ton aus": Musik wird leiser und stoppt, kein Tippen mehr.

const tonKnopf = document.querySelector('.ton-knopf');
const musik = document.getElementById('musik');
const tonText = document.querySelector('.ton-text');

const ZIEL_LAUTSTAERKE = 0.4;   // Musik: 0 = stumm, 1 = volle Lautstärke
let ueberblendung;


function lautstaerkeAendern(ziel, dauer, fertig) {
    clearInterval(ueberblendung);
    const start = musik.volume;
    const schritte = 30;
    let schritt = 0;

    ueberblendung = setInterval(() => {
        schritt++;
        musik.volume = start + (ziel - start) * (schritt / schritte);
        if (schritt >= schritte) {
            clearInterval(ueberblendung);
            if (fertig) fertig();
        }
    }, dauer / schritte);
}

// Musik leise starten und lauter werden lassen (nur wenn sie nicht schon läuft)
function musikStarten() {
    if (!musik || !musik.paused) return;
    musik.volume = 0;
    musik.play()
        .then(() => lautstaerkeAendern(ZIEL_LAUTSTAERKE, 1500))
        .catch(() => { tonText.textContent = 'Musik nicht gefunden'; });
}

function tonEinschalten(titelNeuTippen, mitMusik) {
    tonAn = true;
    tonBewusstAus = false;

    tonKnopf.setAttribute('aria-pressed', 'true');
    tonText.textContent = 'Ton aus';

    if (mitMusik) musikStarten();

    // Titel nochmals tippen – aber nur, wenn man ihn gerade sieht
    if (titelNeuTippen && titel && !wenigBewegung) {
        const oben = titel.getBoundingClientRect();
        if (oben.bottom > 0 && oben.top < window.innerHeight) {
            titelTippen();
        }
    }
}

function tonAusschalten() {
    tonAn = false;
    tonKnopf.setAttribute('aria-pressed', 'false');
    tonText.textContent = 'Ton an';
    if (musik) lautstaerkeAendern(0, 800, () => musik.pause());
    if (tippton) tippton.pause();
}

if (tonKnopf) {
    tonKnopf.addEventListener('click', () => {
        if (tonAn) {
            tonBewusstAus = true;
            tonAusschalten();
        } else {
            tonEinschalten(true, true);
        }
    });
}