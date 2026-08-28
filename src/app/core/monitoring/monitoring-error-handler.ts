import { ErrorHandler, inject, Injectable } from '@angular/core';
import { Monitoring } from './monitoring';

/**
 * Forwards uncaught errors to Sentry, when Sentry exists.
 *
 * Sentry ships its own createErrorHandler(), which the phase plan suggests
 * providing directly. That would need a static import of the SDK in
 * app.config.ts, putting roughly a hundred kilobytes of vendor code into the
 * initial bundle of every visitor -- including everyone who declines
 * monitoring, and everyone who is never asked because the DSN is unset. This
 * handler keeps the import dynamic and behind the consent gate.
 *
 * It always delegates to the base handler, so an error still reaches the
 * console whether or not it reached Sentry. Losing local debuggability to gain
 * remote reporting would be a poor trade.
 */
@Injectable()
export class MonitoringErrorHandler extends ErrorHandler {
  private readonly monitoring = inject(Monitoring);

  override handleError(error: unknown): void {
    this.monitoring.captureException(error);
    super.handleError(error);
  }
}
