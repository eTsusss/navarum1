#!/usr/bin/env python3
"""
Скрипт для обновления категорий в базе данных
Заменяет 'Пальто' на 'Футболки' и удаляет 'Куртки'
"""

import sqlite3
import os

def update_categories():
    """Обновляет категории в базе данных для новых 6 категорий"""
    
    # Подключаемся к базе данных
    db_path = 'products.db'
    if not os.path.exists(db_path):
        print(f"База данных {db_path} не найдена!")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("Обновляем категории товаров...")
        
        # Обновляем товары с категорией 'Куртки' на 'Пижама' (или другую подходящую)
        cursor.execute("UPDATE products SET category = 'Пижама' WHERE category = 'Куртки'")
        jackets_updated = cursor.rowcount
        print(f"Обновлено товаров с категорией 'Куртки': {jackets_updated}")
        
        print("Обновляем контент страницы...")
        
        # Обновляем фильтры
        cursor.execute("UPDATE page_content SET content_value = 'Пальто' WHERE section_name = 'filters' AND content_key = 'coats'")
        coats_updated = cursor.rowcount
        print(f"Обновлено фильтр 'coats' на 'Пальто': {coats_updated}")
        
        # Добавляем новые фильтры
        new_filters = [
            ('filters', 'tshirts', 'Футболки', 'text'),
            ('filters', 'pajamas', 'Пижама', 'text'),
            ('filters', 'bedding', 'Постельное белье', 'text')
        ]
        
        for section, key, value, content_type in new_filters:
            cursor.execute("""
                INSERT OR REPLACE INTO page_content (section_name, content_key, content_value, content_type)
                VALUES (?, ?, ?, ?)
            """, (section, key, value, content_type))
        
        print("Добавлены новые фильтры: Футболки, Пижама, Постельное белье")
        
        # Обновляем категории
        cursor.execute("UPDATE page_content SET content_value = 'Пальто' WHERE section_name = 'categories' AND content_key = 'coats'")
        categories_updated = cursor.rowcount
        print(f"Обновлено категорию 'coats' на 'Пальто': {categories_updated}")
        
        # Добавляем новые категории
        new_categories = [
            ('categories', 'tshirts', 'Футболки', 'text'),
            ('categories', 'pajamas', 'Пижама', 'text'),
            ('categories', 'bedding', 'Постельное белье', 'text')
        ]
        
        for section, key, value, content_type in new_categories:
            cursor.execute("""
                INSERT OR REPLACE INTO page_content (section_name, content_key, content_value, content_type)
                VALUES (?, ?, ?, ?)
            """, (section, key, value, content_type))
        
        print("Добавлены новые категории: Футболки, Пижама, Постельное белье")
        
        # Сохраняем изменения
        conn.commit()
        print("✅ Все изменения успешно сохранены в базе данных!")
        
        # Показываем текущие категории
        print("\nТекущие категории товаров:")
        cursor.execute("SELECT DISTINCT category FROM products ORDER BY category")
        categories = [row[0] for row in cursor.fetchall()]
        for cat in categories:
            print(f"  - {cat}")
        
        print("\nТекущие фильтры:")
        cursor.execute("SELECT content_key, content_value FROM page_content WHERE section_name = 'filters' ORDER BY content_key")
        filters = cursor.fetchall()
        for key, value in filters:
            print(f"  - {key}: {value}")
            
    except Exception as e:
        print(f"❌ Ошибка при обновлении: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    print("🔄 Начинаем обновление категорий...")
    update_categories()
    print("🏁 Обновление завершено!")
