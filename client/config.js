// Конфигурация API для разных окружений
const config = {
    // Определяем, находимся ли мы в продакшене
    isProduction: window.location.hostname === 'navarum.site' || window.location.hostname === 'www.navarum.site',
    
    // URL API сервера
    get apiUrl() {
        if (this.isProduction) {
            // В продакшене используем URL Render.com
            return 'https://navarum-backend.onrender.com';
        } else {
            // В разработке используем локальный сервер
            return 'http://localhost:5000';
        }
    },
    
    // Полный URL для API запросов
    get fullApiUrl() {
        return this.apiUrl;
    }
};

// Экспортируем конфигурацию
window.config = config;
