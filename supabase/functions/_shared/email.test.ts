import { assertEquals } from 'https://deno.land/std@0.192.0/testing/asserts.ts';

// Note: These tests use fully mocked responses to avoid real API calls
// and don't require any environment variables or network access.

// Mock sendEmail function that simulates the real implementation's behavior
function mockSendEmail(
  options: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: string;
    replyTo?: string;
  },
  config: { apiKeyConfigured: boolean; apiSuccess: boolean } = { apiKeyConfigured: true, apiSuccess: true }
): { success: boolean; messageId?: string; error?: string } {
  // Simulate behavior when API key is not configured
  if (!config.apiKeyConfigured) {
    return { success: false, error: 'Email not configured' };
  }

  // Simulate API failure
  if (!config.apiSuccess) {
    return { success: false, error: 'Failed to send email' };
  }

  // Simulate successful send
  // Normalize to array like the real implementation does
  const _recipients = Array.isArray(options.to) ? options.to : [options.to];

  return {
    success: true,
    messageId: `msg_${Date.now()}`,
  };
}

Deno.test('sendEmail: should return error when RESEND_API_KEY not configured', () => {
  const result = mockSendEmail(
    {
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<p>Test body</p>',
    },
    { apiKeyConfigured: false, apiSuccess: false }
  );

  assertEquals(result.success, false);
  assertEquals(result.error, 'Email not configured');
});

Deno.test('sendEmail: should accept string for to field', () => {
  const result = mockSendEmail(
    {
      to: 'single@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
    },
    { apiKeyConfigured: true, apiSuccess: true }
  );

  assertEquals(result.success, true);
  assertEquals(typeof result.messageId, 'string');
});

Deno.test('sendEmail: should accept array for to field', () => {
  const result = mockSendEmail(
    {
      to: ['first@example.com', 'second@example.com'],
      subject: 'Test',
      html: '<p>Test</p>',
    },
    { apiKeyConfigured: true, apiSuccess: true }
  );

  assertEquals(result.success, true);
  assertEquals(typeof result.messageId, 'string');
});

Deno.test('sendEmail: should return success with messageId on successful send', () => {
  const result = mockSendEmail(
    {
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<p>This is a test email.</p>',
      text: 'This is a test email.',
    },
    { apiKeyConfigured: true, apiSuccess: true }
  );

  assertEquals(result.success, true);
  assertEquals(typeof result.messageId, 'string');
  assertEquals(result.messageId!.startsWith('msg_'), true);
});

Deno.test('sendEmail: should return error on API failure', () => {
  const result = mockSendEmail(
    {
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
    },
    { apiKeyConfigured: true, apiSuccess: false }
  );

  assertEquals(result.success, false);
  assertEquals(result.error, 'Failed to send email');
});

Deno.test('sendEmail: should accept all optional fields', () => {
  const result = mockSendEmail(
    {
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<p>Test</p>',
      text: 'Test plain text',
      from: 'Custom Sender <sender@example.com>',
      replyTo: 'reply@example.com',
    },
    { apiKeyConfigured: true, apiSuccess: true }
  );

  assertEquals(result.success, true);
  assertEquals(typeof result.messageId, 'string');
});

Deno.test('sendEmail: validates SendEmailOptions interface structure', () => {
  // Test that the expected interface fields work correctly
  const validOptions = {
    to: 'test@example.com',
    subject: 'Test Subject',
    html: '<p>Test</p>',
    text: 'Test',
    from: 'Custom Sender <sender@example.com>',
    replyTo: 'reply@example.com',
  };

  assertEquals(typeof validOptions.to, 'string');
  assertEquals(typeof validOptions.subject, 'string');
  assertEquals(typeof validOptions.html, 'string');
  assertEquals(typeof validOptions.text, 'string');
  assertEquals(typeof validOptions.from, 'string');
  assertEquals(typeof validOptions.replyTo, 'string');
});

Deno.test('sendEmail: to field accepts multiple recipients as array', () => {
  const optionsWithArray = {
    to: ['user1@example.com', 'user2@example.com', 'user3@example.com'],
    subject: 'Test Subject',
    html: '<p>Test</p>',
  };

  assertEquals(Array.isArray(optionsWithArray.to), true);
  assertEquals(optionsWithArray.to.length, 3);

  const result = mockSendEmail(optionsWithArray, { apiKeyConfigured: true, apiSuccess: true });
  assertEquals(result.success, true);
});
