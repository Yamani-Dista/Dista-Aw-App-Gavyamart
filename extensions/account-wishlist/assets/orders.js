window.showOrderDeletePop = function (orderId) {
    const popup = document.getElementById('deleteorderpopupModal-' + orderId);
    if (popup) popup.style.display = 'flex';
  };

  window.closeOrderDeletePop = function (orderId) {
    const popup = document.getElementById('deleteorderpopupModal-' + orderId);
    if (popup) popup.style.display = 'none';
  };

  async function cancelOrder(button,storeUrl) {
    const orderId = button.getAttribute('data-order-id');
    try {
        const { cancelOrderBehavior, script } = window.accountSettings;
        
        if (cancelOrderBehavior === "script" && script) {
            try {
                closeOrderDeletePop(orderId);
                eval(script); 
            } catch (e) {
                console.error("Error running stored script:", e);
                // alert('Order cancellation script failed to execute properly.');
                Toastify({
                      text: "Failed to cancel order. Please try again later.",
                      duration: 3000,
                      gravity: "top", 
                      position: "right",
                      backgroundColor: "rgba(132, 143, 252,1)",
                      close: true, 
                  }).showToast();
            }
        } 
        else {
            try {
                const cancelResponse = await fetch('/apps/apw/app/apiordercancel', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ orderId , storeUrl }),
                });
                
                const cancelData = await cancelResponse.json();
                
                if (cancelData.success) {
                    closeOrderDeletePop(orderId);
                    const cancelButton = document.querySelector(`button[data-order-id="${orderId}"]`);
                    if (cancelButton) {
                        cancelButton.disabled = true;
                        cancelButton.innerText = 'Order Cancelled';
                    }
                    const orderDetails = document.querySelector(`.itemStatus[data-order-id="${orderId}"]`);
                    if (orderDetails) {   
                        orderDetails.innerText = 'Cancelled';
                        orderDetails.style.color = '#FDC028';
                    }
                    
                } else {
                    // alert('Failed to cancel order. Please try again later.');
                    Toastify({
                        text: "Failed to cancel order. Please try again later.",
                        duration: 3000,
                        gravity: "top", 
                        position: "right",
                        backgroundColor: "rgba(132, 143, 252,1)",
                        close: true, // Adds a close button
                    }).showToast();
                }
            } catch (err) {
                console.error(err);
                // alert('An error occurred during order cancellation.');
                Toastify({
                    text: "An error occurred during order cancellation.",
                    duration: 3000,
                    gravity: "top", 
                    position: "right",
                    backgroundColor: "rgba(132, 143, 252,1)",
                    close: true, // Adds a close button
                }).showToast();
            }
        }
    } catch (error) {
        console.error('Error in cancellation process:', error);
        // alert('An error occurred while processing your request.');
        Toastify({
            text: "An error occurred while processing your request.",
            duration: 3000,
            gravity: "top", 
            position: "right",
            backgroundColor: "rgba(132, 143, 252,1)",
            close: true, // Adds a close button
        }).showToast();
    }
  }

  async function handleSingleProduct(button)
  {
    const variantId = button.dataset.variantId;
    try{
      fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: variantId, quantity: 1 }),
        }).then(() => {
          window.location.href = '/checkout';
      });
    }catch(err)
    {
      // console.error("Error in handleBuyAgain:", err);
      // alert("Couldn't prepare your order. Please try again.");
      Toastify({
          text: "Couldn't prepare your order. Please try again.",
          duration: 3000,
          gravity: "top", 
          position: "right",
          backgroundColor: "rgba(132, 143, 252,1)",
          close: true, // Adds a close button
      }).showToast();
    }
  }

  async function handleBuyAgain(button) {
    const originalText = button.textContent;
      try {
        const orderDetails = button.closest('.order-details');
        if (!orderDetails) throw new Error("Order details not found");
        const productItems = orderDetails.querySelectorAll('.ordered-product');
        if (productItems.length === 0) throw new Error("No products found");
        for (const item of productItems) {
          const variantId = item.querySelector('.view-product')?.dataset.variantId;
          if (!variantId) continue;
          const quantityText = item.querySelector('.item-price span:last-child')?.textContent;
          const quantity = quantityText ? parseInt(quantityText) : 1;
          const response = await fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: variantId, quantity: quantity })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to add variant ${variantId}`);
          }
        }
        window.location.href = '/checkout';
      } catch (error) {
        // console.error("Error in handleBuyAgain:", error);
        // alert("Couldn't prepare your order. Please try again.");
        Toastify({
          text: "Couldn't prepare your order. Please try again.",
          duration: 3000,
          gravity: "top", 
          position: "right",
          backgroundColor: "rgba(132, 143, 252,1)",
          close: true, // Adds a close button
        }).showToast();
        button.disabled = false;
        button.textContent = originalText;
      }
  } 

  function view_product(buttonUrl) {
    const url = buttonUrl.getAttribute('data-url');
    if (url) {
      window.location.href = url;
    }
  }

  function showProducts(index) {
    if (document.querySelectorAll('.order-details-layout')) {
      const orderDetails = document.querySelectorAll('.order-details');
      orderDetails.forEach((detail) => detail.classList.add('hidden'));
      renderPage();
    }
  }
  function showLogs(index) {
    if (document.querySelectorAll('.order-page-item')) {
      const items = document.querySelectorAll('.order-page-item');
      items.forEach((item) => (item.style.display = 'none'));
      const pagination = document.querySelector('.pagination');
      pagination.style.display = 'none';
      document.querySelector(`.order-details[data-order-index="${index}"]`).classList.remove('hidden');
    }
  }

  let currentPage = 1;
  const itemsPerPage = 2;
  const items = document.querySelectorAll('.order-page-item');
  const totalPages = Math.ceil(items.length / itemsPerPage);

  function renderPage() {
    const items = document.querySelectorAll('.order-page-item');
    const orderDetails = document.querySelectorAll('.order-details');
    const pagination = document.querySelector('.pagination');
    const pageNumbersContainer = document.getElementById('pageNumbers');
    const start = (currentPage - 1) * itemsPerPage;
    const end = currentPage * itemsPerPage;

    items.forEach((item, index) => {
      item.style.display = index >= start && index < end ? 'block' : 'none';
    });

    orderDetails.forEach((detail) => detail.classList.add('hidden'));
    pagination.style.display = 'flex';
    pageNumbersContainer.innerHTML = '';
    const maxVisible = 3;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = startPage + maxVisible - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.textContent = i;
      pageBtn.classList.add('page-number');
      if (i === currentPage) pageBtn.classList.add('active');
      pageBtn.setAttribute('onclick', `goToPage(${i})`);
      pageNumbersContainer.appendChild(pageBtn);
    }

    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
  }

  function prevPage() {
    if (currentPage > 1) {
      currentPage--;
      renderPage();
    }
  }

  function nextPage() {
    const items = document.querySelectorAll('.order-page-item');
    const totalPages = Math.ceil(items.length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderPage();
    }
  }

  function goToPage(page) {
    currentPage = page;
    renderPage();
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderPage();
  });