import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";
import shopify from "../shopify.server";

const prisma = new PrismaClient();

export async function loader({ request }) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const { session } = await shopify.authenticate.public(request);
    if (!session) {
      return json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }
    
    const { shop } = session;
    const settings = await prisma.quickViewCss.findUnique({ where: { shop } });

    return json({ css: settings?.css || '' }, { headers: corsHeaders });
  } catch (error) {
    return json({ error: 'Failed to fetch CSS' }, { status: 500, headers: corsHeaders });
  }
} 