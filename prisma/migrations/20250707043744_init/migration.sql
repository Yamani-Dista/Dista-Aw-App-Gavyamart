-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CancelOrderType" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "cancelOrderBehavior" TEXT NOT NULL DEFAULT 'direct',
    "script" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CancelOrderType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountTabSettings" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "accountDetails" BOOLEAN NOT NULL DEFAULT true,
    "addresses" BOOLEAN NOT NULL DEFAULT true,
    "orders" BOOLEAN NOT NULL DEFAULT true,
    "wishlist" BOOLEAN NOT NULL DEFAULT false,
    "wishlistLink" TEXT,
    "credits" BOOLEAN NOT NULL DEFAULT false,
    "subscriptions" BOOLEAN NOT NULL DEFAULT false,
    "subscriptionsLink" TEXT,
    "cancelOrderBehavior" TEXT NOT NULL DEFAULT 'direct',
    "script" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountTabSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "shop" TEXT NOT NULL,
    "menuTabs" JSONB NOT NULL,
    "cancelOrderBehavior" TEXT NOT NULL,
    "script" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiCredentials" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiCredentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iconSettings" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "iconColorBefore" TEXT NOT NULL,
    "iconColorAfter" TEXT NOT NULL,
    "customCSS" TEXT NOT NULL DEFAULT '',
    "classSelector" TEXT,

    CONSTRAINT "iconSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlistCustom" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "css" TEXT NOT NULL,
    "showAddToCart" BOOLEAN NOT NULL DEFAULT true,
    "showBuyNow" BOOLEAN NOT NULL DEFAULT true,
    "displayMode" TEXT NOT NULL DEFAULT 'carousel',
    "productsPerRow" INTEGER NOT NULL DEFAULT 3,
    "initialProducts" INTEGER NOT NULL DEFAULT 6,
    "cardLayout" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wishlistCustom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "widgetSettings" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "starsText" TEXT NOT NULL DEFAULT '{count} review/reviews',
    "starsColor" TEXT NOT NULL DEFAULT '#26d9b1',
    "showText" BOOLEAN NOT NULL DEFAULT true,
    "saveText" TEXT NOT NULL DEFAULT 'Save {percent}%',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "widgetSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuickViewCss" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "css" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuickViewCss_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuickViewCss_shop_key" ON "QuickViewCss"("shop");
