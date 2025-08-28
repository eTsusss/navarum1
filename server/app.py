from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os
import jwt
import bcrypt
from datetime import datetime, timedelta
from functools import wraps

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'H,jVXSlcAknKoP0IsvMpxGhe.uYtZRT-')  # В продакшене используйте безопасный ключ

# Настройка CORS для поддержки origin 'null' (файлы, открытые напрямую) и продакшн доменов
CORS(app, origins=[
    'http://localhost:5000', 
    'http://127.0.0.1:5000', 
    'null',
    'https://www.navarum.site',
    'https://navarum.site',
    'http://www.navarum.site',
    'http://navarum.site'
], supports_credentials=True, methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Создание базы данных и таблицы
def init_db():
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    
    # Таблица товаров
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            price REAL NOT NULL,
            image_url TEXT NOT NULL,
            category TEXT NOT NULL,
            size TEXT,
            material TEXT,
            density TEXT
        )
    ''')
    
    # Таблица пользователей
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            first_name TEXT,
            last_name TEXT,
            phone TEXT,
            address TEXT,
            city TEXT,
            postal_code TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Таблица корзины для авторизованных пользователей
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cart_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
            UNIQUE(user_id, product_id)
        )
    ''')
    
    # Таблица заказов
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            total_amount REAL NOT NULL,
            payment_method TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    # Таблица элементов заказа
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
        )
    ''')

    # Таблица контента страниц
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS page_content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            section_name TEXT NOT NULL,
            content_key TEXT NOT NULL,
            content_value TEXT NOT NULL,
            content_type TEXT NOT NULL DEFAULT 'text',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Добавляем тестовые данные для товаров, если таблица пустая
    cursor.execute('SELECT COUNT(*) FROM products')
    if cursor.fetchone()[0] == 0:
        products_data = [
            {
                'name': 'Коллекция "Royal Comfort"',
                'description': 'Эти полотенца изготовлены из 100% египетского хлопка высшего качества. Идеальны для тех, кто ценит роскошь и комфорт.',
                'price': 2500.0,
                'image_url': 'https://barber-x-press.ru/images/detailed/8/%D0%A1%D0%BD%D0%B8%D0%BC%D0%BE%D0%BA_%D1%8D%D0%BA%D1%80%D0%B0%D0%BD%D0%B0_2019-08-08_%D0%B2_11.07.48.png',
                'category': 'Полотенца',
                'size': '70x140 см',
                'material': '100% египетский хлопок',
                'density': '600 г/м²'
            },
            {
                'name': 'Коллекция "Pure Cotton"',
                'description': 'Натуральные полотенца с особой мягкостью. Отлично впитывают влагу и сохраняют свои свойства после множества стирок.',
                'price': 1800.0,
                'image_url': 'https://www.oteliya.com/dl_images/udb_photos/udb1-rec912-field2.jpg',
                'category': 'Полотенца',
                'size': '70x140 см',
                'material': '100% хлопок',
                'density': '500 г/м²'
            },
            {
                'name': 'Коллекция "Spa Luxury"',
                'description': 'Премиальные полотенца для спа-процедур. Обеспечивают непревзойденный комфорт и элегантность.',
                'price': 3200.0,
                'image_url': 'https://cdn.laredoute.com/cdn-cgi/image/width=400,height=400,fit=pad,dpr=1/products/0/d/8/0d80a10477ac02d5f0edeb5ba399e65a.jpg',
                'category': 'Полотенца',
                'size': '80x150 см',
                'material': '100% египетский хлопок',
                'density': '700 г/м²'
            },
            {
                'name': 'Полотенце "Bamboo Luxury"',
                'description': 'Экологичные полотенца из бамбукового волокна. Невероятно мягкие и быстро сохнущие.',
                'price': 2800.0,
                'image_url': 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
                'category': 'Полотенца',
                'size': '70x140 см',
                'material': '100% бамбуковое волокно',
                'density': '450 г/м²'
            },
            {
                'name': 'Полотенце "Velvet Touch"',
                'description': 'Бархатистые полотенца с особой текстурой. Максимальная впитываемость и комфорт.',
                'price': 2200.0,
                'image_url': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
                'category': 'Полотенца',
                'size': '75x150 см',
                'material': '100% хлопок',
                'density': '550 г/м²'
            },
            {
                'name': 'Полотенце "Ocean Fresh"',
                'description': 'Свежие цвета и приятная текстура. Идеально для ванной комнаты и пляжа.',
                'price': 1900.0,
                'image_url': 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
                'category': 'Полотенца',
                'size': '70x140 см',
                'material': '100% хлопок',
                'density': '500 г/м²'
            }
        ]
        
        for product in products_data:
            cursor.execute('''
                INSERT INTO products (name, description, price, image_url, category, size, material, density)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                product['name'], product['description'], product['price'], 
                product['image_url'], product['category'], product['size'], 
                product['material'], product['density']
            ))
    
    # Добавляем только администратора по умолчанию, если таблица пользователей пустая
    cursor.execute('SELECT COUNT(*) FROM users')
    if cursor.fetchone()[0] == 0:
        # Сложные учетные данные для администратора
        admin_username = 'navarum_admin_2025'
        admin_password = 'K9#mP$2vL@7nQ!8xR&5tY*3wE'
        admin_password_hash = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt())
        
        # Добавляем только администратора
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, role)
            VALUES (?, ?, ?, ?)
        ''', (admin_username, 'admin@navarum.ru', admin_password_hash.decode('utf-8'), 'admin'))
    
    # Добавляем контент страницы по умолчанию, если таблица пустая
    cursor.execute('SELECT COUNT(*) FROM page_content')
    if cursor.fetchone()[0] == 0:
        default_content = [
            # Заголовок страницы
            ('header', 'title', 'NAVARUM - Роскошные банные полотенца', 'text'),
            
            # Главный заголовок
            ('hero', 'main_title', 'Торгово—производственная компания NAVARUM', 'text'),
            ('hero', 'subtitle', 'NAVARUM — безупречное качество и стиль: пальто, куртки, свитера, полотенца и халаты', 'text'),
            ('hero', 'description', 'Наша продукция создана для тех, кто ценит комфорт, долговечность и элегантность:', 'text'),
            
            # Преимущества
            ('benefits', 'title', 'Наши преимущества', 'text'),
            ('benefits', 'item1_title', 'Премиальное качество', 'text'),
            ('benefits', 'item1_text', 'Плотность 600 г/м² обеспечивает идеальный баланс между мягкостью и впитываемостью.', 'text'),
            ('benefits', 'item2_title', 'Экологичность', 'text'),
            ('benefits', 'item2_text', 'Используем только натуральные материалы и безопасные красители.', 'text'),
            ('benefits', 'item3_title', 'Долговечность', 'text'),
            ('benefits', 'item3_text', 'Специальная обработка волокон сохраняет качество после множества стирок.', 'text'),
            
            # Продукция
            ('products', 'title', 'Наша продукция', 'text'),
            ('products', 'loading_text', 'Загрузка товаров...', 'text'),
            
            # Фильтры
            ('filters', 'all_products', 'Все товары', 'text'),
            ('filters', 'towels', 'Полотенца', 'text'),
            ('filters', 'coats', 'Пальто', 'text'),
            ('filters', 'jackets', 'Куртки', 'text'),
            ('filters', 'sweaters', 'Свитера', 'text'),
            
            # Футер
            ('footer', 'about_title', 'О NAVARUM', 'text'),
            ('footer', 'about_text', 'Мы создаем роскошные банные полотенца премиум-класса с 2010 года. Наша миссия - привнести элегантность и комфорт в каждый дом.', 'text'),
            ('footer', 'links_title', 'Ссылки', 'text'),
            ('footer', 'contact_title', 'Контакты', 'text'),
            ('footer', 'phone', '+7 (999) 123-45-67', 'text'),
            ('footer', 'email', 'info@navarum.ru', 'text'),
            ('footer', 'address', 'Москва, ул. Роскошная, 15', 'text'),
            ('footer', 'copyright', '© 2025 NAVARUM. Все права защищены.', 'text'),
            
            # Навигация
            ('navigation', 'advantages', 'Преимущества', 'text'),
            ('navigation', 'gallery', 'Галерея', 'text'),
            ('navigation', 'contacts', 'Контакты', 'text'),
            ('navigation', 'login', 'Войти', 'text'),
            ('navigation', 'profile', 'Личный кабинет', 'text'),
            ('navigation', 'logout', 'Выйти', 'text'),
            
            # Кнопки
            ('buttons', 'learn_more', 'Узнать больше', 'text'),
            ('buttons', 'add_to_cart', 'Добавить в корзину', 'text'),
            ('buttons', 'clear_cart', 'Очистить корзину', 'text'),
            ('buttons', 'checkout', 'Оформить заказ', 'text'),
            
            # Модальные окна
            ('modals', 'login_title', 'Вход в систему', 'text'),
            ('modals', 'register_title', 'Регистрация', 'text'),
            ('modals', 'profile_title', 'Личный кабинет', 'text'),
            ('modals', 'cart_title', 'Корзина', 'text'),
            ('modals', 'checkout_title', 'Оформление заказа', 'text'),
            
            # Формы
            ('forms', 'username', 'Имя пользователя:', 'text'),
            ('forms', 'email', 'Email:', 'text'),
            ('forms', 'password', 'Пароль:', 'text'),
            ('forms', 'confirm_password', 'Подтвердите пароль:', 'text'),
            ('forms', 'first_name', 'Имя:', 'text'),
            ('forms', 'last_name', 'Фамилия:', 'text'),
            ('forms', 'phone', 'Телефон:', 'text'),
            ('forms', 'address', 'Адрес:', 'text'),
            ('forms', 'city', 'Город:', 'text'),
            ('forms', 'postal_code', 'Индекс:', 'text'),
            
            # Сообщения
            ('messages', 'registration_disabled', 'Регистрация новых пользователей временно недоступна', 'text'),
            ('messages', 'cart_disabled', 'Корзина временно недоступна', 'text'),
            ('messages', 'no_orders', 'У вас пока нет заказов', 'text'),
            ('messages', 'browse_products', 'Перейти к товарам', 'text'),
            
            # Категории товаров
            ('categories', 'towels', 'Полотенца', 'text'),
            ('categories', 'coats', 'Пальто', 'text'),
            ('categories', 'jackets', 'Куртки', 'text'),
            ('categories', 'sweaters', 'Свитера', 'text'),
            ('categories', 'robes', 'Халаты', 'text')
        ]
        
        for section, key, value, content_type in default_content:
            cursor.execute('''
                INSERT INTO page_content (section_name, content_key, content_value, content_type)
                VALUES (?, ?, ?, ?)
            ''', (section, key, value, content_type))
    
    conn.commit()
    conn.close()

# Инициализация базы данных при запуске
init_db()

# Функция для создания JWT токена
def create_token(user_id, username, role):
    payload = {
        'user_id': user_id,
        'username': username,
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=24)  # Токен действителен 24 часа
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

# Декоратор для проверки JWT токена
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Неверный формат токена'}), 401
        
        if not token:
            return jsonify({'error': 'Токен отсутствует'}), 401
        
        try:
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = {
                'id': payload['user_id'],
                'username': payload['username'],
                'role': payload['role']
            }
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Токен истек'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Неверный токен'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

# Декоратор для проверки роли администратора
def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user['role'] != 'admin':
            return jsonify({'error': 'Доступ запрещен. Требуются права администратора'}), 403
        return f(current_user, *args, **kwargs)
    
    return decorated

# Маршруты для авторизации
# Убираем маршрут регистрации - он больше не нужен
# @app.route('/api/auth/register', methods=['POST'])
# def register():
#     """Регистрация нового пользователя"""
#     data = request.get_json()
#     
#     if not data or not data.get('username') or not data.get('email') or not data.get('password'):
#         return jsonify({'error': 'Необходимо указать username, email и password'}), 400
#     
#     username = data['username']
#     email = data['email']
#     password = data['password']
#     
#     # Получаем дополнительные данные профиля
#     first_name = data.get('first_name', '')
#     last_name = data.get('last_name', '')
#     phone = data.get('phone', '')
#     address = data.get('address', '')
#     city = data.get('city', '')
#     postal_code = data.get('postal_code', '')
#     
#     # Хешируем пароль
#     password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
#     
#     conn = sqlite3.connect('products.db')
#     cursor = conn.cursor()
#     
#     try:
#         cursor.execute('''
#             INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone, address, city, postal_code)
#             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
#         ''', (username, email, password_hash.decode('utf-8'), 'user', first_name, last_name, phone, address, city, postal_code))
#         
#         conn.commit()
#         
#         # Получаем ID нового пользователя
#         user_id = cursor.lastrowid
#         
#         # Создаем токен
#         token = create_token(user_id, username, 'user')
#         
#         return jsonify({
#             'message': 'Пользователь успешно зарегистрирован',
#             'token': token,
#             'user': {
#                 'id': user_id,
#                 'username': username,
#                 'email': email,
#                 'role': 'user',
#                 'first_name': first_name,
#                 'last_name': last_name,
#                 'phone': phone,
#                 'address': address,
#                 'city': city,
#                 'postal_code': postal_code
#             }
#         }), 201
#         
#     except sqlite3.IntegrityError:
#         return jsonify({'error': 'Пользователь с таким username или email уже существует'}), 409
#     finally:
#         conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Вход пользователя"""
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Необходимо указать username и password'}), 400
    
    username = data['username']
    password = data['password']
    
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT id, username, email, password_hash, role FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()
    
    conn.close()
    
    if user and bcrypt.checkpw(password.encode('utf-8'), user[3].encode('utf-8')):
        token = create_token(user[0], user[1], user[4])
        
        return jsonify({
            'message': 'Успешный вход',
            'token': token,
            'user': {
                'id': user[0],
                'username': user[1],
                'email': user[2],
                'role': user[4]
            }
        })
    else:
        return jsonify({'error': 'Неверный username или password'}), 401

@app.route('/api/auth/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """Получить профиль текущего пользователя"""
    return jsonify({
        'id': current_user['id'],
        'username': current_user['username'],
        'role': current_user['role']
    })

# Защищенные маршруты для администратора
@app.route('/api/admin/products', methods=['POST'])
@token_required
@admin_required
def add_product(current_user):
    """Добавить новый товар (только для администратора)"""
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('description') or not data.get('price'):
        return jsonify({'error': 'Необходимо указать name, description и price'}), 400
    
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO products (name, description, price, image_url, category, size, material, density)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['name'], data['description'], data['price'],
        data.get('image_url', ''), data.get('category', ''),
        data.get('size', ''), data.get('material', ''), data.get('density', '')
    ))
    
    product_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({
        'message': 'Товар успешно добавлен',
        'product_id': product_id
    }), 201

@app.route('/api/admin/products/<int:product_id>', methods=['PUT'])
@token_required
@admin_required
def update_product(current_user, product_id):
    """Обновить товар (только для администратора)"""
    data = request.get_json()
    
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    
    # Проверяем, существует ли товар
    cursor.execute('SELECT * FROM products WHERE id = ?', (product_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({'error': 'Товар не найден'}), 404
    
    # Обновляем товар
    cursor.execute('''
        UPDATE products 
        SET name = ?, description = ?, price = ?, image_url = ?, category = ?, size = ?, material = ?, density = ?
        WHERE id = ?
    ''', (
        data.get('name'), data.get('description'), data.get('price'),
        data.get('image_url'), data.get('category'), data.get('size'),
        data.get('material'), data.get('density'), product_id
    ))
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Товар успешно обновлен'})

@app.route('/api/admin/products/<int:product_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_product(current_user, product_id):
    """Удалить товар (только для администратора)"""
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    
    # Проверяем, существует ли товар
    cursor.execute('SELECT * FROM products WHERE id = ?', (product_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({'error': 'Товар не найден'}), 404
    
    cursor.execute('DELETE FROM products WHERE id = ?', (product_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Товар успешно удален'})

@app.route('/api/products', methods=['GET'])
def get_products():
    """Получить все товары"""
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM products')
    products = cursor.fetchall()
    
    conn.close()
    
    products_list = []
    for product in products:
        products_list.append({
            'id': product[0],
            'name': product[1],
            'description': product[2],
            'price': product[3],
            'image_url': product[4],
            'category': product[5],
            'size': product[6],
            'material': product[7],
            'density': product[8]
        })
    
    return jsonify(products_list)

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Получить товар по ID"""
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM products WHERE id = ?', (product_id,))
    product = cursor.fetchone()
    
    conn.close()
    
    if product:
        return jsonify({
            'id': product[0],
            'name': product[1],
            'description': product[2],
            'price': product[3],
            'image_url': product[4],
            'category': product[5],
            'size': product[6],
            'material': product[7],
            'density': product[8]
        })
    else:
        return jsonify({'error': 'Товар не найден'}), 404

@app.route('/api/products/category/<category>', methods=['GET'])
def get_products_by_category(category):
    """Получить товары по категории"""
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM products WHERE category = ?', (category,))
    products = cursor.fetchall()
    
    conn.close()
    
    products_list = []
    for product in products:
        products_list.append({
            'id': product[0],
            'name': product[1],
            'description': product[2],
            'price': product[3],
            'image_url': product[4],
            'category': product[5],
            'size': product[6],
            'material': product[7],
            'density': product[8]
        })
    
    return jsonify(products_list)

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Получить все категории"""
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT DISTINCT category FROM products')
    categories = cursor.fetchall()
    
    conn.close()
    
    categories_list = [category[0] for category in categories]
    return jsonify(categories_list)

# ===== API КОРЗИНЫ - ЗАКОММЕНТИРОВАНО =====

# @app.route('/api/cart', methods=['GET'])
# @token_required
# def get_cart(current_user):
#     """Получить корзину пользователя"""
#     conn = sqlite3.connect('products.db')
#     cursor = conn.cursor()
#     
#     cursor.execute('''
#         SELECT ci.id, ci.quantity, p.id, p.name, p.price, p.image_url, p.category
#         FROM cart_items ci
#         JOIN products p ON ci.product_id = p.id
#         WHERE ci.user_id = ?
#     ''', (current_user['id'],))
#     
#     cart_items = cursor.fetchall()
#     conn.close()
#     
#     cart_list = []
#     total_amount = 0
#     
#     for item in cart_items:
#         item_total = item[1] * item[4]  # quantity * price
#         total_amount += item_total
#         
#         cart_list.append({
#             'cart_item_id': item[0],
#             'product_id': item[2],
#             'name': item[3],
#             'price': item[4],
#             'image_url': item[5],
#             'category': item[6],
#             'quantity': item[1],
#             'total': item_total
#         })
#     
#     return jsonify({
#         'items': cart_list,
#         'total_amount': total_amount,
#         'item_count': len(cart_list)
#     })

# @app.route('/api/cart/add', methods=['POST'])
# @token_required
# def add_to_cart(current_user):
#     """Добавить товар в корзину"""
#     data = request.get_json()
#     product_id = data.get('product_id')
#     quantity = data.get('quantity', 1)
#     
#     if not product_id:
#         return jsonify({'error': 'ID товара обязателен'}), 400
#     
#     conn = sqlite3.connect('products.db')
#     cursor = conn.cursor()
#     
#     # Проверяем, есть ли товар в корзине
#     cursor.execute('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?', 
#                    (current_user['id'], product_id))
#     existing_item = cursor.fetchone()
#     
#     if existing_item:
#         # Обновляем количество
#         new_quantity = existing_item[1] + quantity
#         cursor.execute('UPDATE cart_items SET quantity = ? WHERE id = ?', 
#                        (new_quantity, existing_item[0]))
#     else:
#         # Добавляем новый товар
#         cursor.execute('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)', 
#                        (current_user['id'], product_id, quantity))
#     
#     conn.commit()
#     conn.close()
#     
#     return jsonify({'message': 'Товар добавлен в корзину'})

# @app.route('/api/cart/update', methods=['PUT'])
# @token_required
# def update_cart_item(current_user):
#     """Обновить количество товара в корзине"""
#     data = request.get_json()
#     cart_item_id = data.get('cart_item_id')
#     quantity = data.get('quantity')
#     
#     if not cart_item_id or quantity is None:
#         return jsonify({'error': 'ID элемента корзины и количество обязательны'}), 400
#     
#     if quantity <= 0:
#         return jsonify({'error': 'Количество должно быть больше 0'}), 400
#     
#     conn = sqlite3.connect('products.db')
#     cursor = conn.cursor()
#     
#     # Проверяем, принадлежит ли элемент корзины пользователю
#     cursor.execute('SELECT id FROM cart_items WHERE id = ? AND user_id = ?', 
#                    (cart_item_id, current_user['id']))
#     
#     if not cursor.fetchone():
#         conn.close()
#         return jsonify({'error': 'Элемент корзины не найден'}), 404
#     
#     cursor.execute('UPDATE cart_items SET quantity = ? WHERE id = ?', (quantity, cart_item_id))
#     conn.commit()
#     conn.close()
#     
#     return jsonify({'message': 'Количество обновлено'})

# @app.route('/api/cart/remove', methods=['DELETE'])
# @token_required
# def remove_from_cart(current_user):
#     """Удалить товар из корзины"""
#     data = request.get_json()
#     cart_item_id = data.get('cart_item_id')
#     
#     if not cart_item_id:
#         return jsonify({'error': 'ID элемента корзины обязателен'}), 400
#     
#     conn = sqlite3.connect('products.db')
#     cursor = conn.cursor()
#     
#     # Проверяем, принадлежит ли элемент корзины пользователю
#     cursor.execute('DELETE FROM cart_items WHERE id = ? AND user_id = ?', 
#                    (cart_item_id, current_user['id']))
#     
#     if cursor.rowcount == 0:
#         return jsonify({'error': 'ID элемента корзины обязателен'}), 400
#     
#     conn.commit()
#     conn.close()
#     
#     return jsonify({'message': 'Товар удален из корзины'})

# @app.route('/api/cart/clear', methods=['DELETE'])
# @token_required
# def clear_cart(current_user):
#     """Очистить корзину пользователя"""
#     conn = sqlite3.connect('products.db')
#     cursor = conn.cursor()
#     
#     cursor.execute('DELETE FROM cart_items WHERE user_id = ?', (current_user['id'],))
#     conn.commit()
#     conn.close()
#     
#     return jsonify({'message': 'Корзина очищена'})

# ===== API ЗАКАЗОВ - ЗАКОММЕНТИРОВАНО (зависит от корзины) =====

# @app.route('/api/orders', methods=['POST'])
# @token_required
# def create_order(current_user):
#     """Создать заказ с заглушкой оплаты"""
#     data = request.get_json()
#     payment_method = data.get('payment_method')
#     
#     if not payment_method:
#         return jsonify({'error': 'Способ оплаты обязателен'}), 400
#     
#     conn = sqlite3.connect('products.db')
#     cursor = conn.cursor()
#     
#     # Получаем корзину пользователя
#     cursor.execute('''
#         SELECT ci.product_id, ci.quantity, p.price, p.name
#         FROM cart_items ci
#         JOIN products p ON ci.product_id = p.id
#         WHERE ci.user_id = ?
#     ''', (current_user['id'],))
#     
#     cart_items = cursor.fetchall()
#     
#     if not cart_items:
#         conn.close()
#         return jsonify({'error': 'Корзина пуста'}), 400
#     
#     # Вычисляем общую сумму
#     total_amount = sum(item[1] * item[2] for item in cart_items)
#     
#     # Имитируем процесс оплаты (заглушка)
#     import time
#     import random
#     
#     # Симулируем задержку обработки платежа
#     time.sleep(1)
#     
#     # 95% успешных платежей, 5% неудачных
#     payment_success = random.random() > 0.05
#     
#     if payment_success:
#         # Создаем заказ со статусом "оплачен"
#         cursor.execute('''
#             INSERT INTO orders (user_id, total_amount, payment_method, status)
#             VALUES (?, ?, ?, ?)
#         ''', (current_user['id'], total_amount, payment_method, 'paid'))
#         
#         order_id = cursor.lastrowid
#         
#         # Добавляем элементы заказа
#         for item in cart_items:
#             cursor.execute('''
#                 INSERT INTO order_items (order_id, product_id, quantity, price)
#                 VALUES (?, ?, ?, ?)
#             ''', (order_id, item[0], item[1], item[2]))
#         
#         # Очищаем корзину
#         cursor.execute('DELETE FROM cart_items WHERE user_id = ?', (current_user['id'],))
#         
#         conn.commit()
#         conn.close()
#         
#         return jsonify({
#             'message': 'Заказ успешно оформлен и оплачен!',
#             'order_id': order_id,
#             'total_amount': total_amount,
#             'payment_status': 'success',
#             'payment_method': payment_method
#         })
#     else:
#         # Создаем заказ со статусом "ошибка оплаты"
#         cursor.execute('''
#             INSERT INTO orders (user_id, total_amount, payment_method, status)
#             VALUES (?, ?, ?, ?)
#         ''', (current_user['id'], total_amount, payment_method, 'payment_failed'))
#         
#         order_id = cursor.lastrowid
#         
#         # Добавляем элементы заказа
#         for item in cart_items:
#             cursor.execute('''
#                 INSERT INTO order_items (order_id, product_id, quantity, price)
#                 VALUES (?, ?, ?, ?)
#             ''', (order_id, item[0], item[1], item[2]))
#         
#         conn.commit()
#         conn.close()
#         
#         return jsonify({
#             'error': 'Ошибка оплаты. Попробуйте другой способ оплаты.',
#             'order_id': order_id,
#             'payment_status': 'failed'
#         }), 400

# @app.route('/api/orders', methods=['GET'])
# @token_required
# def get_orders(current_user):
#     """Получить заказы пользователя"""
#     conn = sqlite3.connect('products.db')
#     cursor = conn.cursor()
#     
#     cursor.execute('''
#         SELECT o.id, o.total_amount, o.payment_method, o.status, o.created_at
#         FROM orders o
#         WHERE o.user_id = ?
#         ORDER BY o.created_at DESC
#     ''', (current_user['id'],))
#     
#     orders = cursor.fetchall()
#     conn.close()
#     
#     orders_list = []
#     for order in orders:
#         orders_list.append({
#             'id': order[0],
#             'total_amount': order[1],
#             'payment_method': order[2],
#             'status': order[3],
#             'created_at': order[4]
#         })
#     
#     return jsonify(orders_list)

# API для личного кабинета
@app.route('/api/profile', methods=['GET'])
@token_required
def get_user_profile(current_user):
    """Получить профиль пользователя"""
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, username, email, role, first_name, last_name, phone, address, city, postal_code, created_at, updated_at
        FROM users WHERE id = ?
    ''', (current_user['id'],))
    
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return jsonify({
            'id': user[0],
            'username': user[1],
            'email': user[2],
            'role': user[3],
            'first_name': user[4] or '',
            'last_name': user[5] or '',
            'phone': user[6] or '',
            'address': user[7] or '',
            'city': user[8] or '',
            'postal_code': user[9] or '',
            'created_at': user[10],
            'updated_at': user[11]
        })
    else:
        return jsonify({'error': 'Пользователь не найден'}), 404

@app.route('/api/profile', methods=['PUT'])
@token_required
def update_user_profile(current_user):
    """Обновить профиль пользователя"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Данные не предоставлены'}), 400
    
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    
    # Обновляем только разрешенные поля
    cursor.execute('''
        UPDATE users 
        SET first_name = ?, last_name = ?, phone = ?, address = ?, city = ?, postal_code = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (
        data.get('first_name', ''),
        data.get('last_name', ''),
        data.get('phone', ''),
        data.get('address', ''),
        data.get('city', ''),
        data.get('postal_code', ''),
        current_user['id']
    ))
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Профиль успешно обновлен'})

@app.route('/api/profile/password', methods=['PUT'])
@token_required
def update_password(current_user):
    """Обновить пароль пользователя"""
    data = request.get_json()
    
    if not data or not data.get('current_password') or not data.get('new_password'):
        return jsonify({'error': 'Текущий и новый пароль обязательны'}), 400
    
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    
    # Проверяем текущий пароль
    cursor.execute('SELECT password_hash FROM users WHERE id = ?', (current_user['id'],))
    user = cursor.fetchone()
    
    if not user or not bcrypt.checkpw(data['current_password'].encode('utf-8'), user[0].encode('utf-8')):
        conn.close()
        return jsonify({'error': 'Неверный текущий пароль'}), 400
    
    # Хешируем новый пароль
    new_password_hash = bcrypt.hashpw(data['new_password'].encode('utf-8'), bcrypt.gensalt())
    
    # Обновляем пароль
    cursor.execute('''
        UPDATE users 
        SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (new_password_hash.decode('utf-8'), current_user['id']))
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Пароль успешно обновлен'})

# API для управления контентом страницы
@app.route('/api/content', methods=['GET'])
def get_page_content():
    """Получить весь контент страницы"""
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT section_name, content_key, content_value, content_type FROM page_content ORDER BY section_name, content_key')
    content_items = cursor.fetchall()
    
    conn.close()
    
    # Группируем контент по секциям
    content = {}
    for item in content_items:
        section, key, value, content_type = item
        if section not in content:
            content[section] = {}
        content[section][key] = {
            'value': value,
            'type': content_type
        }
    
    return jsonify(content)

@app.route('/api/content/<section>/<key>', methods=['GET'])
def get_content_item(section, key):
    """Получить конкретный элемент контента"""
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT content_value, content_type FROM page_content WHERE section_name = ? AND content_key = ?', (section, key))
    item = cursor.fetchone()
    
    conn.close()
    
    if item:
        return jsonify({
            'section': section,
            'key': key,
            'value': item[0],
            'type': item[1]
        })
    else:
        return jsonify({'error': 'Элемент контента не найден'}), 404

@app.route('/api/content/<section>/<key>', methods=['PUT'])
@token_required
@admin_required
def update_content_item(current_user, section, key):
    """Обновить элемент контента (только для администратора)"""
    data = request.get_json()
    
    if not data or 'value' not in data:
        return jsonify({'error': 'Необходимо указать значение'}), 400
    
    new_value = data['value']
    content_type = data.get('type', 'text')
    
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    
    # Проверяем, существует ли элемент
    cursor.execute('SELECT id FROM page_content WHERE section_name = ? AND content_key = ?', (section, key))
    existing_item = cursor.fetchone()
    
    if existing_item:
        # Обновляем существующий элемент
        cursor.execute('''
            UPDATE page_content 
            SET content_value = ?, content_type = ?, updated_at = CURRENT_TIMESTAMP
            WHERE section_name = ? AND content_key = ?
        ''', (new_value, content_type, section, key))
    else:
        # Создаем новый элемент
        cursor.execute('''
            INSERT INTO page_content (section_name, content_key, content_value, content_type)
            VALUES (?, ?, ?, ?)
        ''', (section, key, new_value, content_type))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'message': 'Контент успешно обновлен',
        'section': section,
        'key': key,
        'value': new_value,
        'type': content_type
    })

@app.route('/api/content/batch', methods=['PUT'])
@token_required
@admin_required
def update_content_batch(current_user):
    """Обновить несколько элементов контента одновременно (только для администратора)"""
    data = request.get_json()
    
    if not data or not isinstance(data, dict):
        return jsonify({'error': 'Необходимо передать объект с данными'}), 400
    
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    
    updated_items = []
    
    for section, section_data in data.items():
        if isinstance(section_data, dict):
            for key, item_data in section_data.items():
                if isinstance(item_data, dict) and 'value' in item_data:
                    value = item_data['value']
                    content_type = item_data.get('type', 'text')
                    
                    # Проверяем, существует ли элемент
                    cursor.execute('SELECT id FROM page_content WHERE section_name = ? AND content_key = ?', (section, key))
                    existing_item = cursor.fetchone()
                    
                    if existing_item:
                        # Обновляем существующий элемент
                        cursor.execute('''
                            UPDATE page_content 
                            SET content_value = ?, content_type = ?, updated_at = CURRENT_TIMESTAMP
                            WHERE section_name = ? AND content_key = ?
                        ''', (value, content_type, section, key))
                    else:
                        # Создаем новый элемент
                        cursor.execute('''
                            INSERT INTO page_content (section_name, content_key, content_value, content_type)
                            VALUES (?, ?, ?, ?)
                        ''', (section, key, value, content_type))
                    
                    updated_items.append({
                        'section': section,
                        'key': key,
                        'value': value,
                        'type': content_type
                    })
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'message': f'Обновлено {len(updated_items)} элементов контента',
        'updated_items': updated_items
    })

@app.route('/api/content/sections', methods=['GET'])
def get_content_sections():
    """Получить список всех секций контента"""
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT DISTINCT section_name FROM page_content ORDER BY section_name')
    sections = [row[0] for row in cursor.fetchall()]
    
    conn.close()
    
    return jsonify(sections)

@app.route('/api/content/section/<section>', methods=['GET'])
def get_section_content(section):
    """Получить весь контент конкретной секции"""
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT content_key, content_value, content_type FROM page_content WHERE section_name = ? ORDER BY content_key', (section,))
    items = cursor.fetchall()
    
    conn.close()
    
    content = {}
    for key, value, content_type in items:
        content[key] = {
            'value': value,
            'type': content_type
        }
    
    return jsonify(content)

if __name__ == '__main__':
    # Настройки для продакшена
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    
    app.run(debug=debug, host='0.0.0.0', port=port) 