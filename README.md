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

## Good to know

- There is no server. Tables, guests, the menu and orders live in the visitor's browser,
  so they are not shared between devices.
- The staff PIN is checked in the browser and is visible in the code. Fine for a demo, not for production.
- Pushing to `main` publishes the site to GitHub Pages (`.github/workflows/deploy.yml`).
