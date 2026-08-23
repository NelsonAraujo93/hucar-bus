import { InjectionToken } from '@angular/core';
import {
  SUPPORTED_LOCALES as SUPPORTED_LOCALE_LIST,
  type SupportedLocale,
} from '../../../shared/i18n/negotiate-locale';

/**
 * The locales the app is built for. Sourced from the shared i18n module rather
 * than restated, so the list exists in exactly one place -- the middleware, the
 * negotiation logic and the UI all read the same definition.
 */
export const SUPPORTED_LOCALES = new InjectionToken<readonly SupportedLocale[]>(
  'hb.supportedLocales',
  {
    providedIn: 'root',
    factory: () => SUPPORTED_LOCALE_LIST,
  },
);
