#!/usr/bin/env python3
"""
Скрипт для миграции базы данных
Добавляет поле image_data к таблице products
"""

import sqlite3
import os

def get_db_path():
    return os.path.join(os.environ.get('RENDER_PROJECT_DIR', '.'), 'products.db')

def migrate_database():
    """Миграция базы данных для добавления поля image_data"""
    
    if not os.path.exists('products.db'):
        print("База данных не найдена. Создайте её сначала.")
        return
    
    conn = sqlite3.connect(get_db_path())
    cursor = conn.cursor()
    
    try:
        # Проверяем, существует ли поле image_data
        cursor.execute("PRAGMA table_info(products)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'image_data' not in columns:
            print("Добавляем поле image_data к таблице products...")
            cursor.execute('ALTER TABLE products ADD COLUMN image_data BLOB')
            print("Поле image_data успешно добавлено!")
        else:
            print("Поле image_data уже существует.")
        
        # Проверяем, что поле image_url может быть NULL
        cursor.execute("PRAGMA table_info(products)")
        columns_info = cursor.fetchall()
        
        image_url_column = None
        for column in columns_info:
            if column[1] == 'image_url':
                image_url_column = column
                break
        
        if image_url_column and image_url_column[3] == 1:  # NOT NULL
            print("Обновляем поле image_url, чтобы разрешить NULL значения...")
            # Создаем временную таблицу
            cursor.execute('''
                CREATE TABLE products_temp (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL,
                    price REAL NOT NULL,
                    image_url TEXT,
                    image_data BLOB,
                    category TEXT NOT NULL,
                    size TEXT,
                    material TEXT,
                    density TEXT
                )
            ''')
            
            # Копируем данные
            cursor.execute('''
                INSERT INTO products_temp (id, name, description, price, image_url, category, size, material, density)
                SELECT id, name, description, price, image_url, category, size, material, density FROM products
            ''')
            
            # Удаляем старую таблицу
            cursor.execute('DROP TABLE products')
            
            # Переименовываем новую таблицу
            cursor.execute('ALTER TABLE products_temp RENAME TO products')
            
            print("Поле image_url успешно обновлено!")
        
        conn.commit()
        print("Миграция завершена успешно!")
        
    except Exception as e:
        print(f"Ошибка при миграции: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    migrate_database()
