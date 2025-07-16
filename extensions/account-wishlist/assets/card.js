 class ProductCardRendererwishlist {
      constructor(reply,widgetSettings) {
        this.reply = reply;
        this.widgetSettings = widgetSettings;
        this.template = document.getElementById('product-template-wishlist');
      }

      createCard(product) {
        const templateContent = this.template.content.cloneNode(true);
        const cardEl = templateContent.querySelector('.wishlist-card');
        const variant = product.variants?.edges[0]?.node;
        const presentmentPrice = variant.presentmentPrices?.edges[0]?.node.price.amount || null;
        const presentmentCompareAtPrice = variant.presentmentPrices?.edges[0]?.node.compareAtPrice?.amount || null;
        const count = product.reviewCount?.value;
        const ratingObj = product.rating;
        let ratingValue;
        if (ratingObj && ratingObj.value) {
          const parsedRating = JSON.parse(ratingObj.value);
          ratingValue = parsedRating.value;
        }
        this.setupCardLayout(cardEl);
        this.setupProductData(cardEl, product);
        this.setupPriceElements(cardEl, presentmentPrice, presentmentCompareAtPrice);
        this.setupRatingElements(cardEl, ratingValue, count);
        this.setupVariantInput(cardEl, product);
        this.setupButtonHandlers(cardEl, product);

        return templateContent;
      }

      setupCardLayout(cardEl) {
        if (cardEl) {
          cardEl.setAttribute('data-card-layout', this.reply.cardLayout);
          if (this.reply.cardLayout === 'horizontal') {
            cardEl.classList.add('wishlist-card--horizontal');
          } else {
            cardEl.classList.remove('wishlist-card--horizontal');
          }
          cardEl.style.setProperty('--show-add-to-cart', this.reply.showAddToCart ? 'block' : 'none');
          cardEl.style.setProperty('--show-buy-now', this.reply.showBuyNow ? 'block' : 'none');
        }
      }

      setupProductData(cardEl, product) {
        const numericID = window.WishlistUtils.extractNumericId(product.id);
        cardEl.setAttribute('data-product-id', numericID);
        const imageLink = cardEl.querySelector('.wishlist-image-link');
        const titleLink = cardEl.querySelector('.wishlist-title');
        const imageEl = cardEl.querySelector('.wishlist-image');
        const reviewsLink = cardEl.querySelector('.wishlist-reviews-link');

        if (imageLink) imageLink.href = `/products/${product.handle}`;
        if (titleLink) titleLink.href = `/products/${product.handle}`;
        if (imageEl) imageEl.src = product.featuredImage.url || '';
        if (titleLink) titleLink.textContent = product.title || '';
        if (reviewsLink) reviewsLink.href = `/products/${product.handle}`;

        const atcBtn = cardEl.querySelector('.wishlist-atc-button');
        if (atcBtn) {
          const numericID = window.WishlistUtils.extractNumericId(product.id);
          atcBtn.setAttribute('data-product-card-swatch-id', numericID);
          atcBtn.href = `/products/${product.handle}`;
        }

        const buyNowBtn = cardEl.querySelector('.wishlist-buy-now-button');
        if (buyNowBtn) {
          const numericID = window.WishlistUtils.extractNumericId(product.id);
          buyNowBtn.setAttribute('data-product-card-swatch-id', numericID);
          buyNowBtn.href = product.url;
        }

        const variants = product.variants?.edges?.map((edge) => edge.node) || [];
        const allVariantsUnavailable = variants.length === 0 || !variants.some((v) => v.availableForSale !== false);
        if (allVariantsUnavailable) {
          const atcBtn = cardEl.querySelector('.wishlist-atc-button');
          const buyNowBtn = cardEl.querySelector('.wishlist-buy-now-button');
          if (atcBtn) {
            atcBtn.disabled = true;
            atcBtn.textContent = 'Sold Out';
            atcBtn.style.opacity = '0.5';
            atcBtn.style.pointerEvents = 'none';
          }
          if (buyNowBtn) {
            buyNowBtn.disabled = true;
            buyNowBtn.textContent = 'Sold Out';
            buyNowBtn.style.opacity = '0.5';
            buyNowBtn.style.pointerEvents = 'none';
          }
        }

         const quickViewButtons = cardEl.querySelectorAll('.quick-view-btn');
        const hasRealVariants =
          product.variants.edges && product.variants.edges.length > 1
          || (product.variants.edges && product.variants.edges.length === 1 && product.variants.edges[0].node.title !== 'Default Title');
        quickViewButtons.forEach(btn => {
          btn.setAttribute('data-product', JSON.stringify(product));
          btn.setAttribute('data-title', encodeURIComponent(product.title));
          btn.setAttribute('data-has-variants', hasRealVariants ? 'true' : 'false');
        });

      }

      setupPriceElements(cardEl, price, comparePrice) {
        const priceEl = cardEl.querySelector('.wishlist-price');
        const comparePriceEl = cardEl.querySelector('.wishlist-compare-price');
        const saveBadgeEl = cardEl.querySelector('.wishlist-badge');

        if (priceEl) {
          const formattedPrice = parseFloat(price).toFixed(2);
          const stringCurrency = String(formattedPrice);
          priceEl.textContent = window.CurrencyUtils.formatMoneyCurrency(stringCurrency, window.money_format);
        }

        if (comparePriceEl) {
          const compareAtPrice = parseFloat(comparePrice || 0);
          const currentPrice = parseFloat(price || 0);

          if (compareAtPrice > currentPrice) {
            const formattedPrice = parseFloat(comparePrice).toFixed(2);
            const stringCurrency = String(formattedPrice);
            comparePriceEl.textContent = window.CurrencyUtils.formatMoneyCurrency(stringCurrency, window.money_format);
            comparePriceEl.style.display = 'inline';
          } else {
            comparePriceEl.style.display = 'none';
          }
        }

        if (saveBadgeEl) {
          const compareAtPrice = parseFloat(comparePrice);
          const currentPrice = parseFloat(price);
          const discount = Math.round(((compareAtPrice - currentPrice) / compareAtPrice) * 100);

          if (!isNaN(discount) && discount > 0) {
            

            const saveText = this.widgetSettings.saveText || 'Save {percent}%';
            const parts = saveText.split('{percent}');
            let after = parts[1] || '';
            let symbol = '';
            if (after.startsWith('%')) {
              symbol = '%';
              after = after.slice(1);
            }
            saveBadgeEl.innerHTML = `${parts[0]}<div class="wishlist-discount-value">${discount}${symbol}</div>${after}`;
            saveBadgeEl.style.display = 'flex';
            saveBadgeEl.style.flexDirection = 'row';
            saveBadgeEl.style.whiteSpace = 'pre';

          } else {
            saveBadgeEl.style.display = 'none';
          }
        }
      }

      setupRatingElements(cardEl, rating, count) {
        const ratingStars = cardEl.querySelector('.wishlist-stars');
        const ratingCount = cardEl.querySelector('.wishlist-review-count');

        if (ratingStars && rating > 0) {
          ratingStars.style.setProperty('--rating', rating);
          ratingStars.parentElement.classList.add('visible');
          ratingStars.parentElement.style.visibility = 'visible';

          const starsText = this.widgetSettings.starsText || '{count} review/reviews';
          const formattedStarsText = starsText.replace('{count}', count);
          
          if (ratingCount) {
            ratingCount.textContent = formattedStarsText;
          }

        
        } else if (ratingStars) {
          ratingStars.parentElement.style.visibility = 'hidden';
          ratingStars.parentElement.classList.remove('visible');
        }
      }

      setupVariantInput(cardEl, product) {
        const variantInput = cardEl.querySelector('.product-variant-id');
        const formEl = cardEl.querySelector('.wishlist-form');
        const buyNowFormEl = cardEl.querySelector('.wishlist-buy-now-form');

        if (variantInput) {
          if (product.variants?.length > 0 && product.variants[0].id) {
            const variantId = product.variants[0].id.split('/').pop();
            variantInput.value = variantId;

            if (formEl) {
              formEl.setAttribute('data-product-title', product.title);
              formEl.setAttribute('data-variant-id', variantId);
            }
            if (buyNowFormEl) {
              const variantInput = buyNowFormEl.querySelector('.product-variant-id');
              variantInput.value = variantId;
              buyNowFormEl.setAttribute('data-product-title', product.title);
              buyNowFormEl.setAttribute('data-variant-id', variantId);
            }
          } else {
            this.disableUnavailableButtons(formEl, buyNowFormEl);
          }
        }
      }

      disableUnavailableButtons(formEl, buyNowFormEl) {
        if (formEl) {
          formEl.style.opacity = '0.5';
          formEl.style.pointerEvents = 'none';
          const button = formEl.querySelector('button');
          if (button) {
            button.disabled = true;
            button.textContent = 'Unavailable';
          }
        }
        if (buyNowFormEl) {
          buyNowFormEl.style.opacity = '0.5';
          buyNowFormEl.style.pointerEvents = 'none';
          const buyNowButton = buyNowFormEl.querySelector('button');
          if (buyNowButton) {
            buyNowButton.disabled = true;
            buyNowButton.textContent = 'Unavailable';
          }
        }
      }

      setupButtonHandlers(cardEl, product) {
        const formEl = cardEl.querySelector('.wishlist-form');
        const buyNowFormEl = cardEl.querySelector('.wishlist-buy-now-form');
      }
    }

    class CarouselControllerwishlist {
      constructor(carousel, prevBtn, nextBtn, cardLayout) {
        this.carousel = carousel;
        this.prevBtn = prevBtn;
        this.nextBtn = nextBtn;
        this.cardLayout = cardLayout;
        this.currentIndex = 0;
        this.cards = [];
        this.gap = 20;
        this.resizeObserver = new ResizeObserver(() => this.handleResize());
      }

      init() {
        this.cards = Array.from(this.carousel.querySelectorAll('.wishlist-card'));
        if (this.cards.length === 0) return;

        this.cardWidth = this.cards[0].offsetWidth;
        this.containerWidth = this.carousel.parentElement.offsetWidth;
        this.maxIndex = this.calculateMaxIndex();
        this.prevBtn.addEventListener('click', () => this.navigate(-1));
        this.nextBtn.addEventListener('click', () => this.navigate(1));
        this.resizeObserver.observe(this.carousel.parentElement);

        this.updateCarousel();
      }

      calculateMaxIndex() {
        const totalWidth = this.cardWidth + this.gap;
        const visibleCards = Math.floor((this.containerWidth + this.gap) / totalWidth);
        return Math.max(0, this.cards.length - visibleCards);
      }

      navigate(direction) {
        this.currentIndex = Math.max(0, Math.min(this.currentIndex + direction, this.maxIndex));
        this.updateCarousel();
      }

      updateCarousel() {
        this.currentIndex = Math.max(0, Math.min(this.currentIndex, this.maxIndex));
        const offset = -this.currentIndex * (this.cardWidth + this.gap);
        this.carousel.style.transform = `translateX(${offset}px)`;

        const isMobile = window.innerWidth <= 600;
        const isHorizontal = this.cardLayout === 'horizontal';

        if (isMobile && isHorizontal) {
          this.nextBtn.style.display = this.currentIndex === this.maxIndex - 1 ? 'none' : 'flex';
        } else {
          this.nextBtn.style.display = this.currentIndex === this.maxIndex ? 'none' : 'flex';
        }

        this.prevBtn.style.display = this.currentIndex <= 0 ? 'none' : 'flex';
      }

      handleResize() {
        this.cardWidth = this.cards[0]?.offsetWidth || this.cardWidth;
        this.containerWidth = this.carousel.parentElement.offsetWidth;
        this.maxIndex = this.calculateMaxIndex();
        this.currentIndex = Math.min(this.currentIndex, this.maxIndex);
        this.updateCarousel();
      }

      destroy() {
        this.resizeObserver.disconnect();
        this.prevBtn.removeEventListener('click', () => this.navigate(-1));
        this.nextBtn.removeEventListener('click', () => this.navigate(1));
      }
    }