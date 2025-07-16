import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const action = async ({ request }) => {
  try {
    const data = await request.formData();
    const formData = Object.fromEntries(data.entries());
    const menuTabs = JSON.parse(formData.menuTabs || '[]');
    const cancelOrderBehavior = formData.cancelOrderBehavior || 'direct';
    const scriptInput = formData.scriptInput || '';
    const url = new URL(request.url);
    let storeUrl = url.searchParams.get("storeUrl") || "";
    const script =
      cancelOrderBehavior === "script" && scriptInput
        ? `(function customOrderCancelScript() {\n  try {\n${scriptInput}\n  } catch (e) {\n    console.error("Admin script failed", e);\n  }\n})();`
        : null;
   
    const updateData = {
      menuTabs,
      cancelOrderBehavior,
      script,
    };

    const existing = await prisma.menuSettings.findFirst({
      where: { shop : storeUrl },
    });

    const result = existing
      ? await prisma.menuSettings.update({
        where: { id: existing.id },
        data: updateData,
      })
      : await prisma.menuSettings.create({
        data: {
          id: `singleton_${storeUrl}`, 
          shop: storeUrl,
          ...updateData,
        },
      });
    return json({ reply: result });

  } catch (error) {
    return json({ message: "Internal Server Error" }, { status: 500 });
  }
};

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  let storeUrl = url.searchParams.get("storeUrl") || "";
  try {
    const settings = await prisma.menuSettings.findFirst({
      where: { shop : storeUrl },
    });

    const defaultTabs = [
      { key: "accountDetails", label: "Account Details", enabled: true },
      { key: "addresses", label: "Addresses", enabled: true },
      { key: "orders", label: "Orders", enabled: true },
      { key: "wishlist", label: "Wishlist", enabled: false, link: "/pages/wishlist" },
      { key: "subscriptions", label: "Subscriptions", enabled: false, link: "/pages/subscriptions" }
    ];

    return json({
      reply: settings || {
        id: `singleton_${storeUrl}`,
        shop: storeUrl,
        menuTabs: defaultTabs,
        cancelOrderBehavior: "direct",
        script: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

  } catch (error) {
    return json({ message: "Internal Server Error" }, { status: 500 });
  }
};