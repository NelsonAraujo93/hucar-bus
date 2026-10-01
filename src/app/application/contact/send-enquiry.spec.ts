import { TestBed } from '@angular/core/testing';
import { CONTACT_GATEWAY, type ContactGateway } from './contact-gateway';
import { SendEnquiry } from './send-enquiry';

const CONTEXT = { locale: 'es', privacyAccepted: true, honeypot: '', elapsedMs: 9_000 } as const;

function setup(): { useCase: SendEnquiry; send: ReturnType<typeof vi.fn> } {
  const send = vi.fn<ContactGateway['send']>(async () => ({ status: 'sent' as const }));
  TestBed.configureTestingModule({ providers: [{ provide: CONTACT_GATEWAY, useValue: { send } }] });
  return { useCase: TestBed.inject(SendEnquiry), send };
}

describe('SendEnquiry', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('sends a valid enquiry, cleaned by the domain rules, with its context', async () => {
    const { useCase, send } = setup();

    const outcome = await useCase.execute(
      {
        name: ' Ana ',
        email: 'ana@example.com',
        enquiryType: 'other',
        company: 'Dropped',
        subject: 'Hola',
        message: 'Una pregunta',
      },
      CONTEXT,
    );

    expect(outcome).toEqual({ status: 'sent' });
    expect(send).toHaveBeenCalledWith({
      ...CONTEXT,
      enquiry: {
        name: 'Ana',
        email: 'ana@example.com',
        enquiryType: 'other',
        subject: 'Hola',
        message: 'Una pregunta',
      },
    });
  });

  it('never lets an invalid enquiry leave the browser', async () => {
    const { useCase, send } = setup();

    const outcome = await useCase.execute({ name: '' }, CONTEXT);

    expect(outcome.status).toBe('invalid');
    expect(send).not.toHaveBeenCalled();
  });
});
