OUTPUT_DIR = ./builds
GIT_COMMIT = `git rev-parse HEAD | cut -c1-7`
VERSION = $(shell git describe --tags)
BUILD_OPTIONS = -ldflags "-X main.Version=$(VERSION)"

ifeq ($(DEV), 1)
	BUILD_OPTIONS += -tags dev
	WEBPACK_MODE = development
else
	WEBPACK_MODE = production
endif

export CGO_ENABLED=0

gotty: main.go assets server/*.go webtty/*.go backend/*.go Makefile
	go build ${BUILD_OPTIONS}

docker:
	docker build . -t gotty-bash:$(VERSION)

.PHONY: all docker assets
assets: bindata/static/js/gotty.js.map \
	bindata/static/js/gotty.js \
	bindata/static/index.html \
	bindata/static/icon.svg \
	bindata/static/favicon.ico \
	bindata/static/css/index.css \
	bindata/static/css/xterm.css \
	bindata/static/css/xterm_customize.css \
	bindata/static/manifest.json \
	bindata/static/icon_192.png \
	bindata/static/fonts/BlexMonoNerdFontMono-Regular.ttf \
	bindata/static/fonts/BlexMonoNerdFontMono-Medium.ttf \
	bindata/static/fonts/BlexMonoNerdFontMono-Italic.ttf \
	bindata/static/fonts/BlexMonoNerdFontMono-MediumItalic.ttf

all: gotty

bindata/static bindata/static/css bindata/static/js bindata/static/fonts:
	mkdir -p $@

bindata/static/index.html: resources/index.html | bindata/static
	cp "$<" "$@"

bindata/static/icon.svg: resources/icon.svg | bindata/static
	cp "$<" "$@"

bindata/static/favicon.ico: resources/favicon.ico | bindata/static
	cp "$<" "$@"

bindata/static/manifest.json: resources/manifest.json | bindata/static
	cp "$<" "$@"

bindata/static/icon_192.png: resources/icon_192.png | bindata/static
	cp "$<" "$@"

bindata/static/css/index.css: resources/index.css | bindata/static/css
	cp "$<" "$@"

bindata/static/css/xterm_customize.css: resources/xterm_customize.css | bindata/static/css
	cp "$<" "$@"

bindata/static/css/xterm.css: js/node_modules/@xterm/xterm/css/xterm.css | bindata/static/css
	cp "$<" "$@"

bindata/static/fonts/BlexMonoNerdFontMono-Regular.ttf: resources/fonts/BlexMonoNerdFontMono-Regular.ttf | bindata/static/fonts
	cp "$<" "$@"

bindata/static/fonts/BlexMonoNerdFontMono-Medium.ttf: resources/fonts/BlexMonoNerdFontMono-Medium.ttf | bindata/static/fonts
	cp "$<" "$@"

bindata/static/fonts/BlexMonoNerdFontMono-Italic.ttf: resources/fonts/BlexMonoNerdFontMono-Italic.ttf | bindata/static/fonts
	cp "$<" "$@"

bindata/static/fonts/BlexMonoNerdFontMono-MediumItalic.ttf: resources/fonts/BlexMonoNerdFontMono-MediumItalic.ttf | bindata/static/fonts
	cp "$<" "$@"

js/node_modules/@xterm/xterm/dist/xterm.css:
	cd js && \
	npm install

bindata/static/js/gotty.js.map bindata/static/js/gotty.js: js/src/* | js/node_modules/webpack
	cd js && \
	npx webpack --mode=$(WEBPACK_MODE)

js/node_modules/webpack:
	cd js && \
	npm install

README-options:
	./gotty --help | sed '1,/GLOBAL OPTIONS/ d' > options.txt.tmp
	sed -f README.md.sed -i README.md
	rm options.txt.tmp

tools:
	go install github.com/mitchellh/gox@latest
	go install github.com/tcnksm/ghr@latest

test:
	if [ `go fmt $(go list ./... | grep -v /vendor/) | wc -l` -gt 0 ]; then echo "go fmt error"; exit 1; fi
	go test ./...

cross_compile:
	GOARM=5 gox -os="darwin linux freebsd netbsd openbsd solaris" -arch="386 amd64 arm arm64" -osarch="!darwin/386" -osarch="!darwin/arm" $(BUILD_OPTIONS) -output "${OUTPUT_DIR}/pkg/{{.OS}}_{{.Arch}}/{{.Dir}}"

targz:
	mkdir -p ${OUTPUT_DIR}/dist
	cd ${OUTPUT_DIR}/pkg/; for osarch in *; do (cd $$osarch; tar zcvf ../../dist/gotty_${VERSION}_$$osarch.tar.gz ./*); done;

shasums:
	cd ${OUTPUT_DIR}/dist; sha256sum * > ./SHA256SUMS

release-artifacts: gotty cross_compile targz shasums

release:
	ghr -draft ${VERSION} ${OUTPUT_DIR}/dist # -c ${GIT_COMMIT} --delete --prerelease -u sorenisanerd -r gotty ${VERSION}

clean:
	rm -fr gotty builds js/dist bindata/static js/node_modules

addcontributors:
	-gh issue list -s all -L 1000 --json author -t "$$(/bin/echo -e '{{ range . }}{{ .author.login }}\n{{ end }}')" | sort | uniq | xargs -Ifoo -t all-contributors add foo bug --commitTemplate '<%= (newContributor ? "Add" : "Update") %> @<%= username %> as a contributor'
	-gh pr list -s all -L 1000 --json author -t "$$(/bin/echo -e '{{ range . }}{{ .author.login }}\n{{ end }}')" | sort | uniq | xargs -Ifoo -t all-contributors add foo code --commitTemplate '<%= (newContributor ? "Add" : "Update") %> @<%= username %> as a contributor'
