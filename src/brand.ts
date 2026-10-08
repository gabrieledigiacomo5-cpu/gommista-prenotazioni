// Compatibilita': l'identita' ora arriva dalla configurazione dell'attivita' (src/business/configs/<slug>.json).
import { business } from './business';

export const brand = {
  name: business.name,
  tagline: business.trade,
  people: business.people || '',
  logo: business.emblem,
};
