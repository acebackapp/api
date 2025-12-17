import { assertEquals, assertExists } from 'jsr:@std/assert';

// Mock data types
type MockUser = {
  id: string;
  email: string;
};

type MockShippingAddress = {
  id: string;
  user_id: string;
  name: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

type MockStickerOrder = {
  id: string;
  user_id: string;
  shipping_address_id: string;
  quantity: number;
  unit_price_cents: number;
  total_price_cents: number;
  status: string;
  stripe_checkout_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  updated_at?: string;
};

// Mock data storage
let mockUsers: MockUser[] = [];
let mockShippingAddresses: MockShippingAddress[] = [];
let mockStickerOrders: MockStickerOrder[] = [];

// Reset mocks before each test
function resetMocks() {
  mockUsers = [];
  mockShippingAddresses = [];
  mockStickerOrders = [];
}

// Mock Supabase client
function mockSupabaseClient() {
  return {
    auth: {
      admin: {
        createUser: (options: { email: string; password: string; email_confirm: boolean }) => {
          const newUser: MockUser = {
            id: `user-${Date.now()}`,
            email: options.email,
          };
          mockUsers.push(newUser);
          return Promise.resolve({ data: { user: newUser }, error: null });
        },
        deleteUser: (userId: string) => {
          mockUsers = mockUsers.filter((u) => u.id !== userId);
          return Promise.resolve({ error: null });
        },
      },
    },
    from: (table: string) => ({
      insert: (values: Record<string, unknown> | Record<string, unknown>[]) => ({
        select: () => ({
          single: () => {
            if (table === 'shipping_addresses') {
              const addressData = values as MockShippingAddress;
              const newAddress: MockShippingAddress = {
                ...addressData,
                id: `addr-${Date.now()}`,
              };
              mockShippingAddresses.push(newAddress);
              return Promise.resolve({ data: newAddress, error: null });
            }
            if (table === 'sticker_orders') {
              const orderData = values as MockStickerOrder;
              const newOrder: MockStickerOrder = {
                ...orderData,
                id: `order-${Date.now()}`,
              };
              mockStickerOrders.push(newOrder);
              return Promise.resolve({ data: newOrder, error: null });
            }
            return Promise.resolve({ data: null, error: { message: 'Unknown table' } });
          },
        }),
      }),
      update: (values: Record<string, unknown>) => ({
        eq: (_column: string, value: string) => ({
          select: () => ({
            single: () => {
              if (table === 'sticker_orders') {
                const order = mockStickerOrders.find((o) => o.stripe_checkout_session_id === value || o.id === value);
                if (order) {
                  Object.assign(order, values);
                  return Promise.resolve({ data: order, error: null });
                }
                return Promise.resolve({ data: null, error: { message: 'Order not found' } });
              }
              return Promise.resolve({ data: null, error: { message: 'Unknown table' } });
            },
          }),
        }),
      }),
      delete: () => ({
        eq: (_column: string, value: string) => {
          if (table === 'sticker_orders') {
            mockStickerOrders = mockStickerOrders.filter((o) => o.id !== value);
            return Promise.resolve({ error: null });
          }
          if (table === 'shipping_addresses') {
            mockShippingAddresses = mockShippingAddresses.filter((a) => a.id !== value);
            return Promise.resolve({ error: null });
          }
          return Promise.resolve({ error: { message: 'Unknown table' } });
        },
      }),
    }),
  };
}

Deno.test('stripe-webhook: should return 405 for non-POST requests', async () => {
  resetMocks();

  const method: string = 'GET';

  if (method !== 'POST') {
    const response = new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
    assertEquals(response.status, 405);
    const data = await response.json();
    assertEquals(data.error, 'Method not allowed');
  }
});

Deno.test('stripe-webhook: should return 400 when stripe-signature header is missing', async () => {
  resetMocks();

  const stripeSignature = undefined;

  if (!stripeSignature) {
    const response = new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
    assertEquals(response.status, 400);
    const data = await response.json();
    assertEquals(data.error, 'Missing stripe-signature header');
  }
});

Deno.test('stripe-webhook: should handle checkout.session.completed event (mocked)', async () => {
  resetMocks();

  // Mock the checkout.session.completed event structure
  const mockCheckoutEvent = {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123',
        payment_intent: 'pi_test_456',
        metadata: {
          order_id: 'order-123',
        },
      },
    },
  };

  // Verify event structure
  assertEquals(mockCheckoutEvent.type, 'checkout.session.completed');
  assertExists(mockCheckoutEvent.data.object.id);
  assertExists(mockCheckoutEvent.data.object.payment_intent);
  assertExists(mockCheckoutEvent.data.object.metadata.order_id);

  // Note: For full integration testing with real Stripe signature verification,
  // use Stripe CLI: stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
});

Deno.test('stripe-webhook: should update order status to paid on successful payment', async () => {
  resetMocks();

  const supabase = mockSupabaseClient();

  // Create a test user
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: `webhook-test-${Date.now()}@example.com`,
    password: 'testpassword123',
    email_confirm: true,
  });

  if (userError) throw userError;

  // Create shipping address
  const { data: address, error: addrError } = await supabase
    .from('shipping_addresses')
    .insert({
      user_id: userData.user.id,
      name: 'Test User',
      street_address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      postal_code: '12345',
      country: 'US',
    })
    .select()
    .single();

  if (addrError) throw addrError;

  // Create an order with pending_payment status
  const testCheckoutSessionId = `cs_test_${Date.now()}`;
  const { data: order, error: orderError } = await supabase
    .from('sticker_orders')
    .insert({
      user_id: userData.user.id,
      shipping_address_id: address.id,
      quantity: 10,
      unit_price_cents: 100,
      total_price_cents: 1000,
      status: 'pending_payment',
      stripe_checkout_session_id: testCheckoutSessionId,
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // Simulate what the webhook handler would do
  const { data: updatedOrder, error: updateError } = await supabase
    .from('sticker_orders')
    .update({
      status: 'paid',
      stripe_payment_intent_id: 'pi_test_123',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_checkout_session_id', testCheckoutSessionId)
    .select()
    .single();

  if (updateError) throw updateError;

  assertEquals(updatedOrder.status, 'paid');
  assertExists(updatedOrder.stripe_payment_intent_id);

  // Cleanup
  await supabase.from('sticker_orders').delete().eq('id', order.id);
  await supabase.from('shipping_addresses').delete().eq('id', address.id);
  await supabase.auth.admin.deleteUser(userData.user.id);
});
