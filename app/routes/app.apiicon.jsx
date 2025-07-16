import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  let storeUrl = url.searchParams.get("storeUrl") || "";
  try {
    const settings = await prisma.iconSettings.findFirst(
      {
        where: { shop: storeUrl },
      }
    );

    return json(
      { reply: settings || {} },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );

  } catch (error) {
    return json(
      { reply: "Internal Server Error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
};