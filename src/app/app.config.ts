import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { MonitoringErrorHandler } from './core/monitoring/monitoring-error-handler';
import { CONTACT_GATEWAY } from './application/contact/contact-gateway';
import { HttpContactGateway } from './infrastructure/contact/http-contact-gateway';
import { REVIEWS_GATEWAY } from './application/reviews/reviews-gateway';
import { HttpReviewsGateway } from './infrastructure/reviews/http-reviews-gateway';
import { INSTAGRAM_GATEWAY } from './application/instagram/instagram-gateway';
import { HttpInstagramGateway } from './infrastructure/instagram/http-instagram-gateway';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    // Reports to Sentry when monitoring has been consented to, and always
    // delegates to the base handler so the console still gets the error.
    { provide: ErrorHandler, useClass: MonitoringErrorHandler },
    // The composition root: the only place the contact use case meets HTTP.
    { provide: CONTACT_GATEWAY, useExisting: HttpContactGateway },
    { provide: INSTAGRAM_GATEWAY, useExisting: HttpInstagramGateway },
    // Sample reviews in development and previews (TEMPORARY). In production
    // HB_MOCKS is false, so the dynamic import -- and with it the invented
    // reviews -- is removed from the bundle; a static import would not be.
    {
      provide: REVIEWS_GATEWAY,
      useFactory: () =>
        HB_MOCKS
          ? {
              load: async () =>
                (await import('./mocks/mock-reviews-gateway')).mockReviewsGateway.load('en'),
            }
          : inject(HttpReviewsGateway),
    },
  ],
};
