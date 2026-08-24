import type { IconName } from '../../shared/ui/icon/icon';

export interface Service {
  readonly icon: IconName;
  readonly title: string;
  readonly body: string;
}

/**
 * The six offerings, in design order.
 *
 * A function rather than a constant so $localize resolves per build. Every
 * user-visible string is tagged: ng extract-i18n does not see plain string
 * literals in TypeScript, so an untagged one here would ship in Spanish on the
 * English site with nothing to warn you.
 *
 * Ids are explicit. Auto-generated hashes change whenever the source text is
 * edited, silently orphaning the translation.
 */
export function services(): readonly Service[] {
  return [
    {
      icon: 'plane',
      title: $localize`:Service name|@@services.airport.title:Traslados Aeropuerto`,
      body: $localize`:Service description|@@services.airport.body:Servicio puerta a puerta desde y hacia el aeropuerto de Lanzarote, 24/7.`,
    },
    {
      icon: 'users',
      title: $localize`:Service name|@@services.excursions.title:Excursiones en Grupo`,
      body: $localize`:Service description|@@services.excursions.body:Descubre los mejores rincones de la isla con nuestros guías locales.`,
    },
    {
      icon: 'car',
      title: $localize`:Service name|@@services.private.title:Alquiler Privado`,
      body: $localize`:Service description|@@services.private.body:Vehículos con conductor para eventos, bodas y ocasiones especiales.`,
    },
    {
      icon: 'building',
      title: $localize`:Service name|@@services.hotel.title:Traslados Hotel`,
      body: $localize`:Service description|@@services.hotel.body:Conexiones cómodas entre hoteles y puntos de interés de la isla.`,
    },
    {
      icon: 'map',
      title: $localize`:Service name|@@services.tours.title:Tours por la Isla`,
      body: $localize`:Service description|@@services.tours.body:Rutas panorámicas por los paisajes volcánicos de Lanzarote.`,
    },
    {
      icon: 'compass',
      title: $localize`:Service name|@@services.custom.title:Servicio a Medida`,
      body: $localize`:Service description|@@services.custom.body:¿Necesitas algo diferente? Diseñamos el trayecto a tu medida.`,
    },
  ];
}
