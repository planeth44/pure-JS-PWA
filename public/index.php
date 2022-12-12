<?php 

use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Kernel as BaseKernel;
use Symfony\Component\HttpKernel\Log\Logger;
use Symfony\Component\Routing\Loader\Configurator\RoutingConfigurator;
use Symfony\Bundle\FrameworkBundle\Controller\TemplateController;

require __DIR__.'/../vendor/autoload.php';

class Kernel extends BaseKernel
{
    use MicroKernelTrait;

    public function registerBundles(): array
    {
        // dd($this->getEnvironment());
        return [
            new Symfony\Bundle\FrameworkBundle\FrameworkBundle(),
            new \Symfony\Bundle\TwigBundle\TwigBundle(),
        ];
    }

    protected function configureContainer(ContainerConfigurator $c): void
    {
        // PHP equivalent of config/packages/framework.yaml
        $c->extension(
            'framework', [
            'secret' => 'S0ME_SECRET'
            ],
        );
    }

    protected function configureRoutes(RoutingConfigurator $routes): void
    {
        $routes->add('home', '/')
            ->controller(TemplateController::class)
            ->defaults(
                [
                'template'  => 'pages/index.html.twig',
                'maxAge'    => 86400,
                'sharedAge' => 86400,
                'private' => true,
                ]
            );
        $routes->add('header', '/header')
            ->controller(TemplateController::class)
            ->defaults(
                [
                'template'  => 'partials/header.html.twig',
                'maxAge'    => 86400,
                'sharedAge' => 86400,
                'private' => true,
                ]
            );
        $routes->add('footer', '/footer')
            ->controller(TemplateController::class)
            ->defaults(
                [
                'template'  => 'partials/footer.html.twig',
                'maxAge'    => 86400,
                'sharedAge' => 86400,
                'private' => true,
                ]
            );
        $routes->add('edit', '/edit')
            ->controller(TemplateController::class)
            ->defaults(
                [
                'template'  => 'pages/edit.html.twig',
                'maxAge'    => 86400,
                'sharedAge' => 86400,
                'private' => true,
                'context' => [
                    'title' => 'Add “a Thing” to indexedDB or edit it',
                    ]
                ]
            );
        $routes->add('list', '/list')
            ->controller(TemplateController::class)
            ->defaults(
                [
                'template'  => 'pages/list.html.twig',
                'maxAge'    => 86400,
                'sharedAge' => 86400,
                'private' => true,
                'context' => [
                    'title' => 'List “the Things” in indexedDB',
                    ]
                ]
            );
        $routes->add('failed', '/failed')
            ->controller(TemplateController::class)
            ->defaults(
                [
                'template'  => 'pages/failed.html.twig',
                'maxAge'    => 86400,
                'sharedAge' => 86400,
                'private' => true,
                'context' => [
                    'title' => 'List the failed “Things” in indexedDB',
                    ]
                ]
            );
        $routes->add('show', '/show')
            ->controller(TemplateController::class)
            ->defaults(
                [
                'template'  => 'pages/show.html.twig',
                'maxAge'    => 86400,
                'sharedAge' => 86400,
                'private' => true,
                'context' => [
                    'title' => 'Display “a Things” from indexedDB',
                    ]
                ]
            );
        $routes->add('ops', '/ops')
            ->controller(TemplateController::class)
            ->defaults(
                [
                'template'  => 'pages/ops.html.twig',
                'maxAge'    => 86400,
                'sharedAge' => 86400,
                'private' => true,
                'context' => [
                    'title' => 'only for dev',
                    ]
                ]
            );
        $routes->add('check', '/check')
            ->controller([$this, 'check']);
        $routes->add('new_models', '/api/models')
            ->controller([$this, 'newModel'])
            ->methods(['POST']);

        $routes->add('new_file', '/api/file')
            ->controller([$this, 'newFile'])
            ->methods(['PUT']);

        $routes->add('multi_files_check', '/api/multiFiles')->controller([$this, 'checkMultfiles']);
        $routes->add('random_number', '/random/{limit}')->controller([$this, 'randomNumber']);
    }

    public function check(): Response
    {
        return new Response();
    }

    // public function newModel(Request $request): Response
    public function newModel(Request $request): JsonResponse
    {
        // return new Response('<p>some gibberish</p>', 400);
        
        return new JsonResponse(array_column(
                json_decode($request->getContent(), true), 
                'uuid'
        ), 201);
    }

    public function newFile(Request $request): JsonResponse
    // public function newFile(Request $request): Response
    {
        /*
        return new Response('<p>some html error content</p>', 400);
        return new JsonResponse([], 400);
        return new JsonResponse([], 500);
        */
        // dd($request->headers->all());
        return new JsonResponse(
            ['uuid' => $request->headers->get('x-fileuuid')]
        , 201);
    }

    public function checkMultfiles(Request $request)
    {
        $logger = new Logger;
        $logger->log('alert', 'checkMultfiles call');
        // var_dump($request->files->all());
        // var_dump($request->request->all());
        // die;
        return new Response('created', 201);
    }

    public function randomNumber(int $limit): JsonResponse
    {
        return new JsonResponse(
            [
            'number' => random_int(0, $limit),
            ]
        );
    }

}

$kernel = new Kernel('dev', true);
/*
    use code below in prod
    $kernel = new Kernel('prod', false);
 */
$request = Request::createFromGlobals();
$response = $kernel->handle($request);
$response->send();
$kernel->terminate($request, $response);
