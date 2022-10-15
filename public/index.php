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
        $routes->add('multi_files_check', '/api/multiFiles')->controller([$this, 'checkMultfiles']);

        $routes->add('random_number', '/random/{limit}')->controller([$this, 'randomNumber']);
    }

    // public function createObject(): Response
    // {
    //     $response = $this->getContainer()->get('twig')->render('pages/objectForm.html.twig');
    //     return new Response($response);
    // }

    public function checkMultfiles(Request $request)
    {
        $logger = new Logger;
        $logger->log('alert', 'checkMultfiles call');
        // var_dump($request->files->all());
        // var_dump($request->request->all());
        // die;
        return new Response('created', 201);
        // return new JsonResponse([
        //     'errors' => [
        //         'textOnlyWithValue' => 'value is not good, refill please',
        //         'multipleCheckBoxesCheckedAndNotChecked[value1]' => 'value is not good, refill please',
        //         'radioCheckedAndNotChecked' => 'value is not good, refill please',
        //         'slectSimple' => 'value is not good, refill please',
        //     ]
        // ], 400);
        // return new Response('
        // <html><head> <meta charset="UTF-8"> <title> Data Status </title> <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"> <link rel="stylesheet" type="text/css" href="./css/style.css"> </head> <body> <header> This is an error header </header> <main> you should see the form with errors added </main> <nav> <ul> <li><a href="/">Home</a></li> <li><a href="create">Create Object</a></li> <li><a href="status">Data status</a></li> </ul> </nav> </body></html> ', 
        // 400);
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
$request = Request::createFromGlobals();
$response = $kernel->handle($request);
$response->send();
$kernel->terminate($request, $response);
