import { randomUUID } from 'node:crypto';
import type { Booking } from '../models/booking';

function isoDateFromToday(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Gera uma reserva válida e única por chamada.
 * O sobrenome carrega um sufixo aleatório para isolar a massa: testes em paralelo
 * não enxergam os dados uns dos outros, mesmo numa API pública compartilhada.
 */
export function buildBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    firstname: 'Luiz',
    lastname: `QA-${randomUUID().slice(0, 8)}`,
    totalprice: 350,
    depositpaid: true,
    bookingdates: {
      checkin: isoDateFromToday(30),
      checkout: isoDateFromToday(35),
    },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}
