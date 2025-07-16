import { json } from "@remix-run/node";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import { PrismaClient } from "@prisma/client";
import shopify from "../shopify.server"
import {
    AppProvider,
    Page,
    Layout,
    TextField,
    FormLayout,
    Button,
    Card,
    Tabs,
    Banner,
    List,
    Text,
} from "@shopify/polaris";
import { useState, useEffect } from "react";

const prisma = new PrismaClient();

export const loader = async ({request}) => {
    const { session } = await shopify.authenticate.admin(request);
    const { shop } = session;

    const settings = await prisma.iconSettings.findFirst({
      where: { shop },
    });
    return json({
        iconColorBefore: settings?.iconColorBefore || '#cccccc',
        iconColorAfter: settings?.iconColorAfter || '#ff0000',
        customCSS: settings?.customCSS || '',
        classSelector: settings?.classSelector ? JSON.parse(settings.classSelector) : []
    });
};

function addImportantToCSS(css) {
    return css.replace(/([^;{}\n]+)(;)/g, (match, declaration, end) => {
        if (declaration.includes('!important')) return match;
        return declaration.trim() + ' !important' + end;
    });
}

export const action = async ({ request }) => {
    const formData = await request.formData();
    const iconColorBefore = formData.get('iconColorBefore') || '#cccccc';
    const iconColorAfter = formData.get('iconColorAfter') || '#ff0000';
    const css = formData.get('customCSS') || '';
    const customCSS = addImportantToCSS(css);
    const classSelectorRaw = formData.get('classSelector') || '[]';

    let classSelector = [];
    try {
        classSelector = JSON.parse(classSelectorRaw);
    } catch (e) {
        return json({ success: false, error: "Invalid class selector JSON" }, { status: 400 });
    }

    try {

        const { session } = await shopify.authenticate.admin(request);
        const { shop } = session;

        const existing = await prisma.iconSettings.findFirst({
        where: { shop },
        });

        if (existing) {
            await prisma.iconSettings.update({
                where: { id: existing.id },
                data: {
                    iconColorBefore,
                    iconColorAfter,
                    customCSS,
                    classSelector: JSON.stringify(classSelector)
                }
            });
        } else {
            await prisma.iconSettings.create({
                data: {
                    shop,
                    iconColorBefore,
                    iconColorAfter,
                    customCSS,
                    classSelector: JSON.stringify(classSelector)
                }
            });
        }
        return json({ success: true });
    } catch (error) {
        return json({ success: false, error: error.message }, { status: 500 });
    }
};

export default function CustomCSSAdmin() {
    const {
        iconColorBefore,
        iconColorAfter,
        customCSS,
        classSelector: loadedClassSelector
    } = useLoaderData();
    const actionData = useActionData();

    const [iconBefore, setIconBefore] = useState(iconColorBefore);
    const [iconAfter, setIconAfter] = useState(iconColorAfter);
    const [css, setCSS] = useState(customCSS);
    const [classSelectorRaw, setClassSelectorRaw] = useState(loadedClassSelector.join("\n"));
    const [classSelector, setClassSelector] = useState(loadedClassSelector);
    const [success, setSuccess] = useState(false);
    const [selectedTab, setSelectedTab] = useState(0);

    useEffect(() => {
        if (actionData?.success) {
            setSuccess(true);
            const timer = setTimeout(() => setSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [actionData]);

    useEffect(() => {
        const entries = classSelectorRaw
            .split('\n')
            .map(e => e.trim())
            .filter(Boolean);
        setClassSelector(entries);
    }, [classSelectorRaw]);

    return (
        <AppProvider i18n={{}}>
            <Page
                title="Wishlist Icon Settings"
                primaryAction={{
                    content: "Save Settings",
                    onAction: () => document.getElementById('icon-settings-form')?.requestSubmit(),
                    primary: true
                }}
            >
                <Layout>
                    <Layout.Section>
                        <Card sectioned>
                            {success && <Banner status="success"><p>Settings saved successfully!</p></Banner>}
                            {actionData?.error && <Banner status="critical"><p>Error: {actionData.error}</p></Banner>}

                            <Tabs
                                tabs={[
                                    { id: 'settings', content: 'Settings' },
                                    { id: 'css-guide', content: 'Guide' }
                                ]}
                                selected={selectedTab}
                                onSelect={setSelectedTab}
                            >
                                {selectedTab === 0 ? (
                                    <Form id="icon-settings-form" method="post">
                                        <FormLayout>
                                            <Card title="Icon Color Settings" sectioned>
                                                <div style={{ display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <label htmlFor="iconColorBefore">Icon Color Before:</label>
                                                        <input
                                                            id="iconColorBefore"
                                                            name="iconColorBefore"
                                                            type="color"
                                                            value={iconBefore}
                                                            onChange={(e) => setIconBefore(e.target.value)}
                                                            style={{ width: "40px", height: "40px", cursor: "pointer" }}
                                                        />
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <label htmlFor="iconColorAfter">Icon Color After:</label>
                                                        <input
                                                            id="iconColorAfter"
                                                            name="iconColorAfter"
                                                            type="color"
                                                            value={iconAfter}
                                                            onChange={(e) => setIconAfter(e.target.value)}
                                                            style={{ width: "40px", height: "40px", cursor: "pointer" }}
                                                        />
                                                    </div>
                                                </div>
                                            </Card>

                                            <Card title="Target Product Card Selectors (for Icon Placement)" sectioned>
                                                <TextField
                                                    label="Card Selectors (one per line)"
                                                    helpText="Enter one CSS selector per line, such as `.product-card`, `.card__media`, etc."
                                                    value={classSelectorRaw}
                                                    multiline={4}
                                                    onChange={(value) => setClassSelectorRaw(value)}
                                                    name="classSelectorDisplay"
                                                    autoComplete="off"
                                                />
                                                <input
                                                    type="hidden"
                                                    name="classSelector"
                                                    value={JSON.stringify(classSelector)}
                                                />
                                            </Card>

                                            <Card title="Custom CSS" sectioned>
                                                <TextField
                                                    label="Custom CSS"
                                                    multiline={6}
                                                    value={css}
                                                    onChange={(value) => setCSS(value)}
                                                    name="customCSS"
                                                    autoComplete="off"
                                                />
                                            </Card>

                                            <Button submit primary>Save Settings</Button>
                                        </FormLayout>
                                    </Form>
                                ) : (
                                    <Card sectioned>
                                        <Text variant="headingMd">CSS Guide</Text>
                                        <List type="bullet">
                                            <List.Item><code>.wishlist-icon</code> — Main icon class applied to each heart icon</List.Item>
                                            <List.Item>Use <code>stroke</code> or <code>fill</code> to change color dynamically</List.Item>
                                            <List.Item>You can add animations, transitions, scale on hover, etc.</List.Item>
                                        </List>

                                        <Text variant="headingSm" as="h3" tone="subdued" style={{ marginTop: '1rem' }}>
                                            CSS Example:
                                        </Text>
                                        <pre style={{
                                            backgroundColor: '#f6f6f7',
                                            padding: '1rem',
                                            borderRadius: '6px',
                                            marginTop: '0.5rem',
                                            whiteSpace: 'pre-wrap',
                                            fontSize: '0.85rem',
                                        }}>
                                            <code>
{`
.wishlist-icon svg {
    stroke-width: 0 !important;
    transition: stroke 0.3s ease !important;
}

.cbb-also-bought-product .wishlist-icon {
    float: inline-end !important;
    position: unset !important;
} `}
                                            </code>
                                        </pre>

                                        <Text variant="headingSm" as="h3" tone="subdued" style={{ marginTop: '1.5rem' }}>
                                            Class Selector Injection Example:
                                        </Text>
                                        <Text tone="subdued" style={{ marginTop: '0.5rem' }}>
                                            specify selectors in this format:
                                        </Text>
                                        <pre style={{
                                            backgroundColor: '#f6f6f7',
                                            padding: '1rem',
                                            borderRadius: '6px',
                                            marginTop: '0.5rem',
                                            whiteSpace: 'pre-wrap',
                                            fontSize: '0.85rem',
                                        }}>
                                            <code>
                                                {`.product-card\n.grid__item`}
                                                </code>
                                        </pre>
                                    </Card>
                                )}
                            </Tabs>
                        </Card>
                    </Layout.Section>
                </Layout>
            </Page>

        </AppProvider>
    );
}
