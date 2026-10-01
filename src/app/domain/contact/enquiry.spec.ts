import {
  ENQUIRY_TYPES,
  LIMITS,
  validateEnquiry,
  type ContactEnquiry,
  type FieldError,
} from './enquiry';

/** A submission that should always pass, for tests to break one field of. */
function valid(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: 'María Hernández',
    email: 'maria@example.com',
    enquiryType: 'customer',
    subject: 'Traslado al aeropuerto',
    message: 'Somos cuatro, llegamos el martes.',
    ...overrides,
  };
}

function codes(errors: readonly FieldError[]): string[] {
  return errors.map((error) => `${error.field}:${error.code}`).sort();
}

function expectValid(input: Record<string, unknown>): ContactEnquiry {
  const result = validateEnquiry(input);
  if (!result.ok) {
    throw new Error(`expected valid, got ${codes(result.errors).join(', ')}`);
  }
  return result.value;
}

function expectErrors(input: unknown): string[] {
  const result = validateEnquiry(input);
  if (result.ok) {
    throw new Error('expected invalid, got a valid enquiry');
  }
  return codes(result.errors);
}

describe('validateEnquiry', () => {
  it('accepts a complete enquiry', () => {
    expect(expectValid(valid()).name).toBe('María Hernández');
  });

  describe('required fields', () => {
    for (const field of ['name', 'email', 'subject', 'message']) {
      it(`rejects a missing ${field}`, () => {
        expect(expectErrors(valid({ [field]: undefined }))).toContain(`${field}:required`);
      });

      it(`rejects a whitespace-only ${field}`, () => {
        // "   " is not a name, and a trimmed empty string is what a form posts
        // when someone tabs through it.
        expect(expectErrors(valid({ [field]: '   ' }))).toContain(`${field}:required`);
      });
    }

    it('reports every problem at once, not just the first', () => {
      // A form that reveals one mistake at a time is a form people abandon.
      const errors = expectErrors({ enquiryType: 'customer' });
      expect(errors).toEqual([
        'email:required',
        'message:required',
        'name:required',
        'subject:required',
      ]);
    });
  });

  describe('enquiry type', () => {
    for (const type of ENQUIRY_TYPES) {
      it(`accepts ${type}`, () => {
        const input =
          type === 'operator'
            ? valid({ enquiryType: type, company: 'X' })
            : valid({ enquiryType: type });
        expect(expectValid(input).enquiryType).toBe(type);
      });
    }

    it('rejects a type it does not recognise', () => {
      expect(expectErrors(valid({ enquiryType: 'vip' }))).toContain('enquiryType:required');
    });

    it('rejects a missing type', () => {
      expect(expectErrors(valid({ enquiryType: undefined }))).toContain('enquiryType:required');
    });
  });

  describe('company, which only operators are asked for', () => {
    it('is required when the enquiry is from an operator', () => {
      expect(expectErrors(valid({ enquiryType: 'operator' }))).toContain('company:required');
    });

    it('is kept when an operator supplies it', () => {
      const enquiry = expectValid(valid({ enquiryType: 'operator', company: 'Canary Tours' }));
      expect(enquiry.company).toBe('Canary Tours');
    });

    it('is not required of a customer', () => {
      expect(validateEnquiry(valid({ enquiryType: 'customer' })).ok).toBe(true);
    });

    it('is dropped for a non-operator who somehow sent one', () => {
      // A stale value in a field that was hidden again must not ride along
      // into the email.
      const enquiry = expectValid(valid({ enquiryType: 'customer', company: 'Left over' }));
      expect(enquiry.company).toBeUndefined();
    });
  });

  describe('email', () => {
    for (const address of [
      'maria@example.com',
      'maria+lanzarote@example.co.uk',
      "o'brien@example.com",
      'maria.hernandez@sub.example.travel',
    ]) {
      it(`accepts ${address}, which is legal and in use`, () => {
        // Every "proper" email regex rejects addresses that work. The shape
        // check is here to catch a typo, not to adjudicate RFC 5322.
        expect(validateEnquiry(valid({ email: address })).ok).toBe(true);
      });
    }

    for (const address of [
      'maria',
      'maria@',
      '@example.com',
      'maria example.com',
      'maria@example',
    ]) {
      it(`rejects ${address}`, () => {
        expect(expectErrors(valid({ email: address }))).toContain('email:invalidEmail');
      });
    }

    it('does not also report required when the address is merely malformed', () => {
      expect(expectErrors(valid({ email: 'maria' }))).toEqual(['email:invalidEmail']);
    });
  });

  describe('phone, which is optional', () => {
    it('is accepted when absent', () => {
      expect(expectValid(valid()).phone).toBeUndefined();
    });

    it('is kept when supplied', () => {
      expect(expectValid(valid({ phone: '+34 677 87 18 61' })).phone).toBe('+34 677 87 18 61');
    });

    it('is dropped rather than stored blank', () => {
      expect(expectValid(valid({ phone: '   ' })).phone).toBeUndefined();
    });
  });

  describe('length limits', () => {
    it('rejects a message beyond the ceiling', () => {
      // An unbounded field is a free megabyte of anything a bot cares to post.
      expect(expectErrors(valid({ message: 'x'.repeat(LIMITS.message + 1) }))).toContain(
        'message:tooLong',
      );
    });

    it('accepts a message exactly at the ceiling', () => {
      expect(validateEnquiry(valid({ message: 'x'.repeat(LIMITS.message) })).ok).toBe(true);
    });

    it('rejects an over-long name', () => {
      expect(expectErrors(valid({ name: 'x'.repeat(LIMITS.name + 1) }))).toContain('name:tooLong');
    });
  });

  describe('trimming', () => {
    it('strips surrounding whitespace from every value it keeps', () => {
      const enquiry = expectValid(valid({ name: '  María  ', subject: ' Traslado ' }));
      expect(enquiry.name).toBe('María');
      expect(enquiry.subject).toBe('Traslado');
    });
  });

  describe('input that is not an enquiry at all', () => {
    // The function receives whatever was posted to it, which is not
    // necessarily an object and certainly not necessarily this one.
    for (const input of [null, undefined, 'a string', 42, true]) {
      it(`rejects ${String(input)} without throwing`, () => {
        expect(() => validateEnquiry(input)).not.toThrow();
        expect(validateEnquiry(input).ok).toBe(false);
      });
    }

    it('rejects an array', () => {
      expect(validateEnquiry([]).ok).toBe(false);
    });

    it('ignores non-string values in string fields', () => {
      expect(expectErrors(valid({ name: 12345 }))).toContain('name:required');
    });
  });
});
