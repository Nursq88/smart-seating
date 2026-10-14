# Smart Seating Experience

Hackathon prototype: a restaurant seats guests by the purpose of their visit, shows the floor in 3D,
and takes orders straight from the table.

## Run locally

```
npm install
npm run dev
```

## Addresses

| Who | Address |
|---|---|
| Guest, main site (booking) | `/` |
| Guest, QR code on a table (menu and ordering) | `/#/table/7` |
| Staff panel (PIN) | `/#/staff` |

## Example data

The demo opens with the name and a selection of the public menu of the restaurant Sandyq, Almaty
(sandyq.kz, menu dated 30 January 2026). It is example data for the hackathon; the project is not
affiliated with the restaurant, and the 3D floor is an invented layout, not the restaurant's real plan.

## Demo mode

The site is not connected to the restaurant, and says so on the first screen, in the header and before
every confirmation (`DEMO_MODE` in `src/lib/demo.ts`):

- a booking is a demo request: it lives in the open tab, shows in the staff panel of that tab and is gone after a reload;
- table occupancy is a fixed example and does not depend on the chosen date, time or length of visit;
- decor prices are placeholders, labelled as demo prices (`src/lib/decor.ts`);
- dish composition, portions and allergens are not in the example menu, so the dish card says they are unknown;
- orders reach only the demo staff screen in the same browser.

A real launch needs a booking API (free tables per date, time and duration; holding and confirming a table),
the restaurant's opening hours, deposit and cancellation terms, real decor prices, dish details and allergens
from the restaurant, and orders sent to the restaurant's till or kitchen system.

## Good to know

- There is no server. Tables, guests, the menu and orders live in the visitor's browser,
  so they are not shared between devices.
- The staff PIN is checked in the browser and is visible in the code. Fine for a demo, not for production.
- Pushing to `main` publishes the site to GitHub Pages (`.github/workflows/deploy.yml`).
