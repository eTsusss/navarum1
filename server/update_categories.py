#!/usr/bin/env python3
"""
Скрипт для обновления категорий в базе данных
Заменяет 'Пальто' на 'Футболки' и удаляет 'Куртки'
"""

import sqlite3
import os

def update_categories():
    """Обновляет категории в базе данных"""
    
    # Подключаемся к базе данных
    db_path = 'products.db'
    if not os.path.exists(db_path):
        print(f"База данных {db_path} не найдена!")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("Обновляем категории товаров...")
        
        # Обновляем товары с категорией 'Пальто' на 'Футболки'
        cursor.execute("UPDATE products SET category = 'Футболки' WHERE category = 'Пальто'")
        coats_updated = cursor.rowcount
        print(f"Обновлено товаров с категорией 'Пальто': {coats_updated}")
        
        # Удаляем товары с категорией 'Куртки'
        cursor.execute("DELETE FROM products WHERE category = 'Куртки'")
        jackets_deleted = cursor.rowcount
        print(f"Удалено товаров с категорией 'Куртки': {jackets_deleted}")
        
        print("Обновляем контент страницы...")
        
        # Обновляем фильтр 'coats' с 'Пальто' на 'Футболки'
        cursor.execute("UPDATE page_content SET content_value = 'Футболки' WHERE section_name = 'filters' AND content_key = 'coats'")
        filters_updated = cursor.rowcount
        print(f"Обновлено фильтров: {filters_updated}")
        
        # Удаляем фильтр 'jackets'
        cursor.execute("DELETE FROM page_content WHERE section_name = 'filters' AND content_key = 'jackets'")
        jackets_filter_deleted = cursor.rowcount
        print(f"Удалено фильтров 'jackets': {jackets_filter_deleted}")
        
        # Обновляем категорию 'coats' с 'Пальто' на 'Футболки'
        cursor.execute("UPDATE page_content SET content_value = 'Футболки' WHERE section_name = 'categories' AND content_key = 'coats'")
        categories_updated = cursor.rowcount
        print(f"Обновлено категорий: {categories_updated}")
        
        # Удаляем категорию 'jackets'
        cursor.execute("DELETE FROM page_content WHERE section_name = 'categories' AND content_key = 'jackets'")
        jackets_category_deleted = cursor.rowcount
        print(f"Удалено категорий 'jackets': {jackets_category_deleted}")
        
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
