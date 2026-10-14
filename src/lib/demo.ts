/**
 * The site is not connected to the restaurant's systems. Everything a guest does stays in their browser:
 * the booking is a demo request, table occupancy is an example snapshot, decor prices are invented for the demo.
 *
 * A real launch needs, at the least:
 * - a booking API: free tables for a date, time and duration, holding a table and confirming the booking;
 * - the restaurant's opening hours, deposit and cancellation terms;
 * - real decor prices, and someone at the restaurant who accepts decor requests;
 * - dish composition, portion sizes and allergens from the restaurant;
 * - orders delivered to the restaurant's till or kitchen system instead of this browser's storage.
 *
 * Until then every screen that would promise something says plainly that it is a demo.
 */
export const DEMO_MODE = true
