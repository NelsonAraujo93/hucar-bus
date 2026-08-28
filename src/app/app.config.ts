import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { MonitoringErrorHandler } from './core/monitoring/monitoring-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    // Reports to Sentry when monitoring has been consented to, and always
    // delegates to the base handler so the console still gets the error.
    { provide: ErrorHandler, useClass: MonitoringErrorHandler },
  ],
};
