import React, { useState, useCallback } from 'react';
import {
    DropZone,
    LegacyStack,
    Thumbnail,
    Text,
    Card,
    Banner,
    TextField,
    Button,
    Page,
    Layout,
} from '@shopify/polaris';
import { NoteIcon } from '@shopify/polaris-icons';
import { useLoaderData } from "@remix-run/react";
import shopify from "../shopify.server";
import { json } from "@remix-run/node";

export const loader = async ({ request }) => {
  const { session } = await shopify.authenticate.admin(request);
  const { shop } = session;
  return json({ shop });
};

export default function FileUploader() {
 
    const [files, setFiles] = useState([]);
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const { shop } = useLoaderData();

    const validCsvFile = (file) =>
        file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');

    const handleDropZoneDrop = useCallback((_dropFiles, acceptedFiles, rejectedFiles) => {
        const validFiles = acceptedFiles.filter(validCsvFile);
        if (validFiles.length < acceptedFiles.length || rejectedFiles.length > 0) {
            setError('Only .csv files are allowed');
            setFiles([]);
        } else {
            setError('');
            setFiles(validFiles);
        }
        setMessage('');
    }, []);

    const handleUpload = async () => {
        setError('');
        setMessage('');
        if (!files.length) {
            setError('Please select a CSV file to import.');
            return;
        }
        setImporting(true);
        const formData = new FormData();
        formData.append('file', files[0]);
        formData.append('store_id', shop);
        try {
            const res = await fetch('/app/apiimport', {
                method: 'POST',
                body: formData,
            });
            const result = await res.json();
            setImporting(false);
            if (res.ok) {
                setMessage('File imported successfully!');
                setFiles([]);
            } else {
                setError(result.error || 'Upload failed');
            }
        } catch (err) {
            setImporting(false);
            setError('An error occurred during upload.');
        }
    };

    const handleExport = async () => {
        setError('');
        setMessage('');
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        setExporting(true);
        const formData = new FormData();
        formData.append('email', email);
        formData.append('store_id', shop); 
        try {
            const res = await fetch('/app/apiexport', {
                method: 'POST',
                body: formData,
            });
            const result = await res.json();
            setExporting(false);
            if (res.ok) {
                setMessage(`CSV sent to ${email}`);
                setEmail('');
            } else {
                setError(result.error || 'Failed to send email');
            }
        } catch (err) {
            setExporting(false);
            setError('An error occurred while sending the email.');
        }
    };

    const handleClearFile = () => {
        setFiles([]);
        setError('');
        setMessage('');
    };
    const handleClearEmail = () => {
        setEmail('');
        setError('');
        setMessage('');
    };

    const uploadedFiles = files.length > 0 && (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none', 
                zIndex: 1,
            }}
        >
            <div style={{ pointerEvents: 'auto' }}>
                {files.map((file, index) => (
                    <LegacyStack alignment="center" key={index}>
                        <Thumbnail size="small" alt={file.name} source={NoteIcon} />
                        <div style={{ textAlign: 'center' }}>
                            {file.name}{' '}
                            <Text variant="bodySm" as="p">
                                {file.size.toLocaleString()} bytes
                            </Text>
                        </div>
                    </LegacyStack>
                ))}
            </div>
        </div>
    );
    
    const handleSampleDownload = async () => {
        try {
            const response = await fetch('/app/apiimport');
            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'wishlist_sample.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to download sample CSV.');
        }
    };

    return (
        <Page>
            <Layout>
                <Layout.Section>
                    <Text variant="headingLg" as="h2">
                        CSV File 
                    </Text>
                    {error && (
                        <div style={{ marginBottom: '1rem' }}>
                            <Banner status="critical" title="Error" onDismiss={() => setError('')}>
                                <p>{error}</p>
                            </Banner>
                        </div>
                    )}
                    {message && (
                        <div style={{ marginBottom: '1rem' }}>
                            <Banner status="success" title="Success" onDismiss={() => setMessage('')}>
                                <p>{message}</p>
                            </Banner>
                        </div>
                    )}
                    <Card title={<Text variant="headingMd" as="h3">Import CSV</Text>} sectioned>
                        <div style={{ marginBottom: '1rem',display:'flex',flexDirection:'row',justifyContent:'space-between' }}>
                            <Text variant="bodyMd" as="p">
                                Upload a CSV file to import data into the system.
                            </Text>
                            <Button onClick={handleSampleDownload}>
                                Download Sample CSV
                            </Button>
                        </div>
                        <DropZone accept=".csv" type="file" onDrop={handleDropZoneDrop}>
                            {uploadedFiles || <DropZone.FileUpload />}
                        </DropZone>
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                            <Button onClick={handleUpload} disabled={importing || !files.length}>
                                {importing ? 'Importing...' : 'Import'}
                            </Button>
                            <Button onClick={handleClearFile} disabled={importing} tone="critical">
                                Clear
                            </Button>
                        </div>
                    </Card>
                </Layout.Section>
                <Layout.Section>
                    <Card title={<Text variant="headingMd" as="h3">Export CSV</Text>} sectioned>
                        <div style={{ marginBottom: '1rem' }}>
                            <Text variant="bodyMd" as="p">
                                Send the CSV file to an email address.
                            </Text>
                        </div>
                        <TextField
                            label="Recipient Email"
                            type="email"
                            value={email}
                            onChange={setEmail}
                            autoComplete="email"
                            placeholder="example@domain.com"
                            helpText="We'll send the CSV file to this email address"
                        />
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                            <Button
                                primary
                                onClick={handleExport}
                                disabled={exporting || !email}
                            >
                                {exporting ? 'Sending...' : 'Export'}
                            </Button>
                            <Button onClick={handleClearEmail} disabled={exporting} tone="critical">
                                Clear
                            </Button>
                        </div>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}