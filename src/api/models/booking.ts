import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'data no formato AAAA-MM-DD');

/** Contrato de uma reserva, como a API devolve no GET /booking/:id e no PUT. */
export const bookingSchema = z.object({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  totalprice: z.number().int().nonnegative(),
  depositpaid: z.boolean(),
  bookingdates: z.object({
    checkin: isoDate,
    checkout: isoDate,
  }),
  additionalneeds: z.string().optional(),
});

/** Resposta do POST /booking: o id gerado e a reserva gravada. */
export const createdBookingSchema = z.object({
  bookingid: z.number().int().positive(),
  booking: bookingSchema,
});

/** Item da listagem GET /booking. */
export const bookingIdListSchema = z.array(z.object({ bookingid: z.number().int().positive() }));

export const authTokenSchema = z.object({ token: z.string().min(1) });

export type Booking = z.infer<typeof bookingSchema>;
export type CreatedBooking = z.infer<typeof createdBookingSchema>;
