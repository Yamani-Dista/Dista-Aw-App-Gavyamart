import { json } from "@remix-run/node";
import Papa from "papaparse";

export async function action({ request }) {
  const formData = await request.formData();
  const file = formData.get('file');
  const storeId = formData.get('store_id') || 'demo-shop-id';

  if (!file || typeof file === "string") {
    return json({ error: 'CSV file is required' }, { status: 400 });
  }
  const text = await file.text();

  const { data, errors } = Papa.parse(text, { header: true, skipEmptyLines: true });

  if (errors.length > 0) {
    return json({ error: 'Invalid CSV format', details: errors }, { status: 400 });
  }

  const invalidRows = [];
  data.forEach((row, idx) => {
    if (!row.customer_email || !row.product_handle) {
      invalidRows.push({ row: idx + 2, error: 'Missing customer_email or product_handle' }); 
    }
  });

  if (invalidRows.length > 0) {
    return json({ error: 'Validation failed', invalidRows }, { status: 400 });
  }

  //   const backendFormData = new FormData();
  //   backendFormData.append('file', file, file.name);
  //   backendFormData.append('store_id', storeId);

  //   const backendUploadUrl = 'https://your-backend-domain.com/api/upload'; 
  //   const response = await fetch(backendUploadUrl, {
  //     method: 'POST',
  //     body: backendFormData,
    
  //   });

  //   const data = await response.json();

  //   if (!response.ok) {
  //     return json({ error: data.message || 'Upload failed' }, { status: 500 });
  //   }

  return json({ message: 'Import successful'}, { status: 200 });
}

export async function loader() {
  const csvContent = `customer_email,product_handle
    1234567890,8246243174713
    9876543210,8246243174714
    1122334455,8246243174715`;

  return new Response(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="wishlist_import_sample.csv"',
    },
  });
}