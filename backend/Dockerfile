FROM php:8.2-apache

# ✅ 直接删除冲突的 MPM 配置文件，而不是用 a2dismod
# 这样 entrypoint 无法恢复它们
RUN rm -f /etc/apache2/mods-enabled/mpm_event.conf \
          /etc/apache2/mods-enabled/mpm_event.load \
          /etc/apache2/mods-enabled/mpm_worker.conf \
          /etc/apache2/mods-enabled/mpm_worker.load \
    && ln -sf /etc/apache2/mods-available/mpm_prefork.conf \
              /etc/apache2/mods-enabled/mpm_prefork.conf \
    && ln -sf /etc/apache2/mods-available/mpm_prefork.load \
              /etc/apache2/mods-enabled/mpm_prefork.load

RUN apt-get update && apt-get install -y libssl-dev \
    && docker-php-ext-install pdo pdo_mysql

RUN a2enmod rewrite

COPY . /var/www/html/backend/

RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

CMD bash -c "sed -i \"s/Listen 80/Listen \${PORT:-8080}/g\" /etc/apache2/ports.conf \
    && sed -i \"s/:80>/:\${PORT:-8080}>/g\" /etc/apache2/sites-available/000-default.conf \
    && apache2-foreground"
