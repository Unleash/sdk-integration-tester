Running locally

` php -S localhost:5011  index.php`


Building/running docker locally

```
docker build -t php-integration-tester .
docker run -p 5011:5011 -t sdk-integration-tester
```
