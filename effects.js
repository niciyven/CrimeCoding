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

akten.forEach(element => aktenBeobachter.observe(element));


// ===================================================
// 2. SCHREIBMASCHINEN-EFFEKT
// ===================================================
// "Untersiggenthal" tippt sich Buchstabe für Buchstabe,
// danach knallt der Stempel "Es gilt die Unschuldsvermutung" drauf.

const titel = document.querySelector('.hero h1');
const stempel = document.querySelector('.stempel');

function tippen(element, tempo, fertig) {

    const text = element.textContent;

    // Für Screenreader bleibt der ganze Titel lesbar
    element.setAttribute('aria-label', text.replace(/\u00AD/g, ''));

    // Jeden Buchstaben in ein eigenes <span> packen.
    // So bleibt der Platz reserviert und nichts springt.
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

    // Blinkender Cursor
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden', 'true');
    element.insertBefore(cursor, buchstaben[0]);

    let i = 0;

    const intervall = setInterval(() => {
        buchstaben[i].classList.add('getippt');

        // Cursor hinter den aktuellen Buchstaben setzen
        element.insertBefore(cursor, buchstaben[i].nextSibling);

        i++;

        if (i >= buchstaben.length) {
            clearInterval(intervall);
            if (fertig) fertig();

            // Cursor nach kurzer Zeit ausblenden
            setTimeout(() => cursor.classList.add('aus'), 1800);
        }
    }, tempo);
}

if (titel && stempel) {
    if (wenigBewegung) {
        stempel.classList.add('gestempelt');
    } else {
        // Titel verstecken, damit er nicht kurz aufblitzt
        titel.style.visibility = 'hidden';

        // kurz warten, bis die Karte eingeflogen ist
        setTimeout(() => {
            titel.style.visibility = '';
            tippen(titel, 95, () => {
                setTimeout(() => stempel.classList.add('gestempelt'), 300);
            });
        }, 600);
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
// 5. AKTE ÖFFNEN
// ===================================================
// Der Inhalt unter dem Titel ist zuerst versteckt. Erst nach dem
// Klick auf "Akte öffnen" klappt der Deckel auf, die Mappe
// verschwindet und der Inhalt entfaltet sich wie Papier.

const aktendeckelBereich = document.getElementById('aktendeckel');
const aktendeckel = document.querySelector('.aktendeckel');
const akteKnopf = document.querySelector('.akte-oeffnen');
const akteInhalt = document.getElementById('akte-inhalt');

let akteIstOffen = false;

function akteOeffnen(ziel) {

    // Schon offen? Dann nur noch hinscrollen
    if (akteIstOffen) {
        if (ziel) ziel.scrollIntoView({ behavior: 'smooth' });
        return;
    }
    akteIstOffen = true;

    akteKnopf.setAttribute('aria-expanded', 'true');

    const pause = wenigBewegung ? 0 : 900;

    // 1. Deckel klappt auf
    aktendeckel.classList.add('offen');

    setTimeout(() => {
        // 2. Mappe verschwindet, 3. Inhalt klappt auf
        aktendeckelBereich.hidden = true;
        akteInhalt.classList.add('offen');

        // Die Grafiken kennen jetzt ihre richtige Grösse
        window.dispatchEvent(new Event('resize'));

        // 4. Zum gewünschten Kapitel scrollen (Standard: "Der Fall").
        // Wir rechnen die Position selbst aus, weil der Inhalt während
        // des Aufklappens noch schräg steht und der Browser sonst an
        // die falsche Stelle scrollen würde.
        requestAnimationFrame(() => {
            const kapitel = ziel || document.getElementById('fall');
            let oben = 0;
            for (let el = kapitel; el; el = el.offsetParent) {
                oben += el.offsetTop;
            }
            window.scrollTo({
                top: oben - 80,   // Platz für die Navigation
                behavior: wenigBewegung ? 'auto' : 'smooth'
            });
        });
    }, pause);
}

if (akteKnopf && akteInhalt) {

    akteKnopf.addEventListener('click', () => akteOeffnen());

    // Klickt jemand in der Navigation auf ein Kapitel, während die
    // Akte noch zu ist: zuerst öffnen, dann dorthin scrollen.
    navLinks.forEach(link => {
        link.addEventListener('click', event => {
            const ziel = document.querySelector(link.getAttribute('href'));

            if (ziel && akteInhalt.contains(ziel) && !akteIstOffen) {
                event.preventDefault();
                document.getElementById('aktendeckel')
                    .scrollIntoView({ behavior: 'smooth', block: 'center' });
                akteOeffnen(ziel);
            }
        });
    });
}