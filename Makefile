serve:
	@echo "Started web server on http://localhost:8775"
	@symfony serve --port=8777

sniff:
	@./vendor/bin/phpcs -n --colors --tab-width=2 --ignore=libs/workbox/*  ./public

dry-fix:
	@./vendor/bin/php-cs-fixer fix ./public --dry-run  -vv

cs-fix:
	@./vendor/bin/phpcbf -n --colors --tab-width=2 --ignore=libs/workbox/*  ./public
# 	@./vendor/bin/php-cs-fixer fix ./public -vv

inject:
	@workbox injectManifest config/workbox-dev-config.js

inject-w:
	@workbox injectManifest config/workbox-dev-config.js --watch

build:
	@workbox injectManifest config/workbox-dev-config.js

#quality must remain quiet, as far as it's used in a pre-commit hook validation

quality: sniff dry-fix
	all: check help

.PHONY: all quality serve inject inject-w build
