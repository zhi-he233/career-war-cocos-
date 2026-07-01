# UI Prototype

Generate **several radically different UI variations** on a single route, switchable from a floating bottom bar. The user flips between variants in the browser, picks one (or steals bits from each), then throws the rest away.

If the question is about logic/state rather than what something looks like — wrong branch. Use [LOGIC.md](LOGIC.md).

## Career War Context

In this project, UI prototypes are secondary to LOGIC prototypes (because the game logic is the hard part). But they're useful for:
- Cocos scene layout experiments (BattleSeat positions, DicePanel placement)
- Mobile layout testing at different resolutions
- Card design variations for roguelite rewards

## When this is the right shape

- "What should this page look like?"
- "I want to see a few options for this layout before committing."

## Process

### 1. State the question and pick N

Default to **3 variants**. More than 5 stops being radically different and starts being noise.

### 2. Generate radically different variants

Variants must be **structurally different** — different layout, different information hierarchy, different primary affordance, not just different colours.

### 3. Wire them together with a switcher

Use a `?variant=` URL search param to switch. Add a floating bottom bar with left/right arrows.

### 4. Hand it over and capture the answer

Once a variant wins, delete the losers and fold the winner into real code.

## Anti-patterns

- **Variants that differ only in colour or copy.** That's a tweak, not a prototype.
- **Promoting the prototype directly to production.** Rewrite it properly when folding in.
