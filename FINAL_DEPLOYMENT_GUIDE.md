# 🚀 Финальная инструкция по развертыванию NAVARUM

## ✅ Что уже настроено

### 1. **Серверная часть (server/app.py)**
- ✅ CORS настроен для доменов navarum.site
- ✅ Переменные окружения для продакшена
- ✅ Автоматическое определение порта
- ✅ Безопасный SECRET_KEY

### 2. **Клиентская часть (client/)**
- ✅ Конфигурационный файл config.js
- ✅ Автоматическое определение окружения
- ✅ Динамические API URL

### 3. **Файлы для деплоя**
- ✅ requirements.txt для Render.com
- ✅ .gitignore для исключения ненужных файлов
- ✅ Настройки для gunicorn

## 🔧 Пошаговая настройка Render.com

### Шаг 1: Создание Web Service
1. Зайдите на [render.com](https://render.com)
2. Нажмите "New +" → "Web Service"
3. Подключите ваш GitHub репозиторий
4. Выберите репозиторий с проектом

### Шаг 2: Настройки сервиса
```
Name: navarum-backend
Environment: Python 3
Root Directory: server
Build Command: pip install -r requirements.txt
Start Command: gunicorn app:app
```

### Шаг 3: Переменные окружения
Добавьте в Environment Variables:
```
FLASK_ENV=production
SECRET_KEY=ваш_очень_сложный_секретный_ключ_минимум_32_символа
DATABASE_URL=sqlite:///products.db
```

### Шаг 4: Получение URL
После успешного деплоя вы получите URL вида:
```
https://navarum-backend-xxxxx.onrender.com
```

## 🌐 Настройка клиента на reg.ru

### Шаг 1: Обновление config.js
Замените в `client/config.js`:
```javascript
// Замените на ваш реальный URL с Render.com
return 'https://navarum-backend-xxxxx.onrender.com';
```

### Шаг 2: Загрузка файлов
Загрузите все файлы из папки `client/` на ваш хостинг reg.ru:
- index.html
- config.js
- script.js
- cart.js
- profile.js
- content-manager.js
- styles.css

## 🔒 Безопасность

### 1. **Сложный SECRET_KEY**
Используйте генератор паролей для создания сложного ключа:
```
SECRET_KEY=K9#mP$2vL@7nQ!8xR&5tY*3wE#2024$Navarum$Backend
```

### 2. **HTTPS только**
Убедитесь, что клиент использует HTTPS:
```
https://www.navarum.site
https://navarum.site
```

### 3. **Ограничение CORS (после тестирования)**
После успешного тестирования удалите из CORS:
- `http://localhost:5000`
- `http://127.0.0.1:5000`
- `null`

## 🧪 Тестирование

### 1. **Проверка сервера**
Откройте в браузере:
```
https://navarum-backend-xxxxx.onrender.com/api/products
```
Должен вернуться JSON с товарами.

### 2. **Проверка клиента**
Откройте ваш сайт и проверьте:
- Загрузка товаров
- Авторизация администратора
- Система управления контентом

### 3. **Проверка CORS**
Откройте консоль браузера (F12) и убедитесь, что нет CORS ошибок.

## 📊 Мониторинг

### 1. **Логи Render.com**
- Отслеживайте логи в панели Render.com
- Настройте уведомления об ошибках

### 2. **Производительность**
- Render.com имеет ограничения по времени выполнения
- Мониторьте время ответа API

## 🚨 Возможные проблемы

### 1. **CORS ошибки**
```
Access to fetch at 'https://navarum-backend-xxxxx.onrender.com' from origin 'https://navarum.site' has been blocked by CORS policy
```
**Решение:** Проверьте настройки CORS в server/app.py

### 2. **Таймауты**
```
Request timeout
```
**Решение:** Оптимизируйте запросы к базе данных

### 3. **Ошибки базы данных**
```
Database is locked
```
**Решение:** Рассмотрите переход на PostgreSQL

## 📞 Поддержка

### При возникновении проблем:
1. **Проверьте логи** в Render.com
2. **Убедитесь в правильности** переменных окружения
3. **Проверьте CORS** настройки
4. **Протестируйте API** endpoints отдельно

### Полезные команды для отладки:
```bash
# Проверка API
curl https://navarum-backend-xxxxx.onrender.com/api/products

# Проверка CORS
curl -H "Origin: https://navarum.site" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://navarum-backend-xxxxx.onrender.com/api/products
```

## 🎯 Финальный результат

После успешной настройки:
- ✅ Клиент на reg.ru (navarum.site)
- ✅ Сервер на Render.com
- ✅ Система управления контентом работает
- ✅ Безопасная аутентификация
- ✅ Автоматическое сохранение изменений

---

**Ваш сайт готов к работе в продакшене! 🚀**
