import { json } from "@remix-run/node";
import axios from "axios";
import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();

async function verifyHmac(originalValue, receivedHmac) {
  const secret = 'Polina';
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(originalValue);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    messageData
  );

  const expectedHmac = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return expectedHmac === receivedHmac;
}

async function getApiCredentials() {
  try {
    const apiCredentials = await prisma.apiCredentials.findFirst();
    if (!apiCredentials) {
      console.error("No API credentials found in the database.");
      return null;
    }
    return apiCredentials;
  } catch (error) {
    console.error("Error retrieving API credentials:", error);
    throw error;
  }
}

export const action = async ({ request }) => {
  try {
    const body = await request.json();
    const customerId = body.customerId;
    const productId = body.productId;
    let token = body.token || "";
    let secret = body.uid || "";
    var verified = false;
    var newToken = null;
    let storeUrl = body.storeUrl || "";
    const credentials = await getApiCredentials();
    const bearer_token = credentials?.token || null;
    const base_url = credentials?.baseUrl || null;

    verified = verifyHmac(customerId, secret);
        if (!verified) {
          console.error("HMAC verification failed.");
          return json({ error: "Unauthorized" }, {
            status: 401,
            headers: { "Access-Control-Allow-Origin": "*" }
          });
        }
    
    if (!token) {
      try {
        const jwtResponse = await axios.post(
          `${base_url}/internal/storefront/auth`,
           { store_id: storeUrl, customer_id: customerId },
          {
            headers: {
              Authorization: `Bearer ${bearer_token}`,
            },
          }
        );
        newToken = jwtResponse.data.access_token;
        token = newToken;
      } catch (err) {
        return json({ error: "Unauthorized" }, {
          status: 401,
          headers: { "Access-Control-Allow-Origin": "*" }
        });
      }
    }
    await axios.post(`${base_url}/internal/storefront/wishlist/removeitem`, {
      product_id: productId,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return json(
      { reply: 'Successful', token: newToken },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );

  }
  catch (error) {
    return json({ reply: "Internal Server Error" }, {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
};

export const loader = async ({ request }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  return new Response('Method Not Allowed', {
    status: 405,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  });
};