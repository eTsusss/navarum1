// Конфигурация API
const API_BASE_URL = `${window.config.fullApiUrl}/api`;

// Глобальные переменные
let allProducts = [];
let currentCategory = 'all';
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let cartItems = []; // Корзина для неавторизованных пользователей
let currentProduct = null; // Текущий товар в модальном окне

// Preloader
window.addEventListener('load', function() {
    const preloader = document.querySelector('.preloader');
    preloader.style.opacity = '0';
    setTimeout(() => {
        preloader.style.display = 'none';
    }, 500);
});

// Mobile Menu
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', function() {
    this.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        if (this.classList.contains('cta-button')) {
            setTimeout(() => {
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            }, 300);
        } else {
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        }
        
        // Close mobile menu if open
        if (navLinks.classList.contains('active')) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
});

// Загрузка товаров при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    setupCategoryFilters();
    setupModal();
    setupAuth();
    // setupCart(); // Корзина отключена
    checkAuthStatus();
});

// Функции авторизации
function setupAuth() {
    // Кнопки авторизации
    const loginBtn = document.getElementById('login-btn');
    // const registerBtn = document.getElementById('register-btn'); // Кнопка регистрации скрыта
    const logoutBtn = document.getElementById('logout-btn');
    
    // Модальные окна
    const loginModal = document.getElementById('login-modal');
    // const registerModal = document.getElementById('register-modal'); // Модальное окно регистрации скрыто
    
    // Формы
    const loginForm = document.getElementById('login-form');
    // const registerForm = document.getElementById('register-form'); // Форма регистрации скрыта
    
    // Переключение между модальными окнами - убрано, так как регистрация недоступна
    // const switchToRegister = document.getElementById('switch-to-register');
    // const switchToLogin = document.getElementById('switch-to-login');
    
    // Обработчики событий
    loginBtn.addEventListener('click', () => showModal(loginModal));
    // registerBtn.addEventListener('click', () => showModal(registerModal)); // Обработчик регистрации убран
    logoutBtn.addEventListener('click', logout);
    
    loginForm.addEventListener('submit', handleLogin);
    // registerForm.addEventListener('submit', handleRegister); // Обработчик формы регистрации убран
    
    // Переключение между модальными окнами убрано
    // switchToRegister.addEventListener('click', (e) => {
    //     e.preventDefault();
    //     hideModal(loginModal);
    //     showModal(registerModal);
    // });
    
    // switchToLogin.addEventListener('click', (e) => {
    //     e.preventDefault();
    //     hideModal(registerModal);
    //     showModal(loginModal);
    // });
    
    // Закрытие модальных окон
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            hideModal(modal);
        });
    });
    
    // Закрытие по клику вне модального окна
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                hideModal(this);
            }
        });
    });
}

async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Сохраняем токен и информацию о пользователе
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userInfo', JSON.stringify(data.user));
            
            authToken = data.token;
            currentUser = data.user;
            
            // Обновляем интерфейс
            updateAuthUI();
            
            // Закрываем модальное окно
            hideModal(document.getElementById('login-modal'));
            
            // Очищаем форму
            e.target.reset();
            
            showNotification('Успешный вход!', 'success');
        } else {
            showNotification(data.error || 'Ошибка входа', 'error');
        }
    } catch (error) {
        console.error('Ошибка входа:', error);
        showNotification('Ошибка соединения', 'error');
    }
}

function logout() {
    // Удаляем токен и информацию о пользователе
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    
    authToken = null;
    currentUser = null;
    
    // Обновляем интерфейс
    updateAuthUI();
    
    showNotification('Вы вышли из системы', 'info');
}

function checkAuthStatus() {
    if (authToken) {
        // Проверяем валидность токена
        fetch(`${API_BASE_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Неверный токен');
            }
        })
        .then(userData => {
            currentUser = userData;
            updateAuthUI();
        })
        .catch(error => {
            console.error('Ошибка проверки токена:', error);
            logout();
        });
    }
}

function updateAuthUI() {
    const authButtons = document.querySelector('.auth-buttons');
    const userInfo = document.getElementById('user-info');
    const usernameDisplay = document.getElementById('username-display');
    
    if (currentUser) {
        // Пользователь авторизован
        authButtons.style.display = 'none';
        userInfo.style.display = 'flex';
        usernameDisplay.textContent = currentUser.username;
        
        // Если пользователь администратор, добавляем кнопку управления
        if (currentUser.role === 'admin') {
            addAdminControls();
        }
        
        // Загружаем корзину с сервера - отключено
        // loadCart();
        
        // Отправляем событие успешной авторизации
        window.dispatchEvent(new CustomEvent('auth-success', { detail: currentUser }));
    } else {
        // Пользователь не авторизован
        authButtons.style.display = 'flex';
        userInfo.style.display = 'none';
        
        // Убираем кнопки администратора
        removeAdminControls();
        
        // Загружаем локальную корзину - отключено
        // loadCart();
    }
}

function addAdminControls() {
    // Проверяем, не добавлены ли уже кнопки
    if (document.getElementById('admin-controls')) {
        return;
    }
    
    const gallerySection = document.querySelector('.gallery-section .container');
    const adminControls = document.createElement('div');
    adminControls.id = 'admin-controls';
    adminControls.className = 'admin-controls';
    adminControls.innerHTML = `
        <div class="admin-buttons">
            <button id="add-product-btn" class="admin-btn">
                <i class="fas fa-plus"></i> Добавить товар
            </button>
            <button id="edit-products-btn" class="admin-btn">
                <i class="fas fa-edit"></i> Управление товарами
            </button>
        </div>
    `;
    
    // Вставляем после заголовка
    const title = gallerySection.querySelector('.section-title');
    title.parentNode.insertBefore(adminControls, title.nextSibling);
    
    // Добавляем обработчики событий
    document.getElementById('add-product-btn').addEventListener('click', showAddProductForm);
    document.getElementById('edit-products-btn').addEventListener('click', showEditProducts);
}

function removeAdminControls() {
    const adminControls = document.getElementById('admin-controls');
    if (adminControls) {
        adminControls.remove();
    }
}

function showModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function showNotification(message, type = 'info') {
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Показываем уведомление
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Скрываем через 3 секунды
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Функция загрузки товаров
async function loadProducts() {
    const loading = document.getElementById('loading');
    const productsContainer = document.getElementById('products-container');
    
    try {
        loading.style.display = 'flex';
        productsContainer.style.display = 'none';
        
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) {
            throw new Error('Ошибка загрузки товаров');
        }
        
        allProducts = await response.json();
        displayProducts(allProducts);
        
    } catch (error) {
        console.error('Ошибка:', error);
        productsContainer.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #666;">
                <h3>Ошибка загрузки товаров</h3>
                <p>Пожалуйста, убедитесь, что сервер запущен</p>
            </div>
        `;
    } finally {
        loading.style.display = 'none';
        productsContainer.style.display = 'grid';
    }
}

// Функция отображения товаров
function displayProducts(products) {
    const productsContainer = document.getElementById('products-container');
    
    if (products.length === 0) {
        productsContainer.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #666;">
                <h3>Товары не найдены</h3>
                <p>Попробуйте выбрать другую категорию</p>
            </div>
        `;
        return;
    }
    
    productsContainer.innerHTML = products.map(product => {
        // Определяем источник изображения (используем первое изображение для карточки)
        let imageSrc = '';
        if (product.images && product.images.length > 0) {
            const firstImage = product.images[0];
            if (firstImage.data) {
                imageSrc = `data:image/jpeg;base64,${firstImage.data}`;
            } else if (firstImage.url) {
                imageSrc = firstImage.url;
            }
        }
        
        // Если нет изображений, используем заглушку
        if (!imageSrc) {
            imageSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1lcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
        }
        
        // Показываем индикатор множественных изображений
        const imageCount = product.images ? product.images.length : 0;
        const imageIndicator = imageCount > 1 ? `<div class="image-count">+${imageCount - 1}</div>` : '';
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${imageSrc}" alt="${product.name}" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1lcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RXJyb3I8L3RleHQ+PC9zdmc+';">
                    ${imageIndicator}
                    <div class="overlay">
                        <button class="view-button">Подробнее</button>
                    </div>
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="price">${formatPrice(product.price)} ₽</div>
                    <p>${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}</p>
                </div>
            </div>
        `;
    }).join('');
    
    // Добавляем обработчики для карточек товаров
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', function() {
            const productId = this.dataset.productId;
            const product = allProducts.find(p => p.id == productId);
            if (product) {
                showProductModal(product);
            }
        });
    });
}

// Функция форматирования цены
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price);
}

// Настройка фильтров по категориям
function setupCategoryFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Убираем активный класс у всех кнопок
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Добавляем активный класс к нажатой кнопке
            this.classList.add('active');
            
            const category = this.dataset.category;
            currentCategory = category;
            
            if (category === 'all') {
                displayProducts(allProducts);
            } else {
                const filteredProducts = allProducts.filter(product => product.category === category);
                displayProducts(filteredProducts);
            }
        });
    });
}

// Настройка модального окна
function setupModal() {
    const modal = document.getElementById('product-modal');
    const closeModal = document.querySelector('.close-modal');
    
    // Закрытие модального окна
    closeModal.addEventListener('click', function() {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
    
    // Закрытие по клику вне модального окна
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
    
    // Закрытие по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
}

// Показать модальное окно с товаром
function showProductModal(product) {
    const modal = document.getElementById('product-modal');
    const modalImage = modal.querySelector('.modal-image');
    const modalTitle = modal.querySelector('.modal-title');
    const modalPrice = modal.querySelector('.modal-price');
    const modalDescription = modal.querySelector('.modal-description');
    const modalCategory = modal.querySelector('.modal-category');
    const modalSize = modal.querySelector('.modal-size');
    const modalMaterial = modal.querySelector('.modal-material');
    const modalDensity = modal.querySelector('.modal-density');
    
    // Сохраняем текущий товар для корзины
    currentProduct = product;
    
    // Получаем изображения товара
    const images = product.images || [];
    let currentImageIndex = 0;
    
    // Функция для обновления изображения
    function updateModalImage() {
        if (images.length > 0) {
            const currentImage = images[currentImageIndex];
            if (currentImage.data) {
                modalImage.src = `data:image/jpeg;base64,${currentImage.data}`;
            } else if (currentImage.url) {
                modalImage.src = currentImage.url;
            }
        } else {
            // Если нет изображений, используем заглушку
            modalImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1lcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
        }
    }
    
    // Обновляем изображение
    updateModalImage();
    
    // Добавляем навигацию по изображениям, если их больше одного
    if (images.length > 1) {
        // Создаем навигацию
        let navigationHTML = `
            <div class="image-navigation">
                <button class="nav-btn prev-btn" onclick="changeImage(-1)">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <div class="image-counter">${currentImageIndex + 1} / ${images.length}</div>
                <button class="nav-btn next-btn" onclick="changeImage(1)">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <div class="image-thumbnails">
        `;
        
        images.forEach((img, index) => {
            const thumbSrc = img.data ? `data:image/jpeg;base64,${img.data}` : img.url;
            navigationHTML += `
                <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="goToImage(${index})">
                    <img src="${thumbSrc}" alt="Фото ${index + 1}">
                </div>
            `;
        });
        
        navigationHTML += '</div>';
        
        // Вставляем навигацию после изображения
        const imageContainer = modal.querySelector('.modal-image-container');
        const existingNav = imageContainer.querySelector('.image-navigation');
        if (existingNav) {
            existingNav.remove();
        }
        imageContainer.insertAdjacentHTML('beforeend', navigationHTML);
        
        // Добавляем глобальные функции для навигации
        window.changeImage = function(direction) {
            currentImageIndex = (currentImageIndex + direction + images.length) % images.length;
            updateModalImage();
            updateNavigation();
        };
        
        window.goToImage = function(index) {
            currentImageIndex = index;
            updateModalImage();
            updateNavigation();
        };
        
        function updateNavigation() {
            const counter = modal.querySelector('.image-counter');
            const thumbnails = modal.querySelectorAll('.thumbnail');
            
            if (counter) counter.textContent = `${currentImageIndex + 1} / ${images.length}`;
            thumbnails.forEach((thumb, index) => {
                thumb.classList.toggle('active', index === currentImageIndex);
            });
        }
    }
    
    modalImage.alt = product.name;
    modalTitle.textContent = product.name;
    modalPrice.textContent = `${formatPrice(product.price)} ₽`;
    modalDescription.textContent = product.description;
    modalCategory.textContent = product.category;
    modalSize.textContent = product.size || 'Не указан';
    modalMaterial.textContent = product.material || 'Не указан';
    modalDensity.textContent = product.density || 'Не указана';
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Animation on Scroll
const animateOnScroll = function() {
    const elements = document.querySelectorAll('.feature-card, .product-card, .testimonial-card');
    
    elements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.3;
        
        if (elementPosition < screenPosition) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
};

// Set initial state for animated elements
window.addEventListener('DOMContentLoaded', function() {
    const elements = document.querySelectorAll('.feature-card, .product-card, .testimonial-card');
    elements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
});

window.addEventListener('scroll', animateOnScroll);

// Функции для администратора
function showAddProductForm() {
    // Создаем модальное окно для добавления товара
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content auth-modal">
            <span class="close-modal">&times;</span>
            <h2>Добавить новый товар</h2>
            <form id="add-product-form" class="auth-form">
                <div class="form-group">
                    <label for="product-name">Название товара:</label>
                    <input type="text" id="product-name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="product-description">Описание:</label>
                    <textarea id="product-description" name="description" required rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label for="product-price">Цена (₽):</label>
                    <input type="number" id="product-price" name="price" step="0.01" required>
                </div>
                <div class="form-group">
                    <label for="product-images">Изображения товара (до 5 фото):</label>
                    <input type="file" id="product-images" name="images" accept="image/*" multiple>
                    <small>Можно выбрать несколько файлов. Первое фото будет основным.</small>
                    <div id="image-preview" class="image-preview"></div>
                    
                    <div class="form-group">
                        <label for="product-image-urls">Или укажите URL изображений (через запятую):</label>
                        <textarea id="product-image-urls" name="image_urls" placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg" rows="2"></textarea>
                    </div>
                </div>
                <div class="form-group">
                    <label for="product-category">Категория:</label>
                    <select id="product-category" name="category" required>
                        <option value="">Выберите категорию</option>
                        <option value="Пальто">Пальто</option>
                        <option value="Футболки">Футболки</option>
                        <option value="Пижама">Пижама</option>
                        <option value="Свитера">Свитера</option>
                        <option value="Полотенца">Полотенца</option>
                        <option value="Постельное белье">Постельное белье</option>
                    </select>
                </div>
                
                <!-- Динамические поля для размеров одежды -->
                <div class="form-group" id="clothing-sizes" style="display: none;">
                    <label>Размеры одежды:</label>
                    <div class="size-options">
                        <label><input type="checkbox" name="sizes" value="XS"> XS</label>
                        <label><input type="checkbox" name="sizes" value="S"> S</label>
                        <label><input type="checkbox" name="sizes" value="M"> M</label>
                        <label><input type="checkbox" name="sizes" value="L"> L</label>
                        <label><input type="checkbox" name="sizes" value="XL"> XL</label>
                        <label><input type="checkbox" name="sizes" value="XXL"> XXL</label>
                        <label><input type="checkbox" name="sizes" value="XXXL"> XXXL</label>
                    </div>
                </div>
                
                <!-- Поле для размеров полотенец -->
                <div class="form-group" id="towel-sizes" style="display: none;">
                    <label for="product-size">Размер полотенца:</label>
                    <select id="product-size" name="size">
                        <option value="">Выберите размер</option>
                        <option value="50x90 см">50x90 см</option>
                        <option value="70x140 см">70x140 см</option>
                        <option value="80x150 см">80x150 см</option>
                        <option value="100x150 см">100x150 см</option>
                        <option value="120x180 см">120x180 см</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="product-material">Материал:</label>
                    <input type="text" id="product-material" name="material">
                </div>
                <div class="form-group">
                    <label for="product-density">Плотность:</label>
                    <input type="text" id="product-density" name="density">
                </div>
                <button type="submit" class="auth-submit-btn">Добавить товар</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Обработчики событий
    const closeBtn = modal.querySelector('.close-modal');
    const form = modal.querySelector('#add-product-form');
    
    closeBtn.addEventListener('click', () => {
        modal.remove();
        document.body.style.overflow = 'auto';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            document.body.style.overflow = 'auto';
        }
    });
    
    form.addEventListener('submit', handleAddProduct);
    
    // Обработчик изменения категории для показа соответствующих полей размеров
    const categorySelect = modal.querySelector('#product-category');
    const clothingSizes = modal.querySelector('#clothing-sizes');
    const towelSizes = modal.querySelector('#towel-sizes');
    
    categorySelect.addEventListener('change', function() {
        const selectedCategory = this.value;
        
        // Скрываем все поля размеров
        clothingSizes.style.display = 'none';
        towelSizes.style.display = 'none';
        
        // Показываем соответствующие поля в зависимости от категории
        if (['Пальто', 'Футболки', 'Пижама', 'Свитера'].includes(selectedCategory)) {
            clothingSizes.style.display = 'block';
        } else if (selectedCategory === 'Полотенца') {
            towelSizes.style.display = 'block';
        } else if (selectedCategory === 'Постельное белье') {
            // Для постельного белья можно добавить специальные поля
            towelSizes.style.display = 'block';
        }
    });
}

async function handleAddProduct(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    // Проверяем, есть ли файл изображения
    const imageFile = formData.get('image');
    const imageUrl = formData.get('image_url');
    
    // Если нет ни файла, ни URL, показываем ошибку
    if (!imageFile.name && !imageUrl) {
        showNotification('Необходимо указать изображение товара (файл или URL)', 'error');
        return;
    }
    
    // Если есть файл, убираем URL из FormData
    if (imageFile.name) {
        formData.delete('image_url');
    } else {
        formData.delete('image');
    }
    
    // Обрабатываем размеры одежды
    const selectedSizes = formData.getAll('sizes');
    if (selectedSizes.length > 0) {
        // Удаляем старое поле size и добавляем новое с выбранными размерами
        formData.delete('size');
        formData.append('size', selectedSizes.join(', '));
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/products`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Товар успешно добавлен!', 'success');
            
            // Закрываем модальное окно
            const modal = e.target.closest('.modal');
            modal.remove();
            document.body.style.overflow = 'auto';
            
            // Перезагружаем товары
            await loadProducts();
        } else {
            showNotification(data.error || 'Ошибка добавления товара', 'error');
        }
    } catch (error) {
        console.error('Ошибка добавления товара:', error);
        showNotification('Ошибка соединения', 'error');
    }
}

function showEditProducts() {
    // Создаем модальное окно для редактирования товаров
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content admin-modal">
            <span class="close-modal">&times;</span>
            <h2>Управление товарами</h2>
            <div id="edit-products-list">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Загрузка товаров...</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Обработчики событий
    const closeBtn = modal.querySelector('.close-modal');
    
    closeBtn.addEventListener('click', () => {
        modal.remove();
        document.body.style.overflow = 'auto';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            document.body.style.overflow = 'auto';
        }
    });
    
    // Загружаем список товаров для редактирования
    loadProductsForEdit();
}

async function loadProductsForEdit() {
    const productsList = document.getElementById('edit-products-list');
    
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) {
            throw new Error('Ошибка загрузки товаров');
        }
        
        const products = await response.json();
        
        if (products.length === 0) {
            productsList.innerHTML = '<p>Товары не найдены</p>';
            return;
        }
        
        productsList.innerHTML = products.map(product => {
            // Определяем источник изображения
            let imageSrc = '';
            if (product.image_data) {
                // Если есть данные изображения в base64, используем их
                imageSrc = `data:image/jpeg;base64,${product.image_data}`;
            } else if (product.image_url) {
                // Если есть URL изображения, используем его
                imageSrc = product.image_url;
            } else {
                // Если нет изображения, используем заглушку
                imageSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1lcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
            }
            
            return `
                <div class="edit-product-item" data-product-id="${product.id}">
                    <div class="edit-product-image">
                        <img src="${imageSrc}" alt="${product.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1lcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RXJyb3I8L3RleHQ+PC9zdmc+';">
                    </div>
                    <div class="edit-product-info">
                        <h4>${product.name}</h4>
                        <p><strong>Цена:</strong> ${formatPrice(product.price)} ₽</p>
                        <p><strong>Категория:</strong> ${product.category}</p>
                        <p>${product.description.substring(0, 100)}...</p>
                    </div>
                    <div class="edit-product-actions">
                        <button class="edit-btn" onclick="editProduct(${product.id})">
                            <i class="fas fa-edit"></i> Редактировать
                        </button>
                        <button class="delete-btn" onclick="deleteProduct(${product.id})">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Ошибка загрузки товаров для редактирования:', error);
        productsList.innerHTML = '<p>Ошибка загрузки товаров</p>';
    }
}

async function editProduct(productId) {
    const product = allProducts.find(p => p.id == productId);
    if (!product) {
        showNotification('Товар не найден', 'error');
        return;
    }
    
    // Создаем модальное окно для редактирования
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content auth-modal">
            <span class="close-modal">&times;</span>
            <h2>Редактировать товар</h2>
            <form id="edit-product-form" class="auth-form">
                <input type="hidden" name="product_id" value="${product.id}">
                <div class="form-group">
                    <label for="edit-product-name">Название товара:</label>
                    <input type="text" id="edit-product-name" name="name" value="${product.name}" required>
                </div>
                <div class="form-group">
                    <label for="edit-product-description">Описание:</label>
                    <textarea id="edit-product-description" name="description" required rows="3">${product.description}</textarea>
                </div>
                <div class="form-group">
                    <label for="edit-product-price">Цена (₽):</label>
                    <input type="number" id="edit-product-price" name="price" step="0.01" value="${product.price}" required>
                </div>
                <div class="form-group">
                    <label for="edit-product-image">Изображение товара:</label>
                    <input type="file" id="edit-product-image" name="image" accept="image/*">
                    <small>Или укажите URL изображения:</small>
                    <input type="url" id="edit-product-image-url" name="image_url" value="${product.image_url}" placeholder="https://example.com/image.jpg">
                </div>
                <div class="form-group">
                    <label for="edit-product-category">Категория:</label>
                    <select id="edit-product-category" name="category" required>
                        <option value="Пальто" ${product.category === 'Пальто' ? 'selected' : ''}>Пальто</option>
                        <option value="Футболки" ${product.category === 'Футболки' ? 'selected' : ''}>Футболки</option>
                        <option value="Пижама" ${product.category === 'Пижама' ? 'selected' : ''}>Пижама</option>
                        <option value="Свитера" ${product.category === 'Свитера' ? 'selected' : ''}>Свитера</option>
                        <option value="Полотенца" ${product.category === 'Полотенца' ? 'selected' : ''}>Полотенца</option>
                        <option value="Постельное белье" ${product.category === 'Постельное белье' ? 'selected' : ''}>Постельное белье</option>
                    </select>
                </div>
                
                <!-- Динамические поля для размеров одежды -->
                <div class="form-group" id="edit-clothing-sizes" style="display: none;">
                    <label>Размеры одежды:</label>
                    <div class="size-options">
                        <label><input type="checkbox" name="sizes" value="XS" ${(product.size || '').includes('XS') ? 'checked' : ''}> XS</label>
                        <label><input type="checkbox" name="sizes" value="S" ${(product.size || '').includes('S') ? 'checked' : ''}> S</label>
                        <label><input type="checkbox" name="sizes" value="M" ${(product.size || '').includes('M') ? 'checked' : ''}> M</label>
                        <label><input type="checkbox" name="sizes" value="L" ${(product.size || '').includes('L') ? 'checked' : ''}> L</label>
                        <label><input type="checkbox" name="sizes" value="XL" ${(product.size || '').includes('XL') ? 'checked' : ''}> XL</label>
                        <label><input type="checkbox" name="sizes" value="XXL" ${(product.size || '').includes('XXL') ? 'checked' : ''}> XXL</label>
                        <label><input type="checkbox" name="sizes" value="XXXL" ${(product.size || '').includes('XXXL') ? 'checked' : ''}> XXXL</label>
                    </div>
                </div>
                
                <!-- Поле для размеров полотенец -->
                <div class="form-group" id="edit-towel-sizes" style="display: none;">
                    <label for="edit-product-size">Размер полотенца:</label>
                    <select id="edit-product-size" name="size">
                        <option value="">Выберите размер</option>
                        <option value="50x90 см" ${product.size === '50x90 см' ? 'selected' : ''}>50x90 см</option>
                        <option value="70x140 см" ${product.size === '70x140 см' ? 'selected' : ''}>70x140 см</option>
                        <option value="80x150 см" ${product.size === '80x150 см' ? 'selected' : ''}>80x150 см</option>
                        <option value="100x150 см" ${product.size === '100x150 см' ? 'selected' : ''}>100x150 см</option>
                        <option value="120x180 см" ${product.size === '120x180 см' ? 'selected' : ''}>120x180 см</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-product-material">Материал:</label>
                    <input type="text" id="edit-product-material" name="material" value="${product.material || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-product-density">Плотность:</label>
                    <input type="text" id="edit-product-density" name="density" value="${product.density || ''}">
                </div>
                <button type="submit" class="auth-submit-btn">Сохранить изменения</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Обработчики событий
    const closeBtn = modal.querySelector('.close-modal');
    const form = modal.querySelector('#edit-product-form');
    
    closeBtn.addEventListener('click', () => {
        modal.remove();
        document.body.style.overflow = 'auto';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            document.body.style.overflow = 'auto';
        }
    });
    
    form.addEventListener('submit', handleEditProduct);
    
    // Обработчик изменения категории для показа соответствующих полей размеров
    const categorySelect = modal.querySelector('#edit-product-category');
    const clothingSizes = modal.querySelector('#edit-clothing-sizes');
    const towelSizes = modal.querySelector('#edit-towel-sizes');
    
    // Показываем соответствующие поля при загрузке формы
    const selectedCategory = categorySelect.value;
    if (['Пальто', 'Футболки', 'Пижама', 'Свитера'].includes(selectedCategory)) {
        clothingSizes.style.display = 'block';
    } else if (selectedCategory === 'Полотенца') {
        towelSizes.style.display = 'block';
    } else if (selectedCategory === 'Постельное белье') {
        // Для постельного белья можно добавить специальные поля
        towelSizes.style.display = 'block';
    }
    
    categorySelect.addEventListener('change', function() {
        const selectedCategory = this.value;
        
        // Скрываем все поля размеров
        clothingSizes.style.display = 'none';
        towelSizes.style.display = 'none';
        
        // Показываем соответствующие поля в зависимости от категории
        if (['Пальто', 'Футболки', 'Пижама', 'Свитера'].includes(selectedCategory)) {
            clothingSizes.style.display = 'block';
        } else if (selectedCategory === 'Полотенца') {
            towelSizes.style.display = 'block';
        } else if (selectedCategory === 'Постельное белье') {
            // Для постельного белья можно добавить специальные поля
            towelSizes.style.display = 'block';
        }
    });
}

async function handleEditProduct(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const productId = formData.get('product_id');
    
    // Проверяем, есть ли файл изображения
    const imageFile = formData.get('image');
    const imageUrl = formData.get('image_url');
    
    // Если есть файл, убираем URL из FormData
    if (imageFile.name) {
        formData.delete('image_url');
    } else {
        formData.delete('image');
    }
    
    // Обрабатываем размеры одежды
    const selectedSizes = formData.getAll('sizes');
    if (selectedSizes.length > 0) {
        // Удаляем старое поле size и добавляем новое с выбранными размерами
        formData.delete('size');
        formData.append('size', selectedSizes.join(', '));
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Товар успешно обновлен!', 'success');
            
            // Закрываем модальное окно
            const modal = e.target.closest('.modal');
            modal.remove();
            document.body.style.overflow = 'auto';
            
            // Перезагружаем товары
            await loadProducts();
        } else {
            showNotification(data.error || 'Ошибка обновления товара', 'error');
        }
    } catch (error) {
        console.error('Ошибка обновления товара:', error);
        showNotification('Ошибка соединения', 'error');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Товар успешно удален!', 'success');
            
            // Перезагружаем товары
            await loadProducts();
            
            // Обновляем список товаров для редактирования, если он открыт
            const editProductsList = document.getElementById('edit-products-list');
            if (editProductsList) {
                await loadProductsForEdit();
            }
        } else {
            showNotification(data.error || 'Ошибка удаления товара', 'error');
        }
    } catch (error) {
        console.error('Ошибка удаления товара:', error);
        showNotification('Ошибка соединения', 'error');
    }
}