import type { Review, ReviewSummary } from './reviews.model';

/**
 * INVENTED CONTENT. Never render this outside the development gallery.
 *
 * These five testimonials, the 4.8 average and the "120+" count are design
 * placeholders. Publishing invented customer reviews is prohibited in the EU
 * under the Omnibus Directive's amendments to the Unfair Commercial Practices
 * Directive, and this repository is public with main deploying automatically.
 *
 * The file is reachable only from the /ui gallery, which the production build
 * excludes via fileReplacements, so it cannot reach a deployed bundle. Keep it
 * that way: importing it from a page component would ship it.
 */
export const REVIEW_FIXTURE: readonly Review[] = [
  {
    name: 'María López',
    when: 'hace 2 meses',
    text: 'Puntualidad perfecta y conductor amabilísimo. Nos recogieron en el aeropuerto con un cartelito y llegamos al hotel en un momento. ¡Repetiremos sin duda!',
  },
  {
    name: 'Thomas Becker',
    when: 'hace 3 meses',
    text: 'Excursión al Timanfaya organizada de maravilla. El conductor conocía todos los rincones y nos paró en sitios preciosos para fotos. Muy recomendable.',
  },
  {
    name: 'Carmen Rodríguez',
    when: 'hace 1 mes',
    text: 'Alquilamos el minibús para una boda y todo salió redondo. Muy profesionales, el coche impecable y los invitados encantados.',
  },
  {
    name: 'Jan Vermeer',
    when: 'hace 5 meses',
    text: 'Traslado puntual desde el aeropuerto a las 23:30. Precio justo, vehículo nuevo y cómodo. Atención al cliente de 10 por WhatsApp.',
  },
  {
    name: 'Laura Pérez',
    when: 'hace 2 semanas',
    text: 'Un tour privado por el sur de la isla inolvidable. Se adaptaron a nuestros tiempos y recomendaciones de comida perfectas.',
  },
];

/** Also invented. See above. */
export const REVIEW_SUMMARY_FIXTURE: ReviewSummary = {
  average: '4.8',
  count: '120+',
};
