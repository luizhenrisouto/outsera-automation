/** URLs das aplicações de demonstração, sobrescrevíveis pelo .env. */
export const e2eConfig = {
  saucedemoUrl: process.env.SAUCEDEMO_URL ?? 'https://www.saucedemo.com/',
  demoblazeUrl: process.env.DEMOBLAZE_URL ?? 'https://www.demoblaze.com/',
};
