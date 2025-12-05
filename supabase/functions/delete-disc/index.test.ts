import { assertEquals, assertExists } from 'https://deno.land/std@0.192.0/testing/asserts.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FUNCTION_URL = Deno.env.get('FUNCTION_URL') || 'http://localhost:54321/functions/v1/delete-disc';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
const SUPABASE_ANON_KEY =
  Deno.env.get('SUPABASE_ANON_KEY') ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

Deno.test('delete-disc: should return 401 when not authenticated', async () => {
  const response = await fetch(FUNCTION_URL, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ disc_id: '123' }),
  });

  assertEquals(response.status, 401);
});

Deno.test('delete-disc: should return 405 for non-DELETE requests', async () => {
  const response = await fetch(FUNCTION_URL, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  assertEquals(response.status, 405);
});

Deno.test('delete-disc: should return 400 when disc_id is missing', async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Sign up a test user
  const { data: authData } = await supabase.auth.signUp({
    email: `test-${Date.now()}@example.com`,
    password: 'testpassword123',
  });

  const response = await fetch(FUNCTION_URL, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authData.session?.access_token}`,
    },
    body: JSON.stringify({}),
  });

  assertEquals(response.status, 400);
  const error = await response.json();
  assertExists(error.error);
  assertEquals(error.error, 'disc_id is required');
});

Deno.test('delete-disc: should return 404 when disc does not exist', async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Sign up a test user
  const { data: authData } = await supabase.auth.signUp({
    email: `test-${Date.now()}@example.com`,
    password: 'testpassword123',
  });

  const response = await fetch(FUNCTION_URL, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authData.session?.access_token}`,
    },
    body: JSON.stringify({ disc_id: '00000000-0000-0000-0000-000000000000' }),
  });

  assertEquals(response.status, 404);
  const error = await response.json();
  assertExists(error.error);
  assertEquals(error.error, 'Disc not found');
});

Deno.test('delete-disc: should successfully delete owned disc', async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Sign up a test user
  const { data: authData } = await supabase.auth.signUp({
    email: `test-${Date.now()}@example.com`,
    password: 'testpassword123',
  });

  // Create a disc first
  const createResponse = await fetch(`${SUPABASE_URL}/functions/v1/create-disc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authData.session?.access_token}`,
    },
    body: JSON.stringify({
      mold: 'Test Disc',
      flight_numbers: { speed: 7, glide: 5, turn: 0, fade: 1 },
    }),
  });

  const createdDisc = await createResponse.json();
  assertEquals(createResponse.status, 201);
  assertExists(createdDisc.id);

  // Delete the disc
  const deleteResponse = await fetch(FUNCTION_URL, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authData.session?.access_token}`,
    },
    body: JSON.stringify({ disc_id: createdDisc.id }),
  });

  assertEquals(deleteResponse.status, 200);
  const result = await deleteResponse.json();
  assertEquals(result.success, true);
  assertEquals(result.message, 'Disc deleted successfully');

  // Verify disc is deleted
  const { data: disc } = await supabase.from('discs').select('*').eq('id', createdDisc.id).single();

  assertEquals(disc, null);
});

Deno.test("delete-disc: should return 403 when trying to delete another user's disc", async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Create first user and disc
  const { data: user1Data } = await supabase.auth.signUp({
    email: `test-${Date.now()}@example.com`,
    password: 'testpassword123',
  });

  const createResponse = await fetch(`${SUPABASE_URL}/functions/v1/create-disc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user1Data.session?.access_token}`,
    },
    body: JSON.stringify({
      mold: 'Test Disc',
      flight_numbers: { speed: 7, glide: 5, turn: 0, fade: 1 },
    }),
  });

  const createdDisc = await createResponse.json();
  assertEquals(createResponse.status, 201);

  // Create second user
  const { data: user2Data } = await supabase.auth.signUp({
    email: `test-${Date.now() + 1}@example.com`,
    password: 'testpassword123',
  });

  // Try to delete first user's disc as second user
  const deleteResponse = await fetch(FUNCTION_URL, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user2Data.session?.access_token}`,
    },
    body: JSON.stringify({ disc_id: createdDisc.id }),
  });

  assertEquals(deleteResponse.status, 403);
  const error = await deleteResponse.json();
  assertExists(error.error);
  assertEquals(error.error, 'Forbidden: You do not own this disc');
});
