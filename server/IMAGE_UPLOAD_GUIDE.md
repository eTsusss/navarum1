# Руководство по загрузке изображений

## Обзор изменений

В системе добавлена возможность загрузки изображений товаров напрямую в базу данных. Теперь вы можете:

1. **Загружать изображения файлами** вместо использования URL
2. **Хранить изображения в базе данных** в формате BLOB
3. **Получать изображения в base64** для отображения на фронтенде

## Поддерживаемые форматы

- PNG
- JPG/JPEG
- GIF
- WebP

## API для работы с изображениями

### 1. Загрузка изображения

**POST** `/api/admin/upload-image`

Загружает изображение и возвращает его в формате base64.

**Заголовки:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: multipart/form-data
```

**Параметры:**
- `image` (file) - файл изображения

**Ответ:**
```json
{
    "message": "Изображение успешно загружено",
    "image_data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "filename": "product_image.jpg"
}
```

### 2. Добавление товара с изображением

**POST** `/api/admin/products`

**Заголовки:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: multipart/form-data
```

**Параметры:**
- `name` (text) - название товара
- `description` (text) - описание товара
- `price` (number) - цена товара
- `image` (file, optional) - файл изображения
- `image_url` (text, optional) - URL изображения (если нет файла)
- `category` (text, optional) - категория товара
- `size` (text, optional) - размер
- `material` (text, optional) - материал
- `density` (text, optional) - плотность

### 3. Обновление товара с изображением

**PUT** `/api/admin/products/<product_id>`

**Заголовки:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: multipart/form-data
```

**Параметры:** (те же, что и при добавлении)

## Получение товаров с изображениями

При получении товаров через API, изображения возвращаются в поле `image_data` в формате base64:

```json
{
    "id": 1,
    "name": "Коллекция Royal Comfort",
    "description": "Описание товара",
    "price": 2500.0,
    "image_url": "https://example.com/image.jpg",
    "image_data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "category": "Полотенца",
    "size": "70x140 см",
    "material": "100% египетский хлопок",
    "density": "600 г/м²"
}
```

## Приоритет изображений

1. Если загружен файл изображения (`image_data`), он имеет приоритет
2. Если файл не загружен, используется `image_url`
3. Если ни то, ни другое не указано, товар отображается без изображения

## Миграция существующей базы данных

Для обновления существующей базы данных выполните:

```bash
cd server
python migrate_db.py
```

Этот скрипт:
- Добавит поле `image_data` к таблице `products`
- Обновит поле `image_url`, чтобы разрешить NULL значения
- Сохранит все существующие данные

## Примеры использования

### JavaScript (Frontend)

```javascript
// Загрузка изображения
const formData = new FormData();
formData.append('image', fileInput.files[0]);

fetch('/api/admin/upload-image', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    body: formData
})
.then(response => response.json())
.then(data => {
    console.log('Изображение загружено:', data.image_data);
});

// Добавление товара с изображением
const productFormData = new FormData();
productFormData.append('name', 'Новый товар');
productFormData.append('description', 'Описание товара');
productFormData.append('price', '1500');
productFormData.append('image', fileInput.files[0]);
productFormData.append('category', 'Полотенца');

fetch('/api/admin/products', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    body: productFormData
})
.then(response => response.json())
.then(data => {
    console.log('Товар добавлен:', data);
});
```

### Python (Backend)

```python
import requests

# Загрузка изображения
with open('product_image.jpg', 'rb') as f:
    files = {'image': f}
    response = requests.post(
        'http://localhost:5000/api/admin/upload-image',
        headers={'Authorization': f'Bearer {token}'},
        files=files
    )
    print(response.json())

# Добавление товара
data = {
    'name': 'Новый товар',
    'description': 'Описание товара',
    'price': 1500,
    'category': 'Полотенца'
}

with open('product_image.jpg', 'rb') as f:
    files = {'image': f}
    response = requests.post(
        'http://localhost:5000/api/admin/products',
        headers={'Authorization': f'Bearer {token}'},
        data=data,
        files=files
    )
    print(response.json())
```

## Безопасность

- Проверяются только разрешенные типы файлов
- Имена файлов обеззараживаются с помощью `secure_filename`
- Файлы временно сохраняются и сразу удаляются
- Размер файлов не ограничен (можно добавить ограничение при необходимости)

## Производительность

- Изображения хранятся в базе данных как BLOB
- При получении товаров изображения конвертируются в base64
- Для больших изображений рекомендуется использовать CDN или внешнее хранилище
