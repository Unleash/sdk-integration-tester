<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;
use Unleash\Client\Configuration\UnleashContext;
use Unleash\Client\UnleashBuilder;

require 'vendor/autoload.php';
error_reporting(E_ALL & ~E_DEPRECATED & ~E_WARNING);

$API_KEY = getenv('UNLEASH_API_TOKEN');
$API_URL = getenv('UNLEASH_URL');

$app = new \Slim\App;

$unleash = UnleashBuilder::create()
    ->withAppName('php-integration-tester')
    ->withInstanceId('php-integration-tester')
    ->withAppUrl($API_URL)
    ->withHeader('Authorization', $API_KEY)
    ->build();

$app->get('/ready', function (Request $request, Response $response, array $args) {
    $data = array('status' => 'ok');
    return $response->withJson($data, 200);
});
$app->post('/is-enabled', function (Request $request, Response $response, array $args) {
    global $unleash;
    global $API_KEY;
    global $API_URL;
    $body = $request->getParsedBody();
    $context = getContext($body);
    $data = array(
        'test_url' => $API_URL,
        'test' => $API_KEY,
        'name' => $body['toggle'],
        'enabled' => $unleash->isEnabled($body['toggle'], $context),
        'context' => $body['context']);
    return $response->withJson($data, 200);
});
$app->post('/variant', function (Request $request, Response $response, array $args) {
    global $unleash;

    $body = $request->getParsedBody();
    $context = getContext($body);
    $data = array(
        'name' => $body['toggle'],
        'enabled' => $unleash->getVariant($body['toggle'], $context),
        'context' => $body['context']);
    return $response->withJson($data, 200);
});
$app->run();


function getContext($body)
{
    $context = (new UnleashContext())
        ->setCurrentUserId($body['context']['userId'])
        ->setIpAddress($body['context']['remoteAddress'])
        ->setEnvironment($body['context']['environment'])
        ->setCurrentTime($body['context']['currentTime'])
        ->setSessionId($body['context']['sessionId']);
    return $context;
}
