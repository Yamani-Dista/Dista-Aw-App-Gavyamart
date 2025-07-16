import { json } from "@remix-run/node";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import { PrismaClient } from "@prisma/client";
import {
  AppProvider,
  Page,
  Layout,
  Text,
  TextField,
  FormLayout,
  Button,
  Card,
  Checkbox,
  Select,
  RangeSlider,
  Tabs,
  Banner,
  List
} from "@shopify/polaris";
import shopify from "../shopify.server"
import { useState, useEffect } from "react";

const prisma = new PrismaClient();

function addImportantToCSS(css) {
  return css.replace(/([^;{}\n]+)(;)/g, (match, declaration, end) => {
    if (declaration.includes('!important')) return match;
    return declaration.trim() + ' !important' + end;
  });
}

export const loader = async ({request}) => {
  const { session } = await shopify.authenticate.admin(request);
  const { shop } = session;
  const settings = await prisma.wishlistCustom.findFirst(
    {where : { shop} }
  );
  return json({
    css: settings?.css || '',
    showAddToCart: settings?.showAddToCart ?? true,
    showBuyNow: settings?.showBuyNow ?? true,
    displayMode: settings?.displayMode || 'carousel',
    productsPerRow: settings?.productsPerRow || 3,
    initialProducts: settings?.initialProducts || 6,
    cardLayout: settings?.cardLayout || 'vertical'
  });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  let css = formData.get('css') || '';
  css = addImportantToCSS(css);
  const showAddToCart = formData.get('showAddToCart') === 'true';
  const showBuyNow = formData.get('showBuyNow') === 'true';
  const displayMode = formData.get('displayMode') || 'carousel';
  const productsPerRow = parseInt(formData.get('productsPerRow') || '3', 10);
  const initialProducts = parseInt(formData.get('initialProducts') || '6', 10);
  const cardLayout = formData.get('cardLayout') || 'vertical';

  try {

    const { session } = await shopify.authenticate.admin(request);
    const { shop } = session;

    const existingRecord = await prisma.wishlistCustom.findFirst({
      where: { shop },

    });

    if (existingRecord) {
      await prisma.wishlistCustom.update({
        where: { id: existingRecord.id },
        data: {
          css,
          showAddToCart,
          showBuyNow,
          displayMode,
          productsPerRow,
          initialProducts,
          cardLayout, 
          updatedAt: new Date()
        },
      });
    } else {
      await prisma.wishlistCustom.create({
        data: {
          shop,
          css,
          showAddToCart,
          showBuyNow,
          displayMode,
          productsPerRow,
          initialProducts,
          cardLayout
        }
      });
    }

    return json({ success: true });
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
};

export default function CustomCSSAdmin() {
  const { css, showAddToCart, showBuyNow, displayMode, productsPerRow, initialProducts, cardLayout } = useLoaderData();
  const actionData = useActionData();

  const [customCSS, setCustomCSS] = useState(css);
  const [showATC, setShowATC] = useState(showAddToCart);
  const [showBuyNowBtn, setshowBuyNowBtn] = useState(showBuyNow);
  const [displayModeValue, setDisplayModeValue] = useState(displayMode);
  const [productsPerRowValue, setProductsPerRowValue] = useState(productsPerRow);
  const [initialProductsValue, setInitialProductsValue] = useState(initialProducts);
  const [success, setSuccess] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [cardLayoutState, setCardLayoutState] = useState(cardLayout); 

  useEffect(() => {
    if (actionData?.success) {
      setSuccess(true);
      const timer = setTimeout(() => {
        setSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [actionData]);

  const handleSubmit = (e) => {
    setSuccess(false);
  };

  const cssGuide = {
    productCard: [
      '.wishlist-card - Main container for each product card',
      '.wishlist-card--horizontal - Horizontal layout for product card',
      '.wishlist-image-wrapper - Container for product image',
      '.wishlist-image-link - Link wrapping the product image',
      '.wishlist-image - Product image element',
      '.wishlist-badge - Sale/offer badge',
      '.wishlist-details - Container for product details',
      '.wishlist-card-delete - Container for wishlist remove icon',
      '.wishlist-title - Product title',
      '.wishlist-reviews - Container for star ratings',
      '.wishlist-stars - Star rating display',
      '.wishlist-review-count - Number of reviews',
      '.wishlist-price-wrapper - Container for price',
      '.wishlist-price - Current price',
      '.wishlist-compare-price - Original/compare price',
      '.wishlist-button-container - Container for buttons',
      '.wishlist-atc-button - Add to Cart button',
      '.wishlist-atc-button-text - Text inside Add to Cart button',
      '.wishlist-buy-now-form - Form for Buy Now functionality',
      '.wishlist-buy-now-button - Buy Now button',
      '.wishlist-buynow-button-text - Text inside Buy Now button'
    ],
    carousel: [
      '.wishlist-container - Main container',
      '.wishlist-carousel-wrapper - Carousel container',
      '.wishlist-carousel - Carousel track',
      '.wishlist-carousel-prev - Previous button',
      '.wishlist-carousel-next - Next button'
    ],
    grid: [
      '.wishlist-grid - Grid container',
      '.wishlist-show-more-container - Show more button container',
      '.wishlist-show-more-button - Show more button'
    ],
    variables: [
      '--wish-primary - Primary color (default: #0066cc)',
      '--wish-buynow - Buy Now button color (default: #4caf50)',
      '--wish-badge - Badge color (default: #e7ac17)',
      '--wish-border - Border color (default: #e1e1e1)',
      '--wish-text - Text color (default: #333)',
      '--wish-star-filled - Filled star color (default: #ffb400)',
      '--wish-star-empty - Empty star color (default: #e1e1e1)'
    ],
    headings: [
      '.wishlist-heading - Heading for Wishlist Products section'
    ],
    empty_wishlist : [
      '.wishlist-items - Main Container when no wishlist items',
      '.no-wishlist - Container for logo and data'
    ]
  };

  return (
    <AppProvider i18n={{}}>
      <Page
        title="Wishlist Settings"
        primaryAction={{
          content: "Save Settings",
          onAction: () => {
            document.getElementById('custom-css-form')?.requestSubmit();
          },
          primary: true
        }}
      >
        <Layout>
          <Layout.Section>
            <Card sectioned>
              {success && (
                <Banner status="success">
                  <p>Settings saved successfully!</p>
                </Banner>
              )}
              {actionData?.error && (
                <Banner status="critical">
                  <p>Error: {actionData.error}</p>
                </Banner>
              )}

              <Tabs tabs={[
                { id: 'settings', content: 'Settings' },
                { id: 'css-guide', content: 'CSS Guide' }
              ]} selected={selectedTab} onSelect={setSelectedTab}>
                {selectedTab === 0 ? (
                  <Form id="custom-css-form" method="post" onSubmit={handleSubmit}>
                    <FormLayout>
                      <Card title="Display Settings" sectioned>
                        <FormLayout>
                          <Select
                            label="Display Mode"
                            name="displayMode"
                            options={[
                              { label: 'Carousel', value: 'carousel' },
                              { label: 'Grid', value: 'grid' }
                            ]}
                            value={displayModeValue}
                            onChange={(value) => {
                              setDisplayModeValue(value);
                            }}
                          />
                          <input type="hidden" name="displayMode" value={displayModeValue} />

                          {displayModeValue === 'grid' && (
                            <>
                              <RangeSlider
                                label="Products per row (In Desktop)"
                                name="productsPerRow"
                                value={productsPerRowValue}
                                onChange={(value) => {
                                  setProductsPerRowValue(value);
                                }}
                                min={1}
                                max={6}
                                step={1}
                                output
                              />
                              <input type="hidden" name="productsPerRow" value={productsPerRowValue} />

                              <RangeSlider
                                label="Initial products to show"
                                name="initialProducts"
                                value={initialProductsValue}
                                onChange={(value) => {
                                  setInitialProductsValue(value);
                                }}
                                min={2}
                                max={12}
                                step={1}
                                output
                              />
                              <input type="hidden" name="initialProducts" value={initialProductsValue} />
                            </>
                          )}
                        </FormLayout>
                      </Card>

                      <Card title="Card Layout" sectioned>
                        <Select
                          label="Card Layout"
                          name="cardLayout"
                          options={[
                            { label: 'Vertical', value: 'vertical' },
                            { label: 'Horizontal', value: 'horizontal' }
                          ]}
                          value={cardLayoutState}
                          onChange={(value) => {
                            setCardLayoutState(value);
                          }}
                        />
                        <input type="hidden" name="cardLayout" value={cardLayout} />
                      </Card>

                      <Card title="Button Visibility" sectioned>
                        <FormLayout>
                          <Checkbox
                            label="Show Add to Cart button"
                            name="showAddToCart"
                            value="true"
                            checked={showATC}
                            onChange={() => {
                              setShowATC(!showATC);
                            }}
                          />
                          <Checkbox
                            label="Show Buy Now button"
                            name="showBuyNow"
                            value="true"
                            checked={showBuyNowBtn}
                            onChange={() => {
                              setshowBuyNowBtn(!showBuyNowBtn);
                            }}
                          />
                        </FormLayout>
                      </Card>

                      <Card title="Custom CSS" sectioned>
                        <TextField
                          label="Custom CSS"
                          name="css"
                          multiline={24}
                          value={customCSS}
                          onChange={(value) => {
                            setCustomCSS(value);
                          }}
                          autoComplete="off"
                          helpText="Add custom CSS styles for the product cards"
                        />
                      </Card>

                      <Button submit primary>
                        Save Settings
                      </Button>
                    </FormLayout>
                  </Form>
                ) : (
                  <Card sectioned>
                    <Text variant="headingMd" as="h2">CSS Classes Guide</Text>
                    <Text as="p" color="subdued">
                      Use these classes to customize the appearance of your Wishlist section.
                    </Text>

                    <div style={{ marginTop: '20px' }}>
                      <Text variant="headingSm" as="h3">Product Card Classes</Text>
                      <List type="bullet">
                        {cssGuide.productCard.map((item, index) => (
                          <List.Item key={`card-${index}`}>{item}</List.Item>
                        ))}
                      </List>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                      <Text variant="headingSm" as="h3">Carousel Classes</Text>
                      <List type="bullet">
                        {cssGuide.carousel.map((item, index) => (
                          <List.Item key={`carousel-${index}`}>{item}</List.Item>
                        ))}
                      </List>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                      <Text variant="headingSm" as="h3">Grid Classes</Text>
                      <List type="bullet">
                        {cssGuide.grid.map((item, index) => (
                          <List.Item key={`grid-${index}`}>{item}</List.Item>
                        ))}
                      </List>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                      <Text variant="headingSm" as="h3">Empty Wishlist</Text>
                      <List type="bullet">
                        {cssGuide.empty_wishlist.map((item, index) => (
                          <List.Item key={`empty_wishlist-${index}`}>{item}</List.Item>
                        ))}
                      </List>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                      <Text variant="headingSm" as="h3">CSS Variables</Text>
                      <List type="bullet">
                        {cssGuide.variables.map((item, index) => (
                          <List.Item key={`var-${index}`}>{item}</List.Item>
                        ))}
                      </List>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                      <Text variant="headingSm" as="h3">Example Usage</Text>
                      <pre style={{
                        backgroundColor: '#f6f6f7',
                        padding: '16px',
                        borderRadius: '4px',
                        overflow: 'auto'
                      }}>
                        {`.wishlist-card {
  --wishlist-primary: #0066cc;
  --wishlist-buynow: #4caf50;
  --wishlist-badge: #e7ac17;
  border: 1px solid var(--wishlist-border);
}

.wishlist-title {
  color: var(--wishlist-text);
  font-size: 16px;
}

.wishlist-atc-button {
  background: var(--wishlist-primary);
  color: white;
}`}
                      </pre>
                    </div>
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
