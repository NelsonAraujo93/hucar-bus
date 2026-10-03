import type { Review, ReviewSummary } from './reviews.model';

/**
 * INVENTED CONTENT. Never render this outside the development gallery.
 *
 * These five testimonials and the summary are design placeholders. Publishing invented customer reviews is prohibited in the EU
 * under the Omnibus Directive's amendments to the Unfair Commercial Practices
 * Directive, and this repository is public with main deploying automatically.
 *
 * The file is reachable only from the /ui gallery, which the production build
 * excludes via fileReplacements, so it cannot reach a deployed bundle. Keep it
 * that way: importing it from a page component would ship it.
 */
export const REVIEW_FIXTURE: readonly Review[] = [
  {
    author: 'María López',
    authorUri: null,
    avatar: null,
    rating: 5,
    when: 'hace 2 meses',
    text: 'Puntualidad perfecta y conductor amabilísimo. Nos recogieron en el aeropuerto con un cartelito y llegamos al hotel en un momento. ¡Repetiremos sin duda!',
    translated: false,
  },
  {
    author: 'Thomas Becker',
    authorUri: null,
    avatar: null,
    rating: 5,
    when: 'hace 3 meses',
    text: 'Excursión al Timanfaya organizada de maravilla. El conductor conocía todos los rincones y nos paró en sitios preciosos para fotos. Muy recomendable.',
    translated: true,
  },
  {
    author: 'Carmen Rodríguez',
    authorUri: null,
    avatar: null,
    rating: 4,
    when: 'hace 1 mes',
    text: 'Alquilamos el minibús para una boda y todo salió redondo. Muy profesionales, el coche impecable y los invitados encantados.',
    translated: false,
  },
  {
    author: 'Jan Vermeer',
    authorUri: null,
    avatar: null,
    rating: 5,
    when: 'hace 5 meses',
    text: 'Traslado puntual desde el aeropuerto a las 23:30. Precio justo, vehículo nuevo y cómodo. Atención al cliente de 10 por WhatsApp.',
    translated: true,
  },
  {
    author: 'Laura Pérez',
    authorUri: null,
    avatar: null,
    rating: 3,
    when: 'hace 2 semanas',
    text: 'Un tour privado por el sur de la isla inolvidable. Se adaptaron a nuestros tiempos y recomendaciones de comida perfectas.',
    translated: false,
  },
];

/** Also invented. See above. */
export const REVIEW_SUMMARY_FIXTURE: ReviewSummary = {
  rating: 4.4,
  count: 5,
  mapsUri: 'https://maps.google.com/',
};
