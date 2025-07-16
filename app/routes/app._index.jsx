import {
  AppProvider,
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Banner,
  List,
  Link,

} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function Index() {

  return (
    <AppProvider i18n={{}}>
      <Page>
        <TitleBar title="Dista App - Account-Wishlist" />
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <BlockStack gap="400">
                <Text as="h1" variant="headingXl">
                  Welcome to Dista App - Account Page
                </Text>
                <Text variant="bodyMd" as="p" color="subdued">
                  Empower your customers with a seamless Account Page experience.
                  Let them view their order history, manage personal details, and
                  track purchases all in one place. Fully customizable and
                  perfectly integrated with your Shopify theme.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card title="About This App" sectioned>
              <Text as="p">
                Our app enhances the customer experience by providing a dedicated{" "}
                <b>Account Page</b> where users can view order history, manage
                personal details, and track their purchases. The Account Page is
                fully customizable and can be seamlessly integrated using
                Shopify’s theme editor.
              </Text>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card title="How to Embed in Your Theme" sectioned>
              <BlockStack gap="200">
                <Banner status="info">
                  <Text as="span">
                    <b>Important:</b> You need to <b>enable our app in App
                    Extensions</b> in your theme customization before blocks will
                    appear.
                  </Text>
                </Banner>
                <Text as="h3" variant="headingMd">
                  1. Open Shopify Theme Editor
                </Text>
                <Text as="p">
                  Go to <b>Online Store &gt; Themes &gt; Customize</b>.
                </Text>
                <Text as="h3" variant="headingMd">
                  2. Enable App Extensions
                </Text>
                <Text as="p">
                  In the theme editor, click <b>App embeds</b> (the puzzle icon),
                  find <b>Dista App - Account Page</b>, and enable it.
                </Text>
                <Text as="h3" variant="headingMd">
                  3. Save and Publish
                </Text>
                <Text as="p">
                  Click <b>Save</b> in the theme editor to apply changes.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card title="Resources & Support" sectioned>
              <List type="bullet">
                <List.Item>
                  <Link
                    url="https://help.shopify.com/en/manual/online-store/themes/theme-structure/sections-and-blocks"
                    target="_blank"
                  >
                    Shopify: Using Sections and Blocks
                  </Link>
                </List.Item>
              </List>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>

      <Page>
      <TitleBar title="Dista App - Account-Wishlist" />

      <Layout>
        <Layout.Section>
          <Card sectioned>
            <BlockStack gap="400">
              <Text as="h1" variant="headingXl">
                Welcome to Dista App - Wishlist
              </Text>
              <Text variant="bodyMd" as="p" color="subdued">
                Increase customer retention and boost conversions with a personalized Wishlist experience. Let customers save their favorite products and pick up right where they left off. Fully customizable and seamlessly integrates with your Shopify theme.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="About This App" sectioned>
            <Text as="p">
              Our app helps merchants increase sales by enabling customers to create a <b>Wishlist</b> of their favorite products. The Wishlist section is fully customizable and can be embedded anywhere using Shopify’s theme editor.
            </Text>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="How to Embed in Your Theme" sectioned>
            <BlockStack gap="200">
              <Banner status="info">
                <Text as="span">
                  <b>Important:</b> You need to <b>enable our app in App Extensions</b> in your theme customization before blocks will appear.
                </Text>
              </Banner>
              <Text as="h3" variant="headingMd">
                1. Open Shopify Theme Editor
              </Text>
              <Text as="p">
                Go to <b>Online Store &gt; Themes &gt; Customize</b>.
              </Text>
              <Text as="h3" variant="headingMd">
                2. Enable App Extensions
              </Text>
              <Text as="p">
                In the theme editor, click <b>App embeds</b> (the puzzle icon), find <b>Dista App - Wishlist</b>, and enable it.
              </Text>
              <Text as="h3" variant="headingMd">
                3. Add App Blocks
              </Text>
              <List type="bullet">
                <List.Item>
                  <b>Wishlist Button:</b> Add the <b>Wishlist</b> button to product detail pages, allowing customers to save their favorite products.
                </List.Item>
                <List.Item>
                  <b>Wishlist Section:</b> Display the <b>Wishlist</b> block anywhere in your store—homepage, product pages, dedicated Wishlist page.
                </List.Item>
              </List>
              <Text as="h3" variant="headingMd">
                4. Save and Publish
              </Text>
              <Text as="p">
                Click <b>Save</b> in the theme editor to apply changes.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
        
        

        <Layout.Section>
          <Card title="Resources & Support" sectioned>
            <List type="bullet">
              <List.Item>
                <Link url="https://help.shopify.com/en/manual/online-store/themes/theme-structure/sections-and-blocks" target="_blank">
                  Shopify: Using Sections and Blocks
                </Link>
              </List.Item>
            </List>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
    </AppProvider>
  );
}