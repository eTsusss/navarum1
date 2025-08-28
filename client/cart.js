// ===== ФУНКЦИИ КОРЗИНЫ - ЗАКОММЕНТИРОВАНО =====

// Инициализация корзины
// function setupCart() {
//     const cartBtn = document.getElementById('cart-btn');
//     const cartModal = document.getElementById('cart-modal');
//     const checkoutModal = document.getElementById('checkout-modal');
//     const addToCartBtn = document.getElementById('add-to-cart-btn');
//     
//     // Обработчики событий
//     cartBtn.addEventListener('click', () => showModal(cartModal));
//     addToCartBtn.addEventListener('click', addToCart);
//     
//     // Обработчики для корзины
//     document.getElementById('clear-cart-btn').addEventListener('click', clearCart);
//     document.getElementById('checkout-btn').addEventListener('click', showCheckout);
//     
//     // Обработчик формы оформления заказа
//     document.getElementById('checkout-form').addEventListener('submit', handleCheckout);
//     
//     // Закрытие модальных окон корзины
//     document.querySelectorAll('#cart-modal .close-modal, #checkout-modal .close-modal').forEach(closeBtn => {
//         closeBtn.addEventListener('click', function() {
//             const modal = this.closest('.modal');
//             hideModal(modal);
//         });
//     });
//     
//     // Закрытие по клику вне модального окна
//     [cartModal, checkoutModal].forEach(modal => {
//         modal.addEventListener('click', function(e) {
//             if (e.target === this) {
//                 hideModal(this);
//             }
//         });
//     });
//     
//     // Загружаем корзину при инициализации
//     loadCart();
// }

// Загрузка корзины
// async function loadCart() {
//     if (currentUser) {
//         // Для авторизованных пользователей загружаем с сервера
//         await loadServerCart();
//     } else {
//         // Для неавторизованных пользователей загружаем из localStorage
//         loadLocalCart();
//     }
//     updateCartUI();
// }

// Загрузка корзины с сервера
// async function loadServerCart() {
//     try {
//         const response = await fetch(`${API_BASE_URL}/cart`, {
//             headers: {
//                 'Authorization': `Bearer ${authToken}`
//             }
//         });
//         
//         if (response.ok) {
//             const data = await response.json();
//             cartItems = data.items;
//             updateCartCount(data.item_count);
//         }
//     } catch (error) {
//         console.error('Ошибка загрузки корзины:', error);
//     }
// }

// Загрузка локальной корзины
// function loadLocalCart() {
//     const savedCart = localStorage.getItem('localCart');
//     if (savedCart) {
//         cartItems = JSON.parse(savedCart);
//     } else {
//         cartItems = [];
//     }
//     updateCartCount(cartItems.length);
// }

// Добавление в корзину
// async function addToCart() {
//     if (!currentProduct) return;
//     
//     if (currentUser) {
//         // Для авторизованных пользователей
//         await addToServerCart(currentProduct.id);
//     } else {
//         // Для неавторизованных пользователей
//         addToLocalCart(currentProduct);
//     }
// }

// Добавление в серверную корзину
// async function addToServerCart(productId) {
//     try {
//         const response = await fetch(`${API_BASE_URL}/cart/add`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${authToken}`
//             },
//             body: JSON.stringify({ product_id: productId, quantity: 1 })
//         });
//         
//         if (response.ok) {
//             showNotification('Товар добавлен в корзину!', 'success');
//             await loadCart();
//         } else {
//             const data = await response.json();
//             showNotification(data.error || 'Ошибка добавления в корзину', 'error');
//         }
//     } catch (error) {
//         console.error('Ошибка добавления в корзину:', error);
//         showNotification('Ошибка соединения', 'error');
//     }
// }

// Добавление в локальную корзину
// function addToLocalCart(product) {
//     const existingItem = cartItems.find(item => item.product_id === product.id);
//     
//     if (existingItem) {
//         existingItem.quantity += 1;
//         existingItem.total = existingItem.quantity * existingItem.price;
//     } else {
//         cartItems.push({
//             cart_item_id: Date.now(), // Временный ID
//             product_id: product.id,
//             name: product.name,
//             price: product.price,
//             image_url: product.image_url,
//             category: product.category,
//             quantity: 1,
//             total: product.price
//         });
//     }
//     
//     // Сохраняем в localStorage
//     localStorage.setItem('localCart', JSON.stringify(cartItems));
//     
//     showNotification('Товар добавлен в корзину!', 'success');
//     updateCartUI();
// }

// Обновление количества товара
// async function updateCartItemQuantity(cartItemId, newQuantity) {
//     if (newQuantity <= 0) {
//         await removeFromCart(cartItemId);
//         return;
//     }
//     
//     if (currentUser) {
//         // Для авторизованных пользователей
//         await updateServerCartItem(cartItemId, newQuantity);
//     } else {
//         // Для неавторизованных пользователей
//         updateLocalCartItem(cartItemId, newQuantity);
//     }
// }

// Обновление количества в серверной корзине
// async function updateServerCartItem(cartItemId, quantity) {
//     try {
//         const response = await fetch(`${API_BASE_URL}/cart/update`, {
//             method: 'PUT',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${authToken}`
//             },
//             body: JSON.stringify({ cart_item_id: cartItemId, quantity: quantity })
//         });
//         
//         if (response.ok) {
//             await loadCart();
//         } else {
//             const data = await response.json();
//             showNotification(data.error || 'Ошибка обновления корзины', 'error');
//         }
//     } catch (error) {
//         console.error('Ошибка обновления корзины:', error);
//         showNotification('Ошибка соединения', 'error');
//     }
// }

// Обновление количества в локальной корзине
// function updateLocalCartItem(cartItemId, quantity) {
//     const item = cartItems.find(item => item.cart_item_id === cartItemId);
//     if (item) {
//         item.quantity = quantity;
//         item.total = item.quantity * item.price;
//         localStorage.setItem('localCart', JSON.stringify(cartItems));
//         updateCartUI();
//     }
// }

// Удаление из корзины
// async function removeFromCart(cartItemId) {
//     if (currentUser) {
//         // Для авторизованных пользователей
//         await removeFromServerCart(cartItemId);
//     } else {
//         // Для неавторизованных пользователей
//         removeFromLocalCart(cartItemId);
//     }
// }

// Удаление из серверной корзины
// async function removeFromServerCart(cartItemId) {
//     try {
//         const response = await fetch(`${API_BASE_URL}/cart/remove`, {
//             method: 'DELETE',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${authToken}`
//             },
//             body: JSON.stringify({ cart_item_id: cartItemId })
//         });
//         
//         if (response.ok) {
//             showNotification('Товар удален из корзины!', 'success');
//             await loadCart();
//         } else {
//             const data = await response.json();
//             showNotification(data.error || 'Ошибка удаления из корзины', 'error');
//         }
//     } catch (error) {
//         console.error('Ошибка удаления из корзины:', error);
//         showNotification('Ошибка соединения', 'error');
//     }
// }

// Удаление из локальной корзины
// function removeFromLocalCart(cartItemId) {
//     cartItems = cartItems.filter(item => item.cart_item_id !== cartItemId);
//     localStorage.setItem('localCart', JSON.stringify(cartItems));
//     showNotification('Товар удален из корзины!', 'success');
//     updateCartUI();
// }

// Очистка корзины
// async function clearCart() {
//     if (!confirm('Вы уверены, что хотите очистить корзину?')) {
//         return;
//     }
//     
//     if (currentUser) {
//         // Для авторизованных пользователей
//         await clearServerCart();
//     } else {
//         // Для неавторизованных пользователей
//         clearLocalCart();
//     }
// }

// Очистка серверной корзины
// async function clearServerCart() {
//     try {
//         const response = await fetch(`${API_BASE_URL}/cart/clear`, {
//             method: 'DELETE',
//             headers: {
//                 'Authorization': `Bearer ${authToken}`
//             }
//         });
//         
//         if (response.ok) {
//             showNotification('Корзина очищена!', 'success');
//             await loadCart();
//         } else {
//             const data = await response.json();
//             showNotification(data.error || 'Ошибка очистки корзины', 'error');
//         }
//     } catch (error) {
//         console.error('Ошибка очистки корзины:', error);
//         showNotification('Ошибка соединения', 'error');
//     }
// }

// Очистка локальной корзины
// function clearLocalCart() {
//     cartItems = [];
//     localStorage.removeItem('localCart');
//     showNotification('Корзина очищена!', 'success');
//     updateCartUI();
// }

// Обновление UI корзины
// function updateCartUI() {
//     const cartItemsContainer = document.getElementById('cart-items');
//     const cartTotalAmount = document.getElementById('cart-total-amount');
//     
//     if (cartItems.length === 0) {
//         cartItemsContainer.innerHTML = '<p style="text-align: center; color: #666;">Корзина пуста</p>';
//         cartTotalAmount.textContent = '0 ₽';
//         return;
//     }
//     
//     let totalAmount = 0;
//     let cartHTML = '';
//     
//     cartItems.forEach(item => {
//         totalAmount += item.total;
//         
//         cartHTML += `
//             <div class="cart-item">
//                 <img src="${item.image_url}" alt="${item.name}" class="cart-item-image">
//                 <div class="cart-item-info">
//                     <div class="cart-item-name">${item.name}</div>
//                     <div class="cart-item-price">${formatPrice(item.price)} ₽</div>
//                     <div class="cart-item-quantity">
//                         <button class="quantity-btn" onclick="updateCartItemQuantity(${item.cart_item_id}, ${item.quantity - 1})">-</button>
//                         <input type="number" class="quantity-input" value="${item.quantity}" min="1" 
//                                onchange="updateCartItemQuantity(${item.cart_item_id}, parseInt(this.value))">
//                         <button class="quantity-btn" onclick="updateCartItemQuantity(${item.cart_item_id}, ${item.quantity + 1})">+</button>
//                     </div>
//                 </div>
//                 <button class="cart-item-remove" onclick="removeFromCart(${item.cart_item_id})">
//                     <i class="fas fa-trash"></i>
//                 </button>
//             </div>
//         `;
//     });
//     
//     cartItemsContainer.innerHTML = cartHTML;
//     cartTotalAmount.textContent = `${formatPrice(totalAmount)} ₽`;
// }

// Обновление счетчика корзины
// function updateCartCount(count) {
//     const cartCount = document.getElementById('cart-count');
//     cartCount.textContent = count;
//     cartCount.style.display = count > 0 ? 'flex' : 'none';
// }

// Показать оформление заказа
// function showCheckout() {
//     if (!currentUser) {
//         showNotification('Для оформления заказа необходимо войти в систему', 'warning');
//         return;
//     }
//     
//     if (cartItems.length === 0) {
//         showNotification('Корзина пуста', 'warning');
//         return;
//     }
//     
//     // Заполняем сводку заказа
//     const orderItemsSummary = document.getElementById('order-items-summary');
//     const orderTotalAmount = document.getElementById('order-total-amount');
//     
//     let totalAmount = 0;
//     let summaryHTML = '';
//     
//     cartItems.forEach(item => {
//         totalAmount += item.total;
//         summaryHTML += `
//             <div class="order-item-summary">
//                 <span>${item.name} x${item.quantity}</span>
//                 <span>${formatPrice(item.total)} ₽</span>
//             </div>
//         `;
//     });
//     
//     orderItemsSummary.innerHTML = summaryHTML;
//             orderTotalAmount.textContent = `${formatPrice(totalAmount)} ₽`;
//     
//     // Показываем модальное окно
//     hideModal(document.getElementById('cart-modal'));
//     showModal(document.getElementById('checkout-modal'));
// }

// Обработка оформления заказа
// async function handleCheckout(e) {
//     e.preventDefault();
//     
//     const formData = new FormData(e.target);
//     const paymentMethod = formData.get('payment_method');
//     
//     // Показываем индикатор загрузки
//     const submitBtn = e.target.querySelector('button[type="submit"]');
//     const originalText = submitBtn.textContent;
//     submitBtn.textContent = 'Обработка платежа...';
//     submitBtn.disabled = true;
//     
//     try {
//         const response = await fetch(`${API_BASE_URL}/orders`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${authToken}`
//             },
//             body: JSON.stringify({ payment_method: paymentMethod })
//         });
//         
//         const data = await response.json();
//         
//         if (response.ok) {
//             // Успешная оплата
//             showNotification(data.message || 'Заказ успешно оформлен и оплачен!', 'success');
//             
//             // Закрываем модальное окно
//             hideModal(document.getElementById('checkout-modal'));
//             
//             // Очищаем корзину
//             await loadCart();
//             
//             // Показываем детали заказа
//             setTimeout(() => {
//                 showOrderDetails(data);
//             }, 1000);
//         } else {
//             // Ошибка оплаты
//             showNotification(data.error || 'Ошибка оформления заказа', 'error');
//             
//             // Если это ошибка оплаты, не закрываем модальное окно
//             if (data.payment_status === 'failed') {
//                 showNotification('Попробуйте другой способ оплаты или обратитесь в службу поддержки', 'warning');
//             }
//         }
//     } catch (error) {
//         console.error('Ошибка оформления заказа:', error);
//         showNotification('Ошибка соединения. Проверьте интернет-соединение.', 'error');
//     } finally {
//         // Восстанавливаем кнопку
//         submitBtn.textContent = originalText;
//         submitBtn.disabled = false;
//     }
// }

// Показать детали заказа
// function showOrderDetails(orderData) {
//     const modal = document.createElement('div');
//     modal.className = 'modal active';
//     modal.innerHTML = `
//         <div class="modal-content auth-modal">
//             <span class="close-modal" onclick="this.closest('.modal').remove()">&times;</span>
//             <h2>Заказ оформлен!</h2>
//             <div style="text-align: center; padding: 20px;">
//                 <i class="fas fa-check-circle" style="font-size: 4rem; color: #28a745; margin-bottom: 20px;"></i>
//                 <h3>Спасибо за заказ!</h3>
//                 <p><strong>Номер заказа:</strong> #${orderData.order_id}</p>
//                 <p><strong>Сумма:</strong> ${formatPrice(orderData.total_amount)} ₽</strong> ₽</p>
//                 <p><strong>Способ оплаты:</strong> ${getPaymentMethodName(orderData.payment_method)}</p>
//                 <p><strong>Статус:</strong> <span style="color: #28a745;">Оплачен</span></p>
//                 <p style="margin-top: 20px; font-size: 0.9rem; color: #666;">
//                     Мы отправим вам уведомление о статусе доставки на email.
//                 </p>
//             </div>
//             <button onclick="this.closest('.modal').remove()" class="auth-submit-btn" style="width: 100%;">
//                 Закрыть
//             </button>
//         </div>
//     `;
//     
//     document.body.appendChild(modal);
//     
//     // Закрытие по клику вне модального окна
//     modal.addEventListener('click', function(e) {
//         if (e.target === this) {
//             this.remove();
//         }
//     });
// }

// Получить название способа оплаты
// function getPaymentMethodName(method) {
//     const methods = {
//         'card': 'Банковская карта',
//         'cash': 'Наличными при получении',
//         'online': 'Онлайн-платеж'
//     };
//     return methods[method] || method;
// } 