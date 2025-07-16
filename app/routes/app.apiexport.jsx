import { json } from "@remix-run/node";

export async function action({ request }) {
  const formData = await request.formData();
  const email = formData.get('email');
  const storeId = formData.get('store_id') || 'demo-shop-id';

  if (!email) {
    return json({ error: 'Email is required' }, { status: 400 });
  }

//   const res = await fetch('https://your-backend-domain.com/api/send-csv-email', {
//     method: 'POST',
//     body: new URLSearchParams({ email, store_id: storeId }),
//     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//   });

//   const result = await res.json();

//   if (!res.ok) {
//     return json({ error: result.message || 'Email failed' }, { status: 500 });
//   }

  return json({ message: `CSV sent to ${email}` });
}
