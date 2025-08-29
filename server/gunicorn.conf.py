# Конфигурация Gunicorn для Render.com
import os

# Порт из переменной окружения
bind = f"0.0.0.0:{os.environ.get('PORT', 5000)}"

# Количество воркеров
workers = 2

# Таймауты
timeout = 120
keepalive = 2

# Логирование
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Перезапуск при изменениях
reload = False

# Предзагрузка приложения
preload_app = True
