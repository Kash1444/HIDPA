# Demo runbook

The five-stage sequence, and how to present it.

## Before you start

- [ ] Rotate the Blynk auth token and Wi-Fi password — both are in the public
      git history of the firmware repo.
- [ ] Relabel the Blynk LED widgets from blockage severity to water-level bands
      (console only, no reflash).
- [ ] `npm run build && npm run preview`, or `npm run dev`.
- [ ] Decide the source: **Live rig** with the backend running, or **Demo** if
      the rig is not on the table.
- [ ] Open `/` and confirm the provenance badge says what you expect.

## The sequence

Scenario: **Full demonstration**. It runs `Normal → Partial → Severe → Sensor
fault → Recovery`, about two minutes.

### 1. Normal (0–20 s)
Point at the top row. Flow difference near zero, level steady, condition
`Normal`, confidence around 50%.

> "Two flow sensors, a level sensor, and a pump. Everything agrees."

### 2. Partial blockage (20–45 s)
Downstream flow falls; the platform moves to `Developing blockage` while the
**firmware still says normal**, because the firmware needs a difference of 15.

> "The platform sees it developing before the device threshold trips. That is
> the value of reasoning over a window instead of a single comparison."

### 3. Severe blockage (45–70 s)
Both now agree on a blockage. Level is climbing. Open `/diagnosis` and read the
evidence lines aloud — they are generated, not written.

### 4. Sensor fault (70–95 s) — **the point of the project**
Flow sensor 2 drops to exactly zero. The firmware reports `BLOCKAGE DETECTED`.

Wait about twelve seconds, then show `/diagnosis`:

- Condition becomes `Sensor fault suspected`
- Risk is **not estimated** rather than 100%
- Confidence drops to roughly 35%
- Competing explanations show both hypotheses with weights
- The firmware panel still shows `BLOCKAGE DETECTED`, unchanged

> "The device is not wrong to fire — its rule is doing exactly what it should.
> But the reading it fired on cannot be verified. The platform says so, lowers
> its own confidence, and tells the crew to check a wire before digging."

If asked **why it took twelve seconds**: because the fault followed a real
blockage, and the rising water level from that blockage is genuine evidence that
stays in the window until it ages out. After a normal period the same fault is
flagged in five seconds. Both figures are in `docs/DIAGNOSTIC_RULES.md`.

### 5. Recovery (95–120 s)
Flow returns, level falls, condition walks back through
`Blockage → Developing → Normal`.

## Likely questions

**"What is your model's accuracy?"**
> "There isn't one yet, and the interface says so. The model is untrained
> because we have not captured labelled experiments. Everything you have seen is
> a deterministic rule engine that needs no training data and can explain every
> verdict. The ML pipeline is built and waiting for real data."

That answer is stronger than a number you cannot defend.

**"Why not just use the flow difference?"**
> "Because a disconnected sensor produces a perfect flow difference. That is
> stage four."

**"Can the AI turn the pump off?"**
> "No. It has no write path to the device at all. The firmware owns the pump and
> the safety latch. A bug in our layer cannot move hardware."

**"Is the data real?"**
> Point at the badge. If it says Demo, say so plainly. The badge exists so that
> question always has an honest, instant answer.

## If something breaks

- Backend down → the app shows an offline banner. Switch to Demo and say why.
- Rig offline mid-demo → the stale banner appears and values dim. This is a
  feature; show it, then switch to Demo.
- Nothing renders → `npm run preview` on the built `dist/`.
