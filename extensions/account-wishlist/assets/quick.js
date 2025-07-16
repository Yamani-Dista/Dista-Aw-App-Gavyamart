document.body.addEventListener('click', function (event) {
    if (event.target.closest('.quick-view-btn')) {
        const button = event.target.closest('.quick-view-btn');
        const productData = button.getAttribute('data-product');
        const productTitle = button.getAttribute('data-title');
        const actionType = button.getAttribute('data-action') || 'add-to-cart';
        const hasVariants = button.getAttribute('data-has-variants') === 'true';
        if (!productData) {
            console.error('No product data found on button');
            return;
        }


        if (!hasVariants) {
            try {
                const product = JSON.parse(productData);
                const variantId = product.variants?.edges?.[0]?.node?.id?.split('/').pop();

                if (!variantId) return;

                const buttonSpan = button.querySelector('.wishlist-atc-button-text') || button;
                if (!buttonSpan.dataset.originalText) {
                    buttonSpan.dataset.originalText = buttonSpan.textContent;
                }
                const originalText = buttonSpan.dataset.originalText;
                buttonSpan.textContent = actionType === 'reorder' || actionType === 'buy-now' ? 'Processing...' : 'Adding...';
                button.disabled = true;

                if (actionType === 'reorder' || actionType === 'buy-now') {

                    fetch('/cart/add.js', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: variantId, quantity: 1 }),
                    }).then(() => {
                        window.location.href = '/checkout';
                    });
                } else {
                    fetch('/cart/add.js', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: variantId, quantity: 1 }),
                    }).then(() => {
                        const desktopCartCheckbox = document.getElementById('minicart__button--header--default');
                        const mobileCartCheckbox = document.getElementById('minicart__button--header--default-mobile');
                        if (desktopCartCheckbox) desktopCartCheckbox.checked = true;
                        if (mobileCartCheckbox) mobileCartCheckbox.checked = true;
                        setTimeout(() => {
                            buttonSpan.textContent = originalText;
                            button.disabled = false;
                        }, 2000);
                    });
                }
            } catch (error) {
                console.error('Error parsing product data:', error);
            }
            return;
        }

        let atcTextRVP = button.querySelector('.wishlist-atc-button-text')?.textContent.trim() || '';
        let buyNowText = button.querySelector('.wishlist-buy-now-button-text')?.textContent.trim() || '';
        try {
            const product = JSON.parse(productData);
            const decodedTitle = decodeURIComponent(productTitle);
            showWishlistModal({ ...product, title: decodedTitle }, actionType, {
                atcTextRVP,
                buyNowText,
            });
        } catch (error) {
            console.error('Error parsing product data:', error);
        }
    }
});


function showWishlistModal(product, actionType, buttonTexts = {}) {
    if (document.querySelector('.wishlist-quick-view-modal-wrapper')) {
        return;
    }
    const AppUtils = window.WishlistUtils;
    if (!AppUtils) {
        console.error('No utility object (WishlistUtils) found.');
        return;
    }

    const featuredImageUrl = product.featuredImage.url || 'https://via.placeholder.com/100';
    const productHandle = `/products/${product.handle}` || '#';
    const productTitle = product.title || 'Unknown Product';
    const imagesRaw = product.images;
    const allImages = Array.isArray(imagesRaw)
        ? imagesRaw
        : imagesRaw && imagesRaw.edges
            ? imagesRaw.edges.map(e => e.node)
            : [{ url: featuredImageUrl, altText: 'No description available' }];



    let ratingValue = 0;
    if (product.rating && typeof product.rating.value === 'string') {
        try {
            const ratingObj = JSON.parse(product.rating.value);
            ratingValue = parseFloat(ratingObj.value) || 0;
        } catch (e) {
            ratingValue = 0;
        }
    }

    let reviewCountValue = 0;
    if (product.reviewCount && typeof product.reviewCount.value === 'string') {
        reviewCountValue = parseInt(product.reviewCount.value, 10) || 0;
    }

    product.rating = ratingValue;
    product.ratingCount = reviewCountValue;

    const optionNames =
        product.variants.edges && product.variants.edges.length > 0 && product.variants.edges[0].node.selectedOptions
            ? product.variants.edges[0].node.selectedOptions.map((opt) => opt.name)
            : [];
    const optionsHtml = optionNames
        .map((optionName, optionIndex) => {
            const values = [
                ...new Set(
                    product.variants.edges
                        .map((variant) => (variant.node.selectedOptions || []).find((opt) => opt.name === optionName)?.value)
                        .filter(Boolean)
                ),
            ];
            return `
  <div class="wishlist-variant-group" data-option-index="${optionIndex}">
    <div class="wishlist-variant-label">${optionName}:</div>
    <div class="wishlist-variant-buttons">
      ${values
                    .map((value, vIdx) => {
                        const isSoldOut = !(product.variants.edges || []).some(variant =>
                            (variant.node.selectedOptions || []).some(opt => opt.name === optionName && opt.value === value) &&
                            variant.node.availableForSale !== false
                        );
                        return `
            <button type="button" class="wishlist-variant-btn${isSoldOut ? ' wishlist-variant-btn-soldout' : ''}" data-option-index="${optionIndex}" data-value="${value}">${value}</button>
          `;
                    })
                    .join('')}
    </div>
  </div>
`;
        })
        .join('');

    document.body.style.overflow = 'hidden';
    const modal = document.createElement('div');
    const modalWrapper = document.createElement('div');
    modalWrapper.className = 'wishlist-quick-view-modal-wrapper';
    modal.className = 'wishlist-quick-view-modal-box';
    const buttonLabel =
        actionType === 'buy-now'
            ? buttonTexts.buyNowText
            : actionType === 'add-to-cart'
                ? buttonTexts.atcTextRVP
                : buttonTexts.atcTextRO;

    modal.innerHTML = `
    <div class="wishlist-quick-view-modal">
        <button class="wishlist-close">&times;</button>
        <div class="wishlist-modal-content">
            <a class="wishlist-back-to-shop" onclick="document.querySelector('.wishlist-quick-view-modal-wrapper').remove(); document.body.style.overflow = ''">Back to shop</a>
            <div class="wishlist-quick-view-left-content">
                <div class="wishlist-thumbnail-carousel-wrapper">
                  <button class="wishlist-thumb-arrow wishlist-thumb-arrow-up">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
                  </button>
                  <div class="wishlist-quick-view-thumbnails" tabindex="0">
                    ${allImages
            .map(
                (image, index) => `
                        <img 
                        src="${image.url}" 
                        alt="Thumbnail ${index + 1}" 
                        class="wishlist-thumbnail-image" data-thumb-index="${index}" 
                        onclick="document.getElementById('wishlist-main-product-image').src='${image.url}'"
                        />
                    `
            )
            .join('')}
                  </div>
                  <button class="wishlist-thumb-arrow wishlist-thumb-arrow-down">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                </div>
                <div class="wishlist-main-image-carousel-wrapper">
                  <button class="wishlist-main-arrow wishlist-main-arrow-left">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <div class="wishlist-quick-view-main-image-list" tabindex="0">
                    ${allImages.map((img, idx) => `
                      <img src="${img.url}" alt="${productTitle}" class="wishlist-main-image-item" data-main-index="${idx}" draggable="false" />
                    `).join('')}
                  </div>
                  <button class="wishlist-main-arrow wishlist-main-arrow-right">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                </div>
            </div>
            <div class="wishlist-quick-view-right-content">
                <a class="wishlist-quick-view-product-title" href="${productHandle}">
                    ${productTitle}
                </a>
                ${(product.rating && product.ratingCount) ? `
                <div class="wishlist-quick-view-reviews">
                    <span class="wishlist-qv-reviews-badge__stars" data-score="${product.rating}">
                        ${renderStars(product.rating)}
                    </span>
                    <span class="wishlist-qv-reviews-badge__text">
                        <strong>${product.ratingCount} Review${(product.ratingCount == 1) ? '' : 's'}</strong>
                    </span>
                </div>
                ` : ''}
                 <a href="${productHandle}" target="_blank" class="wishlist-view-details">view full details</a>

                <div class="wishlist-price-wrapper" id="wishlist-quick-view-price-wrapper">
                  <div class="wishlist-compare-at-row">
                    <span id="wishlist-quick-view-compare-price" class="wishlist-compare-at-price"></span>
                  </div>
                  <div class="wishlist-price-row">
                    <span id="wishlist-quick-view-price"></span>
                    <span class="wishlist-vertical-separator">|</span>
                    <span id="wishlist-quick-view-discount-badge" class="wishlist-discount-inline" style="display:none"></span>
                  </div>
                </div>
                <form id="wishlist-quick-view-form">
                    <div id="wishlist-quick-view-soldout-message" style="display:none; color:#000; font-weight:bold; margin-bottom:8px;">Sold out</div>
                    <div class="wishlist-variants-dropdown-wrapper">
                    ${optionsHtml}
                    </div>
                    <div class="wishlist-add-to-cart-container">
                        <div class="wishlist-quantity-selector">
                            <button type="button" id="wishlist-decrement-qty">-</button>
                            <input type="number" id="wishlist-quick-view-quantity" name="quantity" value="1" min="1" autocomplete="off" />
                            <button type="button" id="wishlist-increment-qty">+</button>
                        </div>
                        <button type="submit" class="wishlist-add-to-cart-button">
                          <span class="wishlist-add-to-cart-text">${buttonLabel}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
  `;

    modalWrapper.appendChild(modal);
    document.body.appendChild(modalWrapper);

    const thumbArrowUp = modal.querySelector('.wishlist-thumb-arrow-up');
    const thumbArrowDown = modal.querySelector('.wishlist-thumb-arrow-down');
    const thumbWrapper = modal.querySelector('.wishlist-quick-view-thumbnails');
    const thumbImages = Array.from(thumbWrapper ? thumbWrapper.querySelectorAll('.wishlist-thumbnail-image') : []);

    if (thumbArrowUp && thumbArrowDown && thumbWrapper) {
        if (thumbImages.length <= 5) {
            thumbArrowUp.style.display = 'none';
            thumbArrowDown.style.display = 'none';
            thumbWrapper.style.overflowY = 'hidden';
            thumbWrapper.style.maxHeight = 'none';
        } else {
            thumbArrowUp.style.display = '';
            thumbArrowDown.style.display = '';
            thumbWrapper.style.overflowY = 'auto';
            thumbWrapper.style.maxHeight = '400px';
        }
    }

    // --- Carousel logic ---
    // Vertical thumbnail carousel
    thumbArrowUp.addEventListener('click', () => {
        thumbWrapper.scrollBy({ top: -thumbImageHeight, behavior: 'smooth' });
    });
    thumbArrowDown.addEventListener('click', () => {
        thumbWrapper.scrollBy({ top: thumbImageHeight, behavior: 'smooth' });
    });

    // Horizontal main image carousel
    const mainImageList = modal.querySelector('.wishlist-quick-view-main-image-list');
    const mainImages = Array.from(mainImageList.querySelectorAll('.wishlist-main-image-item'));
    const mainArrowLeft = modal.querySelector('.wishlist-main-arrow-left');
    const mainArrowRight = modal.querySelector('.wishlist-main-arrow-right');
    let mainIndex = 0;
    function scrollToMainImage(idx) {
        mainIndex = idx;
        const img = mainImages[mainIndex];
        img.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    mainArrowLeft.addEventListener('click', () => {
        if (mainIndex > 0) scrollToMainImage(mainIndex - 1);
    });
    mainArrowRight.addEventListener('click', () => {
        if (mainIndex < mainImages.length - 1) scrollToMainImage(mainIndex + 1);
    });
    // Manual scroll: update mainIndex on scroll end
    let mainScrollTimeout;
    mainImageList.addEventListener('scroll', () => {
        clearTimeout(mainScrollTimeout);
        mainScrollTimeout = setTimeout(() => {
            // Find the image closest to the center
            const listRect = mainImageList.getBoundingClientRect();
            let minDist = Infinity, minIdx = 0;
            mainImages.forEach((img, i) => {
                const rect = img.getBoundingClientRect();
                const dist = Math.abs(rect.left + rect.width / 2 - (listRect.left + listRect.width / 2));
                if (dist < minDist) { minDist = dist; minIdx = i; }
            });
            scrollToMainImage(minIdx);
        }, 100);
    });
    // Thumbnail click updates main image
    thumbImages.forEach((img, i) => {
        img.addEventListener('click', () => scrollToMainImage(i));
    });
    // Initial highlight
    scrollToMainImage(0);

    // Quantity increment/decrement logic (already present)
    const qtyInput = modal.querySelector('#wishlist-quick-view-quantity');
    modal.querySelector('#wishlist-decrement-qty').addEventListener('click', function () {
        let val = parseInt(qtyInput.value, 10) || 1;
        if (val > 1) qtyInput.value = val - 1;
    });
    modal.querySelector('#wishlist-increment-qty').addEventListener('click', function () {
        let val = parseInt(qtyInput.value, 10) || 1;
        qtyInput.value = val + 1;
    });

    // Add to Cart functionality for modal
    modal.querySelector('#wishlist-quick-view-form').addEventListener('submit', function (e) {
        e.preventDefault();
        // Find the matching variant
        const matchedVariant =
            (product.variants.edges || []).find((variant) => {
                if (!variant.node.selectedOptions) return false;
                return selectedOptions.every((opt) =>
                    variant.node.selectedOptions.some((selOpt) => selOpt.name === opt.name && selOpt.value === opt.value)
                );
            }) || product.variants.edges[0];
        const variantId = matchedVariant.node.id ? matchedVariant.node.id.split('/').pop() : null;
        const quantity = parseInt(qtyInput.value, 10) || 1;
        const button = modal.querySelector('.wishlist-add-to-cart-button');
        if (!variantId || !button) return;

        const buttonSpan = button.querySelector('.wishlist-add-to-cart-text') || button;
        const originalText = buttonSpan.textContent;
        button.disabled = true;
        if (buttonSpan.classList && buttonSpan.classList.contains('wishlist-add-to-cart-text')) {
            buttonSpan.textContent = actionType === 'reorder' || actionType === 'buy-now' ? 'Processing...' : 'Adding...';
        } else {
            buttonSpan.textContent = actionType === 'reorder' || actionType === 'buy-now' ? 'Processing...' : 'Adding...';
        }

        fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: variantId, quantity }),
        })
            .then((response) => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then((data) => {
                modal.remove();
                modalWrapper.remove();
                document.body.style.overflow = '';

                if (actionType === 'reorder' || actionType === 'buy-now') {
                    window.location.href = '/checkout';
                } else {
                    const desktopCartCheckbox = document.getElementById('minicart__button--header--default');
                    const mobileCartCheckbox = document.getElementById('minicart__button--header--default-mobile');
                    if (desktopCartCheckbox) desktopCartCheckbox.checked = true;
                    if (mobileCartCheckbox) mobileCartCheckbox.checked = true;

                    setTimeout(() => {
                        if (buttonSpan.classList && buttonSpan.classList.contains('wishlist-add-to-cart-text')) {
                            buttonSpan.textContent = originalText;
                        } else {
                            buttonSpan.textContent = originalText;
                        }
                        button.disabled = false;
                    }, 2000);
                }

                const productTitleEl = modal.querySelector('.wishlist-quick-view-product-title');
                if (productTitleEl && matchedVariant) {
                    let baseTitle = product.title;
                    const firstVariantTitle = product.variants.edges[0]?.node?.title;
                    const formattedVariantTitle = formatVariantTitle(matchedVariant.node.title);
                    if (
                        firstVariantTitle &&
                        firstVariantTitle !== 'Default Title' &&
                        baseTitle.endsWith(' - ' + firstVariantTitle)
                    ) {
                        baseTitle = baseTitle.slice(0, -(' - ' + firstVariantTitle).length);
                    }
                    if (formattedVariantTitle && formattedVariantTitle !== 'Default Title') {
                        productTitleEl.textContent = baseTitle + ' - ' + formattedVariantTitle;
                    } else {
                        productTitleEl.textContent = baseTitle;
                    }
                }
            })
            .catch((error) => {
                buttonSpan.textContent = 'Error';
                setTimeout(() => {
                    if (buttonSpan.classList && buttonSpan.classList.contains('wishlist-add-to-cart-text')) {
                        buttonSpan.textContent = originalText;
                    } else {
                        buttonSpan.textContent = originalText;
                    }
                    button.disabled = false;
                }, 2000);
            });
    });

    modal.querySelector('.wishlist-close').addEventListener('click', () => {
        modal.remove();
        modalWrapper.remove();
        document.body.style.overflow = '';
    });

    modalWrapper.addEventListener('click', (event) => {
        if (event.target === modalWrapper) {
            modal.remove();
            modalWrapper.remove();
            document.body.style.overflow = '';
        }
    });

    const variantGroups = modal.querySelectorAll('.wishlist-variant-group');
    const firstAvailableVariant = (product.variants.edges || []).find(v => v.node.availableForSale !== false) || product.variants.edges[0];
    let selectedOptions = optionNames.map((name, i) => {
        const match = (firstAvailableVariant.node.selectedOptions || []).find(opt => opt.name === name);
        return { name, value: match ? match.value : '' };
    });
    function updateVariantButtons() {
        variantGroups.forEach((group, groupIdx) => {
            const btns = group.querySelectorAll('.wishlist-variant-btn');
            btns.forEach((btn) => {
                if (selectedOptions[groupIdx].value === btn.textContent) {
                    btn.classList.add('selected');
                } else {
                    btn.classList.remove('selected');
                }
            });
        });
    }
    variantGroups.forEach((group, groupIdx) => {
        group.querySelectorAll('.wishlist-variant-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (selectedOptions[groupIdx].value === btn.textContent) {
                    selectedOptions[groupIdx].value = '';
                } else {
                    selectedOptions[groupIdx].value = btn.textContent;
                }
                updateVariantButtons();
                updatePriceByVariant();
            });
        });
    });
    updateVariantButtons();

    function getDiscountPercent(price, compareAtPrice) {
        if (!compareAtPrice || compareAtPrice <= price) return null;
        return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
    }

    function updatePriceByVariant() {
        const addToCartBtn = modal.querySelector('.wishlist-add-to-cart-button');
        const anyUnselected = selectedOptions.some(opt => !opt.value);
        const atcTextSpan = addToCartBtn.querySelector('.wishlist-add-to-cart-text');
        if (anyUnselected) {
            addToCartBtn.disabled = true;
            if (atcTextSpan) atcTextSpan.textContent = 'MAKE A SELECTION';
            addToCartBtn.style.opacity = '0.7';
            addToCartBtn.style.pointerEvents = 'none';
            const soldOutMsg = modal.querySelector('#wishlist-quick-view-soldout-message');
            if (soldOutMsg) soldOutMsg.style.display = 'none';
            const productTitleEl = modal.querySelector('.wishlist-quick-view-product-title');
            if (productTitleEl) {
                const selectedLabels = selectedOptions.filter(opt => opt.value).map(opt => opt.value);
                if (selectedLabels.length > 0) {
                    productTitleEl.textContent = product.title + ' - ' + selectedLabels.join(' - ');
                } else {
                    productTitleEl.textContent = product.title;
                }
            }
            return;
        }
        const matchedVariant =
            (product.variants.edges || []).find((variant) => {
                if (!variant.node.selectedOptions) return false;
                return selectedOptions.every((opt) =>
                    variant.node.selectedOptions.some((selOpt) => selOpt.name === opt.name && selOpt.value === opt.value)
                );
            }) || product.variants.edges[0];
       
        let price = '';
        let compareAtPrice = '';
        if (
            matchedVariant.node.presentmentPrices &&
            matchedVariant.node.presentmentPrices.edges &&
            matchedVariant.node.presentmentPrices.edges.length > 0
        ) {
            const priceNode = matchedVariant.node.presentmentPrices.edges[0].node;
            price = priceNode.price.amount;
            compareAtPrice = priceNode.compareAtPrice ? priceNode.compareAtPrice.amount : '';
        }

        const soldOutMsg = modal.querySelector('#wishlist-quick-view-soldout-message');
        if (matchedVariant.node.availableForSale === false) {
            soldOutMsg.style.display = '';
        } else {
            soldOutMsg.style.display = 'none';
        }

        const priceEl = modal.querySelector('#wishlist-quick-view-price');
        const comparePriceEl = modal.querySelector('#wishlist-quick-view-compare-price');
        const badgeEl = modal.querySelector('#wishlist-quick-view-discount-badge');
        const separator = modal.querySelector('.wishlist-vertical-separator');
        priceEl.textContent = window.CurrencyUtils.formatMoneyCurrency(String(price), window.money_format);
        if (
            compareAtPrice &&
            compareAtPrice !== price
        ) {
            comparePriceEl.textContent = window.CurrencyUtils.formatMoneyCurrency(
                String(compareAtPrice),
                window.money_format
            );
            comparePriceEl.style.display = '';
            if (separator) separator.style.display = '';
            // Show discount badge
            const percentOff = getDiscountPercent(
                parseFloat(price),
                parseFloat(compareAtPrice)
            );
            if (percentOff && percentOff > 0) {
                badgeEl.textContent = `${percentOff}% OFF`;
                badgeEl.className = 'wishlist-discount-inline';
                badgeEl.style.display = '';
            } else {
                badgeEl.style.display = 'none';
            }
        } else {
            comparePriceEl.textContent = '';
            comparePriceEl.style.display = 'none';
            badgeEl.style.display = 'none';
            if (separator) separator.style.display = 'none';
        }

        // Disable/enable Add to Cart button based on availability
        if (matchedVariant.node.availableForSale === false) {
            addToCartBtn.disabled = true;
            if (atcTextSpan) atcTextSpan.textContent = 'Sold Out';
            addToCartBtn.style.opacity = '0.5';
            addToCartBtn.style.pointerEvents = 'none';
        } else {
            addToCartBtn.disabled = false;
            if (atcTextSpan) atcTextSpan.textContent = buttonLabel;
            addToCartBtn.style.opacity = '';
            addToCartBtn.style.pointerEvents = '';
        }

        // Update product title to reflect selected variant
        const productTitleEl = modal.querySelector('.wishlist-quick-view-product-title');
        if (productTitleEl && matchedVariant) {
            let baseTitle = product.title;
            // If the product title ends with the first variant's title, remove it
            const firstVariantTitle = product.variants.edges[0]?.node?.title;
            const formattedVariantTitle = formatVariantTitle(matchedVariant.node.title);
            if (
                firstVariantTitle &&
                firstVariantTitle !== 'Default Title' &&
                baseTitle.endsWith(' - ' + firstVariantTitle)
            ) {
                baseTitle = baseTitle.slice(0, -(' - ' + firstVariantTitle).length);
            }
            if (formattedVariantTitle && formattedVariantTitle !== 'Default Title') {
                productTitleEl.textContent = baseTitle + ' - ' + formattedVariantTitle;
            } else {
                productTitleEl.textContent = baseTitle;
            }
        }
    }

    updatePriceByVariant();
}

function formatVariantTitle(title) {
    return title && title.includes(' / ') ? title.replace(/ \/ /g, ' - ') : title;
}

function renderStars(rating = 0) {
    let starsHtml = '';
    const roundedRating = Math.round(rating * 2) / 2;
    for (let i = 1; i <= 5; i++) {
        if (i <= roundedRating) {
            starsHtml += '<span class="wishlist-qv-star wishlist-qv-star--on">★</span>';
        } else if (i - 0.5 === roundedRating) {
            starsHtml +=
                '<span class="wishlist-qv-star wishlist-qv-star--half"><span class="wishlist-qv-star__half--on">★</span><span class="wishlist-qv-star__half--off">★</span></span>';
        } else {
            starsHtml += '<span class="wishlist-qv-star wishlist-qv-star--off">★</span>';
        }
    }
    return starsHtml;
}