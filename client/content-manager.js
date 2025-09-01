// Система управления контентом страницы
class ContentManager {
    constructor() {
        this.content = {};
        this.isAdmin = false;
        this.init();
    }

    async init() {
        console.log('ContentManager initializing...');
        await this.loadContent();
        console.log('Content loaded:', Object.keys(this.content).length, 'sections');
        this.setupEventListeners();
        this.updatePageContent();
        console.log('ContentManager initialized');
    }

    async loadContent() {
        try {
            console.log('Loading content from API...');
            const response = await fetch(`${window.config.fullApiUrl}/api/content`);
            console.log('Content API response status:', response.status);
            
            if (response.ok) {
                this.content = await response.json();
                console.log('Content loaded successfully:', this.content);
            } else {
                console.error('Failed to load content:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Ошибка загрузки контента:', error);
        }
    }

    setupEventListeners() {
        // Проверяем, является ли пользователь администратором
        const token = localStorage.getItem('authToken');
        const userInfo = localStorage.getItem('userInfo');
        console.log('Token found:', !!token);
        console.log('User info found:', !!userInfo);
        
        if (token && userInfo) {
            try {
                const user = JSON.parse(userInfo);
                console.log('User info:', user);
                this.isAdmin = user.role === 'admin';
                console.log('Is admin:', this.isAdmin);
                
                if (this.isAdmin) {
                    console.log('Setting up admin controls...');
                    this.setupAdminControls();
                }
            } catch (error) {
                console.error('Ошибка проверки роли:', error);
            }
        } else {
            console.log('No token or user info found');
        }
    }

    setupAdminControls() {
        console.log('Setting up admin controls...');
        
        // Добавляем возможность редактирования при клике на элементы
        this.makeElementsEditable();
    }

    makeElementsEditable() {
        // Делаем элементы с data-content атрибутами редактируемыми
        const elements = document.querySelectorAll('[data-content]');
        console.log('Found editable elements:', elements.length);
        
        if (elements.length === 0) {
            console.warn('No elements with data-content found!');
            // Давайте проверим, какие элементы есть на странице
            const allElements = document.querySelectorAll('h1, h2, h3, p, button, span');
            console.log('Total elements found:', allElements.length);
            allElements.forEach(el => {
                if (el.textContent.trim()) {
                    console.log('Element:', el.tagName, el.textContent.substring(0, 50));
                }
            });
            
            // Попробуем найти элементы по содержимому
            const heroTitle = document.querySelector('h1');
            if (heroTitle) {
                console.log('Found hero title, adding data-content attribute');
                heroTitle.setAttribute('data-content', 'hero.main_title');
            }
            
            const heroSubtitle = document.querySelector('.hero p');
            if (heroSubtitle) {
                console.log('Found hero subtitle, adding data-content attribute');
                heroSubtitle.setAttribute('data-content', 'hero.subtitle');
            }
            
            // Повторно ищем элементы после добавления атрибутов
            const newElements = document.querySelectorAll('[data-content]');
            console.log('Found editable elements after adding attributes:', newElements.length);
            
            if (newElements.length > 0) {
                newElements.forEach(element => {
                    this.setupElementEditing(element);
                });
            }
        } else {
            elements.forEach(element => {
                this.setupElementEditing(element);
            });
        }
    }
    
    setupElementEditing(element) {
        console.log('Setting up editing for element:', element.textContent.substring(0, 30) + '...');
        
        // Удаляем старые обработчики
        element.removeEventListener('dblclick', this.handleDoubleClick);
        
        // Добавляем новый обработчик
        element.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        
        // Добавляем визуальную подсказку для администратора
        element.style.cursor = 'pointer';
        element.title = 'Двойной клик для редактирования';
        
        // Добавляем визуальную индикацию для администратора
        element.style.border = '1px dashed transparent';
        element.addEventListener('mouseenter', () => {
            if (this.isAdmin) {
                element.style.border = '1px dashed #007bff';
            }
        });
        element.addEventListener('mouseleave', () => {
            element.style.border = '1px dashed transparent';
        });
    }
    
    handleDoubleClick(e) {
        console.log('Double click detected on:', e.target.textContent.substring(0, 30) + '...');
        if (this.isAdmin) {
            e.preventDefault();
            this.makeElementEditable(e.target);
        } else {
            console.log('User is not admin, cannot edit');
        }
    }

    makeElementEditable(element) {
        const originalText = element.textContent;
        const originalHTML = element.innerHTML;
        
        // Создаем input для редактирования
        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalText;
        input.className = 'content-edit-input';
        input.style.cssText = `
            width: 100%;
            padding: 5px;
            border: 2px solid #007bff;
            border-radius: 4px;
            font-size: inherit;
            font-family: inherit;
            background: white;
            color: black;
        `;

        // Заменяем элемент на input
        element.innerHTML = '';
        element.appendChild(input);
        input.focus();
        input.select();

        // Обработчики для сохранения или отмены
        const saveEdit = async () => {
            const newText = input.value.trim();
            if (newText !== originalText) {
                await this.saveElementContent(element, newText);
            } else {
                element.innerHTML = originalHTML;
            }
        };

        const cancelEdit = () => {
            element.innerHTML = originalHTML;
        };

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveEdit();
            } else if (e.key === 'Escape') {
                cancelEdit();
            }
        });
    }

    async saveElementContent(element, newText) {
        // Определяем секцию и ключ на основе элемента
        const section = this.getElementSection(element);
        const key = this.getElementKey(element);
        
        if (section && key) {
            try {
                const response = await fetch(`${window.config.fullApiUrl}/api/content/${section}/${key}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({
                        value: newText,
                        type: 'text'
                    })
                });

                if (response.ok) {
                    element.textContent = newText;
                    // Обновляем локальный кэш
                    if (!this.content[section]) {
                        this.content[section] = {};
                    }
                    this.content[section][key] = {
                        value: newText,
                        type: 'text'
                    };
                    this.showNotification('Контент сохранен!', 'success');
                } else {
                    throw new Error('Ошибка сохранения');
                }
            } catch (error) {
                console.error('Ошибка сохранения контента:', error);
                element.innerHTML = element.textContent; // Восстанавливаем оригинал
                this.showNotification('Ошибка сохранения контента', 'error');
            }
        }
    }

    getElementSection(element) {
        // Определяем секцию и ключ из data-атрибута
        const dataContent = element.getAttribute('data-content');
        if (dataContent) {
            const [section, key] = dataContent.split('.');
            return section;
        }
        
        // Fallback на основе класса или родительского элемента
        if (element.closest('.hero')) return 'hero';
        if (element.closest('.benefits')) return 'benefits';
        if (element.closest('.products')) return 'products';
        if (element.closest('.footer')) return 'footer';
        if (element.closest('nav')) return 'navigation';
        if (element.closest('button')) return 'buttons';
        return 'general';
    }

    getElementKey(element) {
        // Определяем ключ из data-атрибута
        const dataContent = element.getAttribute('data-content');
        if (dataContent) {
            const [section, key] = dataContent.split('.');
            return key;
        }
        
        // Fallback на основе содержимого или атрибутов
        const text = element.textContent.trim();
        const tagName = element.tagName.toLowerCase();
        
        if (tagName === 'h1') return 'main_title';
        if (tagName === 'h2') return 'title';
        if (tagName === 'h3') return 'subtitle';
        if (tagName === 'p') return 'description';
        if (element.closest('nav')) return 'nav_item';
        if (element.closest('button')) return 'button_text';
        
        return 'content';
    }



    updatePageContent() {
        // Обновляем контент на странице
        for (const [section, items] of Object.entries(this.content)) {
            for (const [key, item] of Object.entries(items)) {
                this.updateElementContent(section, key, item.value);
            }
        }
    }

    updateElementContent(section, key, value) {
        // Находим и обновляем элементы на странице по data-атрибутам
        const elements = document.querySelectorAll(`[data-content="${section}.${key}"]`);
        
        elements.forEach(element => {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.value = value;
            } else {
                element.textContent = value;
            }
        });
    }

    getSelectorsForContent(section, key) {
        // Маппинг секций и ключей к CSS селекторам
        const selectors = {
            'hero': {
                'main_title': '.hero h1',
                'subtitle': '.hero h2',
                'description': '.hero p'
            },
            'benefits': {
                'title': '.benefits h2',
                'item1_title': '.benefits .benefit-item:nth-child(1) h3',
                'item1_text': '.benefits .benefit-item:nth-child(1) p',
                'item2_title': '.benefits .benefit-item:nth-child(2) h3',
                'item2_text': '.benefits .benefit-item:nth-child(2) p',
                'item3_title': '.benefits .benefit-item:nth-child(3) h3',
                'item3_text': '.benefits .benefit-item:nth-child(3) p'
            },
            'products': {
                'title': '.products h2',
                'loading_text': '.products .loading'
            },
            'footer': {
                'about_title': '.footer .about h3',
                'about_text': '.footer .about p',
                'links_title': '.footer .links h3',
                'contact_title': '.footer .contact h3',
                'phone': '.footer .contact p:nth-child(2)',
                'email': '.footer .contact p:nth-child(3)',
                'address': '.footer .contact p:nth-child(4)',
                'copyright': '.footer-bottom p'
            },
            'navigation': {
                'advantages': 'nav a[href="#features"]',
                'gallery': 'nav a[href="#gallery"]',
                'contacts': 'nav a[href="#contact"]'
            },
            'filters': {
                'all_products': '.filter-btn[data-category="all"]',
                'coats': '.filter-btn[data-category="Пальто"]',
                'tshirts': '.filter-btn[data-category="Футболки"]',
                'pajamas': '.filter-btn[data-category="Пижама"]',
                'sweaters': '.filter-btn[data-category="Свитера"]',
                'towels': '.filter-btn[data-category="Полотенца"]',
                'bedding': '.filter-btn[data-category="Постельное белье"]'
            }
        };

        return selectors[section]?.[key] ? [selectors[section][key]] : [];
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        if (type === 'success') {
            notification.style.background = '#28a745';
        } else if (type === 'error') {
            notification.style.background = '#dc3545';
        } else {
            notification.style.background = '#007bff';
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Инициализация системы управления контентом
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ContentManager...');
    window.contentManager = new ContentManager();
    
    // Принудительная проверка через 1 секунду после загрузки
    setTimeout(() => {
        if (window.contentManager) {
            console.log('Forcing ContentManager reinitialization...');
            window.contentManager.setupEventListeners();
        }
    }, 1000);
});

// Также инициализируем при успешной авторизации
window.addEventListener('auth-success', () => {
    console.log('Auth success event, reinitializing ContentManager...');
    if (window.contentManager) {
        window.contentManager.setupEventListeners();
    }
});

// Дополнительная проверка каждые 2 секунды для администраторов
setInterval(() => {
    if (window.contentManager && !window.contentManager.isAdmin) {
        const token = localStorage.getItem('authToken');
        const userInfo = localStorage.getItem('userInfo');
        
        if (token && userInfo) {
            try {
                const user = JSON.parse(userInfo);
                if (user.role === 'admin') {
                    console.log('Admin detected, reinitializing ContentManager...');
                    window.contentManager.setupEventListeners();
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
            }
        }
    }
}, 2000);

// CSS анимации для уведомлений
const contentManagerStyle = document.createElement('style');
contentManagerStyle.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    

    
    .content-edit-input {
        outline: none;
        border: 2px solid #007bff !important;
    }
    

`;
document.head.appendChild(contentManagerStyle);
