# 🚀 Настройка Render.com для NAVARUM

## ⚠️ **ВАЖНО: Исправление команды запуска**

### **Проблема:**
В настройках Render.com команда запуска указана неправильно:
- ❌ **Текущая:** `gunicorn app.py`
- ✅ **Правильная:** `gunicorn app:app`

## 🔧 **Правильные настройки Render.com:**

### **1. Основные настройки:**
```
Name: navarum-backend
Environment: Python 3
Root Directory: server
```

### **2. Build Command:**
```
pip install -r requirements.txt
```

### **3. Start Command:**
```
gunicorn app:app
```

### **4. Переменные окружения (Environment Variables):**
```
FLASK_ENV=production
SECRET_KEY=ваш_очень_сложный_секретный_ключ_минимум_32_символа
DATABASE_URL=sqlite:///products.db
```

## 📋 **Пошаговая инструкция:**

### **Шаг 1: Исправьте команду запуска**
1. В настройках Render.com найдите "Start Command"
2. Измените `gunicorn app.py` на `gunicorn app:app`
3. Сохраните изменения

### **Шаг 2: Проверьте переменные окружения**
1. В разделе "Environment Variables" добавьте:
   - `FLASK_ENV` = `production`
   - `SECRET_KEY` = `ваш_сложный_ключ`
   - `DATABASE_URL` = `sqlite:///products.db`

### **Шаг 3: Перезапустите деплой**
1. Нажмите "Manual Deploy" → "Deploy latest commit"
2. Дождитесь завершения деплоя
3. Проверьте логи на наличие ошибок

## 🔍 **Проверка работоспособности:**

### **1. Тест API:**
Откройте в браузере:
```
https://ваш-сервис.onrender.com/api/products
```

### **2. Ожидаемый результат:**
```json
[
  {
    "id": 1,
    "name": "Полотенце махровое",
    "description": "Мягкое махровое полотенце",
    "price": 1500.0,
    "image_url": "towel1.jpg",
    "category": "Полотенца"
  }
]
```

## 🚨 **Возможные ошибки и решения:**

### **Ошибка 1: "No module named 'app'**
**Решение:** Убедитесь, что Start Command = `gunicorn app:app`

### **Ошибка 2: "Port already in use"**
**Решение:** Это нормально, Render.com автоматически назначает порт

### **Ошибка 3: "Database locked"**
**Решение:** SQLite может не работать на Render.com, рассмотрите PostgreSQL

### **Ошибка 4: "CORS errors"**
**Решение:** Проверьте настройки CORS в server/app.py

## 📊 **Мониторинг:**

### **Логи Render.com:**
- Откройте вкладку "Logs" в панели Render.com
- Проверьте логи на наличие ошибок
- Убедитесь, что сервер запустился успешно

### **Тест работоспособности:**
```bash
curl https://ваш-сервис.onrender.com/api/products
```

## 🎯 **После успешного деплоя:**

1. **Скопируйте URL** вашего сервиса
2. **Обновите client/config.js** с новым URL
3. **Загрузите клиент** на reg.ru
4. **Протестируйте** весь функционал

---

**После исправления команды запуска сервер должен работать корректно! 🚀**
