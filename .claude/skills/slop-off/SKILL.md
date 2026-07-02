---
name: slop-off
description: >
  Verwerk Slop Off browser-rapporten via de slop-off MCP server en
  pas de edits toe op de broncode van het huidige project. Blijft standaard
  in een lus rapporten verwerken tot de gebruiker stopt. Gebruik bij
  "/slop-off", "pas mijn edit-rapport toe", "wacht op mijn browser-edits",
  of nadat de gebruiker in de browser edits heeft gemaakt met de
  Slop Off extensie.
---

# Apply browser edits

Verwerk rapporten van de `slop-off` MCP server en pas ze toe op de bron.

## Modus

- **Standaard (achtergrond-lus)**: het wachten gebeurt in een
  achtergrond-subagent zodat deze hoofdsessie vrij blijft voor ander werk.
  1. Spawn een **watcher** via de Agent-tool: `model: "haiku"`,
     `run_in_background: true`, prompt: *"Roep de slop-off MCP tool
     `wait_for_report` aan met timeout_seconds: 60. Antwoordt hij met 'No
     report arrived', roep hem dan opnieuw aan, tot maximaal 5 keer. Geef
     als eindantwoord uitsluitend de volledige rapporttekst, of exact
     NO_REPORT als er niets kwam."*
  2. Meld éénmalig: "Ik wacht in de achtergrond op browser-edits — zeg
     'stop' als je klaar bent" en ga door met waar de gebruiker mee bezig
     is (of geef de beurt terug).
  3. Zodra de watcher klaar is word je genotificeerd. Rapport ontvangen →
     meld éérst in één regel "📥 N wijziging(en) ontvangen" (N = het aantal
     edits uit de rapport-header), verwerk het dan (zie "Model" hieronder)
     en spawn daarna meteen een nieuwe watcher. NO_REPORT → spawn alleen
     een nieuwe watcher, zonder commentaar. Na ~3 lege watchers op rij:
     vraag de gebruiker één keer of je moet blijven wachten.
  4. Zegt de gebruiker "stop" (of "klaar"), spawn dan geen nieuwe watcher
     meer.
- Argument `once`: verwerk precies één rapport (mag synchroon met
  `wait_for_report`) en stop.
- Argument `latest`: roep `get_latest_report` aan (niet wachten), verwerk,
  stop.
- Argument `list`: roep `list_reports` aan, toon de queue, vraag welke.
- Argument `clear`: roep `clear_reports` aan en meld in één regel hoeveel
  rapporten er zijn geleegd. Niets verwerken, stop daarna.

## Model (licht of zwaar) — verplicht delegeren

Jij bent de orchestrator en verwerkt rapporten NIET zelf. Spawn per rapport
een subagent via de Agent-tool met het model dat het rapport vraagt (de
`model:`-regel in het rapport / de MCP-header):

- **`model: light`** (of geen regel) → `Agent` met `model: "haiku"`
- **`model: heavy`** → `Agent` met `model: "opus"`

Geef de worker-subagent in zijn prompt mee: het volledige rapport, het
werkpad van het project, en de volledige "Edits toepassen"-instructies
hieronder. Laat hem rapporteren welke bestanden zijn gewijzigd en welke
edits niet toepasbaar waren. Meld daarna aan de gebruiker in één regel:
"✅ N wijziging(en) toegepast — bestand1, bestand2". Alleen als er iets
niet lukte een tweede regel: "⚠️ niet toepasbaar: …". Geen verdere uitleg.
Draai de worker synchroon (`run_in_background: false`) zodat rapporten in
volgorde verwerkt worden en workers elkaars bestanden niet raken — het
lange wachten zit al in de achtergrond-watcher, dus dit blokkeert alleen
tijdens het daadwerkelijke toepassen.

Alleen als de Agent-tool niet beschikbaar is verwerk je het rapport zelf.

## Edits toepassen

Het rapport bevat per URL secties met Before/After HTML-paren en/of
Element/Instruction-paren, elk met een CSS-selector als hint.

1. Zoek per edit het bronbestand dat die pagina/HTML rendert: zoek op
   onderscheidende tekst uit het Before-blok (letterlijke strings eerst,
   daarna fuzzy). De URL zegt welke route/pagina; de selector waar in de DOM.
2. Vervang de Before-inhoud door de After-inhoud. Behoud bestaande
   formattering, indentatie en templating (vertaal HTML-wijzigingen naar de
   template/JSX/component als de bron geen platte HTML is).
3. Niet gevonden? Meld het expliciet met de dichtstbijzijnde match — nooit
   stil gokken of overslaan. Ga daarna gewoon door met de lus.
4. Placeholder-, href- en andere attribuutwijzigingen zijn attribuut-edits;
   pas alleen dat attribuut aan.
5. Element/Instruction-paren zijn annotaties: zoek het element (selector +
   Element-snippet) en voer de instructie uit op dat element in de bron.
   Dit zijn vrije opdrachten ("maak dit korter", "andere kleur") — voer ze
   uit naar beste inzicht en meld wat je hebt gedaan.

## Per verwerkt rapport

- Draai een snelle check als het project die heeft (typecheck/lint; geen
  volledige build per rapport in lus-modus).
- Vat in 1-3 regels samen: welke bestanden, welke edits, wat niet lukte.
- Ga direct terug naar wachten.
