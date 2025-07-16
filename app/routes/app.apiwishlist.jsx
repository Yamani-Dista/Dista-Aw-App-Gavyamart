import { json } from "@remix-run/node";
import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const options = async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
};

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
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const body = await request.json();
    const customerId = body.customerId;
    const productId = body.productId;
    let token = body.token || "";
    var newToken = null;
    let secret = body.uid || "";
    var verified = false;
    let storeUrl = body.storeUrl || "";
    const storeDomain = storeUrl.split(".")[0];
    const credentials = await getApiCredentials();

    const bearer_token = credentials?.token || null;
    const base_url = credentials?.baseUrl || null;
    verified = await verifyHmac(customerId, secret);
    if (!verified) {
      return json(
        { error: "Unauthorized" },
        {
          status: 401,
          headers: CORS_HEADERS,
        }
      );
    }

    if (!token) {
      try {
        const jwtResponse = await axios.post(
          `${base_url}/internal/storefront/auth`,
          { store_id: storeDomain, customer_id: customerId },
          {
            headers: {
              Authorization: `Bearer ${bearer_token}`,
            },
          }
        );
        newToken = jwtResponse.data.access_token;
        token = newToken;
      } catch (err) {
        return json(
          { error: "Unauthorized" },
          {
            status: 401,
            headers: CORS_HEADERS,
          }
        );
      }
    }

    await axios.post(
      `${base_url}/internal/storefront/wishlist/additem`,
      {
        product_id: productId,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return json(
      { reply: "Successful", token: newToken },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    return json(
      { reply: "Internal Server Error" },
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
};

async function fetchShopifyProducts(data, currency, storeUrl) {

  const session = await prisma.session.findFirst({
    where: { shop: storeUrl }
  });

  if (!session || !session.accessToken) {
    return json({ error: "Authentication required. Please reinstall the app." }, {
      status: 401,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }

  const accessToken = session.accessToken
  const productResponse = await fetch(
    `https://${storeUrl}/admin/api/2023-10/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": `${accessToken}`,
      },
      body: JSON.stringify({
        query: `
        query getProductDetails($ids: [ID!]!, $currency: [CurrencyCode!]!) {
          nodes(ids: $ids) {
        ... on Product {
          id
          title
          handle
          featuredImage {
            url
            altText
          }
          images(first: 10) {
            edges { node { url altText } }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                availableForSale
                selectedOptions {
                  name
                  value
                }
                presentmentPrices(first: 1, presentmentCurrencies: $currency) {
                  edges {
                    node {
                        price { 
                          amount
                          currencyCode
                        }
                        compareAtPrice {
                          amount
                          currencyCode
                        }
                      }
                  }
                }
              }
            }
          }
          rating: metafield(namespace: "reviews", key: "rating") {
            value
          }
          reviewCount: metafield(namespace: "reviews", key: "rating_count") {
            value
          }
        }
      }
                  
        }`,
        variables: {
          ids: data.map((item) => `gid://shopify/Product/${item}`),
          currency: [currency]
        },
      }),
    }
  );
  if (!productResponse.ok) {
    throw new Error(`GraphQL request failed: ${productResponse.status}`);
  }

  const productData = await productResponse.json();
  return productData;
}

export const loader = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  const url = new URL(request.url);
  let storeUrl = url.searchParams.get("storeUrl") || "";
  const storeDomain = storeUrl.split(".")[0];
  const cssEntry = await prisma.wishlistCustom.findFirst({
    where: { shop: storeUrl }
  });
  const widgetSettings = await prisma.widgetSettings.findFirst({
    where: { shop: storeUrl },
  });

  const customerId = url.searchParams.get("customerId") || "";
  let token = url.searchParams.get("token") || "";
  let currency = url.searchParams.get("currency") || "USD";
  let newToken = null;
  let secret = url.searchParams.get("uid") || "";
  const credentials = await getApiCredentials();
  const bearer_token = credentials?.token || null;
  const base_url = credentials?.baseUrl || null;

  var verified = false;
  verified = await verifyHmac(customerId, secret);
  if (!verified) {
    return json(
      {
        error: "Unauthorized",
        css: cssEntry,
        widgetSettings: {
          starsText: widgetSettings?.starsText || '{count} review/reviews',
          saveText: widgetSettings?.saveText || 'Save {percent}%'
        }
      },
      {
        status: 401,
        headers: CORS_HEADERS,
      }
    );
  }

  try {
    const session = await prisma.session.findFirst({
      where: { shop: storeUrl },
    });

    if (!session || !session.accessToken) {
      return json(
        {
          error: "Authentication required. Please reinstall the app.",
          css: cssEntry,
          widgetSettings: {
            starsText: widgetSettings?.starsText || '{count} review/reviews',
            saveText: widgetSettings?.saveText || 'Save {percent}%'
          }
        },
        {
          status: 401,
          headers: CORS_HEADERS,
        }
      );
    }

    if (session.expires && new Date(session.expires) < new Date()) {
      return json(
        {
          error: "Session expired. Please reinstall the app.",
          css: cssEntry,
          widgetSettings: {
            starsText: widgetSettings?.starsText || '{count} review/reviews',
            saveText: widgetSettings?.saveText || 'Save {percent}%'
          }
        },
        {
          status: 401,
          headers: CORS_HEADERS,
        }
      );
    }

    if (!token) {
      try {
        const jwtResponse = await axios.post(
          `${base_url}/internal/storefront/auth`,
          { store_id: storeDomain, customer_id: customerId },
          {
            headers: {
              Authorization: `Bearer ${bearer_token}`,
            },
          }
        );
        newToken = jwtResponse.data.access_token;
        token = newToken;
      } catch (err) {
        return json(
          {
            error: "Unauthorized",
            css: cssEntry,
            widgetSettings: {
              starsText: widgetSettings?.starsText || '{count} review/reviews',
              saveText: widgetSettings?.saveText || 'Save {percent}%'
            }
          },
          {
            status: 401,
            headers: CORS_HEADERS,
          }
        );
      }
    }
    const response = await axios.get(`${base_url}/internal/storefront/wishlist`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = response.data;
    if (!data.wishlist_items || !Array.isArray(data.wishlist_items) || data.wishlist_items.length === 0) {
      return json(
        {
          reply: { data: { nodes: [] } },
          data: [],
          token: newToken,
          css: cssEntry,
          widgetSettings: {
            starsText: widgetSettings?.starsText || '{count} review/reviews',
            saveText: widgetSettings?.saveText || 'Save {percent}%'
          }
        },
        { headers: CORS_HEADERS }
      );
    }
    const productIds = data.wishlist_items.map(product => product.product_id);
    const productData = await fetchShopifyProducts(productIds, currency, storeUrl);
    if (!productData.data || !productData.data.nodes) {
      return json(
        {
          reply: "Invalid product data",
          css: cssEntry,
          widgetSettings: {
            starsText: widgetSettings?.starsText || '{count} review/reviews',
            saveText: widgetSettings?.saveText || 'Save {percent}%'
          }
        },
        { status: 500, headers: CORS_HEADERS }
      );
    }
    return json(
      {
        reply: productData,
        data: productIds,
        token: newToken,
        css: cssEntry,
        widgetSettings: {
          starsText: widgetSettings?.starsText || '{count} review/reviews',
          saveText: widgetSettings?.saveText || 'Save {percent}%'
        }
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    return json(
      {
        reply: "Internal Server Error",
        css: cssEntry,
        widgetSettings: {
          starsText: widgetSettings?.starsText || '{count} review/reviews',
          saveText: widgetSettings?.saveText || 'Save {percent}%'
        }
      },
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
};