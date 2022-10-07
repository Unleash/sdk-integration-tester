#FROM webdevops/php:8.1
FROM php:8.1-fpm

RUN apt update \
    && apt install -y zlib1g-dev g++ git libicu-dev zip libzip-dev zip libpq-dev wget
COPY . /usr/src/php-integration-tester
WORKDIR /usr/src/php-integration-tester

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer


CMD [ "php", "-S", "0.0.0.0:5011", "index.php" ]
EXPOSE 5011
