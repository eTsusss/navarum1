# 🚀 Инструкции по развертыванию на Render.com

## 📋 Что нужно получить с Render.com

### 1. **Создание нового Web Service**
1. Зайдите на [render.com](https://render.com)
2. Нажмите "New +" → "Web Service"
3. Подключите ваш GitHub репозиторий
4. Выберите репозиторий с проектом

### 2. **Настройки Web Service**
```
Name: navarum-backend
Environment: Python 3
Build Command: pip install -r requirements.txt
Start Command: gunicorn app:app
```

### 3. **Переменные окружения (Environment Variables)**
Добавьте следующие переменные:
```
FLASK_ENV=production
SECRET_KEY=ваш_сложный_секретный_ключ_здесь
DATABASE_URL=sqlite:///products.db
```

### 4. **Получение URL**
После деплоя вы получите URL вида:
```
https://navarum-backend-xxxxx.onrender.com
```

## 🔧 Настройка проекта для Render.com

### 1. **Создайте файл requirements.txt**
```txt
Flask==2.3.3
Flask-CORS==4.0.0
PyJWT==2.8.0
bcrypt==4.0.1
gunicorn==21.2.0
```

### 2. **Обновите server/app.py**
Добавьте в конец файла:
```python
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
```

### 3. **Создайте файл .gitignore**
```
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.env
*.db
.DS_Store
```

## 🌐 Настройка клиента на reg.ru

### 1. **Загрузите файлы клиента**
Загрузите все файлы из папки `client/` на ваш хостинг reg.ru

### 2. **Обновите config.js**
Замените URL в `client/config.js`:
```javascript
// Замените на ваш реальный URL с Render.com
return 'https://navarum-backend-xxxxx.onrender.com';
```

### 3. **Проверьте CORS**
Убедитесь, что в `server/app.py` добавлены ваши домены:
```python
CORS(app, origins=[
    'https://www.navarum.site',
    'https://navarum.site',
    'http://www.navarum.site',
    'http://navarum.site'
])
```

## 🔄 Процесс деплоя

### 1. **Подготовка сервера**
```bash
# В папке server/
pip freeze > requirements.txt
```

### 2. **Загрузка на GitHub**
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 3. **Настройка Render.com**
- Подключите репозиторий
- Укажите папку `server/` как Root Directory
- Настройте переменные окружения
- Запустите деплой

### 4. **Тестирование**
- Проверьте, что сервер отвечает на URL Render.com
- Протестируйте API endpoints
- Проверьте работу с клиентом

## 🔒 Безопасность

### 1. **Обновите SECRET_KEY**
```python
# В server/app.py замените на сложный ключ
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
```

### 2. **Настройте HTTPS**
- Render.com автоматически предоставляет SSL
- Убедитесь, что клиент использует HTTPS

### 3. **Ограничьте CORS**
Удалите из CORS origins:
- `http://localhost:5000`
- `http://127.0.0.1:5000`
- `null`

## 📊 Мониторинг

### 1. **Логи Render.com**
- Отслеживайте логи в панели Render.com
- Настройте уведомления об ошибках

### 2. **База данных**
- SQLite файл будет создан автоматически
- Для продакшена рекомендуется PostgreSQL

## 🚨 Возможные проблемы

### 1. **CORS ошибки**
- Проверьте настройки CORS в server/app.py
- Убедитесь, что домены указаны правильно

### 2. **Таймауты**
- Render.com имеет ограничения по времени выполнения
- Оптимизируйте запросы к базе данных

### 3. **Проблемы с базой данных**
- SQLite может не работать на Render.com
- Рассмотрите переход на PostgreSQL

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи в Render.com
2. Убедитесь, что все переменные окружения настроены
3. Проверьте CORS настройки
4. Протестируйте API endpoints отдельно

---

**После настройки ваш сайт будет работать с клиентом на reg.ru и сервером на Render.com! 🚀**
