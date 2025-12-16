# Changelog

## [1.7.2](https://github.com/ehmpathy/declastruct/compare/v1.7.1...v1.7.2) (2025-12-16)


### Bug Fixes

* **cicd:** selfbuild declastruct to selfapply ([#53](https://github.com/ehmpathy/declastruct/issues/53)) ([38eaadc](https://github.com/ehmpathy/declastruct/commit/38eaadc3b46f61e22fb3e6a296d4e9e260b59434))
* **practs:** deworm and bump to latest best ([#50](https://github.com/ehmpathy/declastruct/issues/50)) ([68268f2](https://github.com/ehmpathy/declastruct/commit/68268f299209ee7748169b8115295ad66e58a454))

## [1.7.1](https://github.com/ehmpathy/declastruct/compare/v1.7.0...v1.7.1) (2025-12-14)


### Bug Fixes

* **terms:** prefer findsert over finsert for clarity ([#48](https://github.com/ehmpathy/declastruct/issues/48)) ([96f7023](https://github.com/ehmpathy/declastruct/commit/96f7023aa148ddfb4e9631c50b951ad62f365924))

## [1.7.0](https://github.com/ehmpathy/declastruct/compare/v1.6.0...v1.7.0) (2025-12-12)


### Features

* **delete:** support deletes via declarative instruction ([#45](https://github.com/ehmpathy/declastruct/issues/45)) ([62017e9](https://github.com/ehmpathy/declastruct/commit/62017e9902ac5d7be01ff115d1ede8485375ca13))


### Bug Fixes

* **cicd:** bump to npm oidc on publish ([#46](https://github.com/ehmpathy/declastruct/issues/46)) ([5fdf2ac](https://github.com/ehmpathy/declastruct/commit/5fdf2ac608ce39d9fee779bed2ba1f3a414c393b))
* **cli:** declare wish and plan paths relative to pwd ([#43](https://github.com/ehmpathy/declastruct/issues/43)) ([e0779b4](https://github.com/ehmpathy/declastruct/commit/e0779b46d8aa4c978b470f83003a6a703d4f487c))
* **types:** recover bivariance with nullable factory, optional interface ([#47](https://github.com/ehmpathy/declastruct/issues/47)) ([ab59fc3](https://github.com/ehmpathy/declastruct/commit/ab59fc36750013bfba0224792e843b06f653d804))

## [1.6.0](https://github.com/ehmpathy/declastruct/compare/v1.5.2...v1.6.0) (2025-12-08)


### Features

* **dao:** genDeclastructDao factory for pit-of-success++ ([#42](https://github.com/ehmpathy/declastruct/issues/42)) ([fd352ec](https://github.com/ehmpathy/declastruct/commit/fd352ecbfb43239c7bffe830ebe58bf4b8ae3363))


### Bug Fixes

* **refs:** get ref should return null instead of throw on unfound resources, like a normal get ([#40](https://github.com/ehmpathy/declastruct/issues/40)) ([9db61d0](https://github.com/ehmpathy/declastruct/commit/9db61d0232de12a28729a1a971fca49ca66544d8))

## [1.5.2](https://github.com/ehmpathy/declastruct/compare/v1.5.1...v1.5.2) (2025-12-08)


### Bug Fixes

* **cicd:** bump declastruct to unblock plan ([#38](https://github.com/ehmpathy/declastruct/issues/38)) ([f101803](https://github.com/ehmpathy/declastruct/commit/f101803ee199757f445e6101981e789928114eb0))
* **cicd:** bump declastruct to unblock plan ([#39](https://github.com/ehmpathy/declastruct/issues/39)) ([66a78df](https://github.com/ehmpathy/declastruct/commit/66a78df10ec4c6b183f1ea68f7b01e4b4801d8f5))
* **sdk:** expose a generic DeclaredResource type ([#36](https://github.com/ehmpathy/declastruct/issues/36)) ([560bb8e](https://github.com/ehmpathy/declastruct/commit/560bb8eea29ca6cb68743c6f58cca4f82c62bc49))

## [1.5.1](https://github.com/ehmpathy/declastruct/compare/v1.5.0...v1.5.1) (2025-12-07)


### Bug Fixes

* **shapes:** infer TResource from TResourceClass ([#34](https://github.com/ehmpathy/declastruct/issues/34)) ([51fedfb](https://github.com/ehmpathy/declastruct/commit/51fedfbd5fed4a00f45ce829638d1e7734982c87))

## [1.5.0](https://github.com/ehmpathy/declastruct/compare/v1.4.5...v1.5.0) (2025-12-07)


### Features

* **ref:** expose dao.get.ref.byUnique,.byPrimary ([#32](https://github.com/ehmpathy/declastruct/issues/32)) ([2274bde](https://github.com/ehmpathy/declastruct/commit/2274bde0b13c45c22531ad7c95a80fea7a65c937))

## [1.4.5](https://github.com/ehmpathy/declastruct/compare/v1.4.4...v1.4.5) (2025-12-05)


### Bug Fixes

* **cicd:** revive selfbuild in .declastruct ghaction ([#30](https://github.com/ehmpathy/declastruct/issues/30)) ([5144e27](https://github.com/ehmpathy/declastruct/commit/5144e27492c8d3c8e88ec89f16c380aa3cf0db8b))

## [1.4.4](https://github.com/ehmpathy/declastruct/compare/v1.4.3...v1.4.4) (2025-12-05)


### Bug Fixes

* **plan:** omitReadonly on plan state files ([#28](https://github.com/ehmpathy/declastruct/issues/28)) ([3f6a2e9](https://github.com/ehmpathy/declastruct/commit/3f6a2e9b77811595f7616a4167571d88beb60729))

## [1.4.3](https://github.com/ehmpathy/declastruct/compare/v1.4.2...v1.4.3) (2025-12-04)


### Bug Fixes

* **deps:** bump declastruct and declapract deps ([#26](https://github.com/ehmpathy/declastruct/issues/26)) ([131a0de](https://github.com/ehmpathy/declastruct/commit/131a0deb663d4e97653dec03ea104cc8b6b2a200))

## [1.4.2](https://github.com/ehmpathy/declastruct/compare/v1.4.1...v1.4.2) (2025-12-04)


### Bug Fixes

* **deps:** revert to peer deps for dobjs ([#24](https://github.com/ehmpathy/declastruct/issues/24)) ([5085a97](https://github.com/ehmpathy/declastruct/commit/5085a9736e7cbca5ec49991ae4899788071fc4cd))

## [1.4.1](https://github.com/ehmpathy/declastruct/compare/v1.4.0...v1.4.1) (2025-12-04)


### Bug Fixes

* **practs:** bump to latest best ([#22](https://github.com/ehmpathy/declastruct/issues/22)) ([bb9cf1b](https://github.com/ehmpathy/declastruct/commit/bb9cf1bad56af1117670f694ac1d02c9aea4eb3f))

## [1.4.0](https://github.com/ehmpathy/declastruct/compare/v1.3.1...v1.4.0) (2025-11-30)


### Features

* **obs:** add spinners on apply and plan ([#20](https://github.com/ehmpathy/declastruct/issues/20)) ([1964d23](https://github.com/ehmpathy/declastruct/commit/1964d2394ab4c2fc22da0eb8dbe9948afcbed41b))

## [1.3.1](https://github.com/ehmpathy/declastruct/compare/v1.3.0...v1.3.1) (2025-11-29)


### Bug Fixes

* **diff:** display diffs in desired order of keys ([bbb12a1](https://github.com/ehmpathy/declastruct/commit/bbb12a139254e1bf2ea1b7a8c37dfb5022d3ef6d))
* **docs:** bump readme terms ([c776b69](https://github.com/ehmpathy/declastruct/commit/c776b695b1757ac889427bc4ab4d91ba0c8ae59a))
* **practs:** bump to latest best ([d3aa503](https://github.com/ehmpathy/declastruct/commit/d3aa503d37020ea9b93ffcb401d27de74ac72978))

## [1.3.0](https://github.com/ehmpathy/declastruct/compare/v1.2.0...v1.3.0) (2025-11-28)


### Features

* **obs:** emit began and ended logs on apply per resource ([b56c8fd](https://github.com/ehmpathy/declastruct/commit/b56c8fdd8567f21f5b6033b8918fd2234f8a9935))

## [1.2.0](https://github.com/ehmpathy/declastruct/compare/v1.1.12...v1.2.0) (2025-11-28)


### Features

* **yolo:** support apply --plan yolo mode, for autoapprove with intuitive risk callout ([e4bd538](https://github.com/ehmpathy/declastruct/commit/e4bd53858ade700e4abe68ed92da4e6784fa48e0))

## [1.1.12](https://github.com/ehmpathy/declastruct/compare/v1.1.11...v1.1.12) (2025-11-28)


### Bug Fixes

* **diff:** compute diff after omitReadonly ([d58d408](https://github.com/ehmpathy/declastruct/commit/d58d4082d761ad001b6f5d86b7b99d153a02a719))

## [1.1.11](https://github.com/ehmpathy/declastruct/compare/v1.1.10...v1.1.11) (2025-11-28)


### Bug Fixes

* **refs:** ensure dao interfaces support getByPrimary with metadata primary keys ([58224a7](https://github.com/ehmpathy/declastruct/commit/58224a79429c7c1a86196446c489c05d158a3de3))

## [1.1.10](https://github.com/ehmpathy/declastruct/compare/v1.1.9...v1.1.10) (2025-11-27)


### Bug Fixes

* **deps:** bump domain-objects dep to latest best ([b5dac72](https://github.com/ehmpathy/declastruct/commit/b5dac72c1bbb2e8b849d6362394d2d537109e225))
* **tests:** extend test coverage to explicitly cover metadata optional primary key resources ([776e8ed](https://github.com/ehmpathy/declastruct/commit/776e8ed428277a96ae51fcd9b08a7b32db735449))

## [1.1.9](https://github.com/ehmpathy/declastruct/compare/v1.1.8...v1.1.9) (2025-11-24)


### Bug Fixes

* **cicd:** propogate test fix ([14b13b7](https://github.com/ehmpathy/declastruct/commit/14b13b7b72044a912da87c983c7a59ca7d691e28))

## [1.1.8](https://github.com/ehmpathy/declastruct/compare/v1.1.7...v1.1.8) (2025-11-24)


### Bug Fixes

* **logs:** standardize all in sync message ([492e5e2](https://github.com/ehmpathy/declastruct/commit/492e5e25a0969ec59f1551002f7e74f89743c25b))

## [1.1.7](https://github.com/ehmpathy/declastruct/compare/v1.1.6...v1.1.7) (2025-11-24)


### Bug Fixes

* **diff:** omit metadata and serialize before decide diff ([c8143cb](https://github.com/ehmpathy/declastruct/commit/c8143cb24d5f6660e8248db77a0e35022655bddc))
* **obs:** log when everything is in sync ([c7cedb7](https://github.com/ehmpathy/declastruct/commit/c7cedb7e28edb1151702d9adae5768fc31b86956))
* **obs:** show diffs on plan ([0ad1f9a](https://github.com/ehmpathy/declastruct/commit/0ad1f9acd3ace8e85e0714a8ce7438c22d2e82d9))

## [1.1.6](https://github.com/ehmpathy/declastruct/compare/v1.1.5...v1.1.6) (2025-11-24)


### Bug Fixes

* **obs:** improve cli logs ([4f103ac](https://github.com/ehmpathy/declastruct/commit/4f103ac15a71d50e22da10969d8df2cd0ef1b98f))

## [1.1.5](https://github.com/ehmpathy/declastruct/compare/v1.1.4...v1.1.5) (2025-11-24)


### Bug Fixes

* **deps:** bump to latest of domain-objects for cross-version compat ([ee84051](https://github.com/ehmpathy/declastruct/commit/ee840515a9dd55731ebd95ab4c4096137ecf364e))

## [1.1.4](https://github.com/ehmpathy/declastruct/compare/v1.1.3...v1.1.4) (2025-11-24)


### Bug Fixes

* **obs:** add increased observability around getUniqueIdentifier ([0f4a796](https://github.com/ehmpathy/declastruct/commit/0f4a79641568dd204e5429d98dee343c23f1de9a))

## [1.1.3](https://github.com/ehmpathy/declastruct/compare/v1.1.2...v1.1.3) (2025-11-23)


### Bug Fixes

* **context:** passthrough the provider context correctly ([1ef91a1](https://github.com/ehmpathy/declastruct/commit/1ef91a1b42390ad2304abc4d81bc6ea04721fbd1))

## [1.1.2](https://github.com/ehmpathy/declastruct/compare/v1.1.1...v1.1.2) (2025-11-23)


### Bug Fixes

* **cli:** ensure the binary is available for use ([1d253f2](https://github.com/ehmpathy/declastruct/commit/1d253f2fab59abdbf7870f4cacad27f0d2151f4d))

## [1.1.1](https://github.com/ehmpathy/declastruct/compare/v1.1.0...v1.1.1) (2025-11-23)


### Bug Fixes

* **docs:** improve readme ([447071f](https://github.com/ehmpathy/declastruct/commit/447071fd7f99765ecd5eca5df4f91ac5ee363c4d))

## [1.1.0](https://github.com/ehmpathy/declastruct/compare/v1.0.0...v1.1.0) (2025-11-23)


### Features

* **behave:** add behavior desired ([5c00155](https://github.com/ehmpathy/declastruct/commit/5c0015560cd3937c1d2815b60c1c571d60ae2647))
* **cli:** expose plan and apply cli commands ([d84e4cb](https://github.com/ehmpathy/declastruct/commit/d84e4cb8bc6fd48cc18bd98bedb80fb472004520))
* **domain:** declare domain.objects based on blueprint ([8d19d11](https://github.com/ehmpathy/declastruct/commit/8d19d114bbf6011eecf1fe1cbf05b34de6b283f6))

## 1.0.0 (2025-06-24)


### Features

* **init:** initialize based on domain-glossary-price ([e0fa28a](https://github.com/ehmpathy/declastruct/commit/e0fa28a2d4d779aad580dd19220e48266ed8a14b))

## [1.0.1](https://github.com/ehmpathy/declastruct/compare/v1.0.0...v1.0.1) (2025-06-24)


### Bug Fixes

* **readme:** add examples of usage ([5008b12](https://github.com/ehmpathy/declastruct/commit/5008b129cf299c7c4ede5ab4dac8a42b979fa3eb))

## 1.0.0 (2025-06-23)


### Features

* **init:** initialize based on domain-glossary-price ([1f9e2ec](https://github.com/ehmpathy/declastruct/commit/1f9e2ecefb46028f75348aed8a5f9e3528eb5c1e))
