// Личный кабинет - функциональность
let userProfile = null;

// Инициализация личного кабинета
function setupProfile() {
    const profileBtn = document.getElementById('profile-btn');
    const profileModal = document.getElementById('profile-modal');
    const profileForm = document.getElementById('profile-form');
    const passwordForm = document.getElementById('password-form');

    // Открытие модального окна личного кабинета
    profileBtn.addEventListener('click', () => {
        showModal(profileModal);
        loadUserProfile();
        // loadUserOrders(); // Отключено (зависит от корзины)
    });

    // Обработка формы профиля
    profileForm.addEventListener('submit', handleProfileUpdate);

    // Обработка формы смены пароля
    passwordForm.addEventListener('submit', handlePasswordUpdate);
}

// Загрузка профиля пользователя
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            userProfile = await response.json();
            fillProfileForm(userProfile);
        } else {
            showNotification('Ошибка загрузки профиля', 'error');
        }
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        showNotification('Ошибка загрузки профиля', 'error');
    }
}

// Заполнение формы профиля данными
function fillProfileForm(profile) {
    document.getElementById('profile-username').value = profile.username || '';
    document.getElementById('profile-email').value = profile.email || '';
    document.getElementById('profile-first-name').value = profile.first_name || '';
    document.getElementById('profile-last-name').value = profile.last_name || '';
    document.getElementById('profile-phone').value = profile.phone || '';
    document.getElementById('profile-address').value = profile.address || '';
    document.getElementById('profile-city').value = profile.city || '';
    document.getElementById('profile-postal-code').value = profile.postal_code || '';
}

// Обновление профиля
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const profileData = {
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        city: formData.get('city'),
        postal_code: formData.get('postal_code')
    };

    const submitBtn = e.target.querySelector('.save-btn');
    const originalText = submitBtn.innerHTML;
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';

        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(profileData)
        });

        if (response.ok) {
            showNotification('Профиль успешно обновлен', 'success');
            userProfile = { ...userProfile, ...profileData };
        } else {
            const error = await response.json();
            showNotification(error.error || 'Ошибка обновления профиля', 'error');
        }
    } catch (error) {
        console.error('Ошибка обновления профиля:', error);
        showNotification('Ошибка обновления профиля', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Смена пароля
async function handlePasswordUpdate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const currentPassword = formData.get('current_password');
    const newPassword = formData.get('new_password');
    const confirmPassword = formData.get('confirm_password');

    // Валидация
    if (newPassword !== confirmPassword) {
        showNotification('Пароли не совпадают', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showNotification('Новый пароль должен содержать минимум 6 символов', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('.save-btn');
    const originalText = submitBtn.innerHTML;
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Смена пароля...';

        const response = await fetch(`${API_BASE_URL}/profile/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });

        if (response.ok) {
            showNotification('Пароль успешно изменен', 'success');
            e.target.reset();
        } else {
            const error = await response.json();
            showNotification(error.error || 'Ошибка смены пароля', 'error');
        }
    } catch (error) {
        console.error('Ошибка смены пароля:', error);
        showNotification('Ошибка смены пароля', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Загрузка заказов пользователя - отключено (зависит от корзины)
// async function loadUserOrders() {
//     try {
//         const response = await fetch(`${API_BASE_URL}/orders`, {
//             headers: {
//                 'Authorization': `Bearer ${authToken}`
//             }
//         });
// 
//         if (response.ok) {
//             const orders = await response.json();
//             displayOrders(orders);
//         } else {
//             showNotification('Ошибка загрузки заказов', 'error');
//         }
//     } catch (error) {
//         console.error('Ошибка загрузки заказов:', error);
//         showNotification('Ошибка загрузки заказов', 'error');
//     }
// }

// Отображение заказов - отключено (зависит от корзины)
// function displayOrders(orders) {
//     const ordersList = document.getElementById('orders-list');
//     const noOrders = document.getElementById('no-orders');
// 
//     if (orders.length === 0) {
//         ordersList.style.display = 'none';
//         noOrders.style.display = 'block';
//         return;
//     }
// 
//     ordersList.style.display = 'block';
//     noOrders.style.display = 'none';
// 
//     ordersList.innerHTML = orders.map(order => `
//         <div class="order-item">
//             <div class="order-header">
//                 <div>
//                     <div class="order-number">Заказ #${order.id}</div>
//                     <div class="order-date">${formatDate(order.created_at)}</div>
//                 </div>
//                 <span class="order-status ${order.status}">${getStatusText(order.status)}</span>
//             </div>
//             <div class="order-details">
//                 <div class="order-detail">
//                     <div class="order-detail-label">Способ оплаты</div>
//                     <div class="order-detail-value">${getPaymentMethodText(order.payment_method)}</div>
//                 </div>
//                 <div class="order-detail">
//                     <div class="order-detail-label">Статус</div>
//                      <div class="order-detail-value">${getStatusText(order.status)}</div>
//                 </div>
//             </div>
//             <div class="order-total">
//                 Сумма: ${formatPrice(order.total_amount)}
//             </div>
//         </div>
//     `).join('');
// }

// Форматирование даты
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Форматирование цены
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0
    }).format(price);
}

// Получение текста статуса
function getStatusText(status) {
    const statusMap = {
        'paid': 'Оплачен',
        'payment_failed': 'Ошибка оплаты',
        'pending': 'В обработке'
    };
    return statusMap[status] || status;
}

// Получение текста способа оплаты
function getPaymentMethodText(method) {
    const methodMap = {
        'card': 'Банковская карта',
        'cash': 'Наличными',
        'online': 'Онлайн-платеж'
    };
    return methodMap[method] || method;
}

// Показ уведомления
function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    // Добавляем стили
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;

    // Добавляем в DOM
    document.body.appendChild(notification);

    // Удаляем через 5 секунд
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Добавляем CSS анимации для уведомлений
const profileStyle = document.createElement('style');
profileStyle.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-content i {
        font-size: 18px;
    }
`;
document.head.appendChild(profileStyle);

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    setupProfile();
}); 