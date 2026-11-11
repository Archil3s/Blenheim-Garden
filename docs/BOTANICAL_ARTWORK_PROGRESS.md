# Botanical artwork handoff

Audited main at d4f130950586d19f8c4df74e1bc3d11a4ff75756.

- The live JSON catalogues contain 429 unique Kings Seeds IDs and 279 unique Rasmussen IDs. The 441 and 137 counts in the source audit refer to the supplied source sets. Reconcile missing or expanded IDs before using the source counts as gallery denominators.
- All ten approved Rasmussen paths in the source manifest exist. No originals or mappings were changed.
- The first pending Kings Seeds ID is amaranth-garnet-red. The ImageGen capability check produced a draft that touches the canvas edge and has not undergone two-reference QA. It is excluded from accepted assets.
- Resume with the exact cultivar photo and an approved style reference. Complete and validate the first ten pending IDs in catalogue order before integrating and pushing the batch.
- Batch 01 passed the production build and 28 focused browser checks across desktop, laptop, tablet and a 390 px touch viewport. All 20 PNG files decode and have unique SHA-256 hashes within their size class. Cloudflare deployment succeeded for commit cf8f2846df1f8bf3690c1e2787c77aabc543e26d (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42599261113).

## Batch 01

- Kings Seeds | amaranth-garnet-red | generated_qa_passed | master and gallery PNGs exported under public/plant-icons/generated/kings-seeds | photo https://www.winnowseedco.ca/product-page/amaranth-garnet-red | branching red panicles, alternate bronze leaves and red stem match the cultivar reference | PNGs decode at 512 and 128 with full alpha bounds 93,46,328,420 and 23,12,83,105; mobile rendering verified | local, integrated in /test-garden.
- Style reference: public/assets/icons/rasmussen/approved/001_7-pot-jonah-yellow.png. This verified original was used for illustration style only.
- Kings Seeds | amaranth-green-red | generated_qa_passed | master and gallery PNGs exported under public/plant-icons/generated/kings-seeds | photo https://www.kingsseeds.co.nz/products/amaranth-green-red | green margins and burgundy centres match V8000; leaf-stage silhouette distinct from Garnet Red | decoded at 512 and 128; alpha bounds 47,50,419,413 and 11,13,106,104; mobile rendering verified | local, integrated in /test-garden.
- Kings Seeds | artichoke-green-globe | generated_qa_passed | master and gallery PNGs exported under public/plant-icons/generated/kings-seeds | photo https://www.kingsseeds.co.nz/products/artichoke-green-globe | closed globe bud, broad green bracts and lobed leaf match V8028; first render rejected for exterior haze | alpha bounds and PNG dimensions validated; mobile rendering verified | local, integrated in /test-garden.

- Kings Seeds | asparagus-mary-washington | generated_qa_passed | master and gallery PNGs exported under public/plant-icons/generated/kings-seeds | photo https://www.kingsseeds.co.nz/products/asparagus-mary-washington | thick green spears with closed purple-tinged tips match V8031; first render rejected for edge proximity | decoded at 512 and 128 with alpha bounds 68,46,377,420 and 17,12,95,105; mobile rendering verified | local, integrated in /test-garden.
- Kings Seeds | asparagus-pacific-challenger-f1 | generated_qa_passed | master and gallery PNGs exported | https://www.kingsseeds.co.nz/products/asparagus-pacific-challenger-f1 | upright, uniform green spears match V8388; rejected first render for haze | 512 and 128 decoded, alpha bounds 192,47,129,419 and 48,12,33,105 | integrated in /test-garden.
- Kings Seeds | asparagus-pacific-purple-f1 | generated_qa_passed | master and gallery PNGs exported | https://www.kingsseeds.co.nz/products/asparagus-pacific-purple-f1 | burgundy stems and pointed purple tips match V8402 | 512 and 128 decoded, alpha bounds 133,47,248,418 and 33,12,63,105 | integrated in /test-garden.
- Kings Seeds | asparagus-pea | generated_qa_passed | master and gallery PNGs exported | https://www.kingsseeds.co.nz/products/asparagus-pea | scarlet legume flowers and compact leafy habit match V8033; winged pod visible | 512 and 128 decoded, alpha bounds 48,47,415,419 and 12,12,104,105 | integrated in /test-garden.
- Kings Seeds | bean-asian-winged | generated_qa_passed | master and gallery PNGs exported | https://www.kingsseeds.co.nz/products/bean-asian-winged | corrugated winged pods match V8034 | 512 and 128 decoded, alpha bounds 105,46,304,420 and 26,12,77,105 | integrated in /test-garden.
- Kings Seeds | bean-asian-yard-long | generated_qa_passed | master and gallery PNGs exported | https://www.kingsseeds.co.nz/products/bean-asian-yard-long | pencil-thin hanging pods match V8055 | 512 and 128 decoded, alpha bounds 194,46,125,420 and 48,12,33,105 | integrated in /test-garden.
- Kings Seeds | bean-climbing-bicolour-pean | generated_qa_passed | master and gallery PNGs exported | https://www.heritagefoodcrops.org.nz/heirloom-beans/ (Bi-colour Pean photo) | rounded ivory and oxblood dry seeds match exact heritage cultivar HFC035 | 512 and 128 decoded, alpha bounds 46,72,420,369 and 12,18,105,93 | integrated in /test-garden.

## Batch 02

- Kings Seeds | bean-climbing-cornplanter-purple | generated_qa_passed | master and gallery PNGs exported | https://www.kingsseeds.co.nz/products/bean-climbing-cornplanter-purple | elongated dark purple-black mature seeds match HFC032 | both dimensions and alpha bounds validated | integrated in /test-garden.

- Kings Seeds | bean-climbing-hopi-black-pinto | generated_qa_passed | master and gallery PNGs exported | https://www.heritagefoodcrops.org.nz/heirloom-beans/ | ivory seeds with black flecks and a near-black variant match the Trust photo; background halo removed with ImageGen | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | bean-climbing-hopi-purple-string | generated_qa_passed | master and gallery PNGs exported | https://www.heritagefoodcrops.org.nz/heirloom-beans/ | pink-mauve oblong seeds with black lengthwise streaks match the cultivar photo; halo removed with ImageGen | decoded at 512 and 128 with alpha bounds 47,91,418,329 and 12,23,105,83 | integrated in /test-garden.
- Kings Seeds | bean-climbing-lima-del-papa | generated_qa_passed | master and gallery PNGs exported | https://www.heritagefoodcrops.org.nz/heirloom-beans/ | flattened crescent seeds and chestnut marbling match the cultivar photo; halo removed with ImageGen | decoded at 512 and 128 with alpha bounds 46,95,420,322 and 12,24,105,81 | integrated in /test-garden.
- Kings Seeds | bean-climbing-mangere-pole | generated_qa_passed | master and gallery PNGs exported | https://www.heritagefoodcrops.org.nz/heirloom-beans/ | slim straight ivory seeds match Mangere Pole reference | decoded at 512 and 128 with alpha bounds 46,164,419,185 and 12,41,105,47 | integrated in /test-garden.
- Kings Seeds | bean-climbing-rydal-a-yellow | generated_qa_passed | master and gallery PNGs exported | https://www.kingsseeds.co.nz/products/bean-climbing-rydal-a-yellow | dry seed burgundy and near-black colour variation matches HFC042 | decoded at 512 and 128 with alpha bounds 46,65,420,382 and 12,17,105,95 | integrated in /test-garden.
- Kings Seeds | bean-climbing-shiny-fardenlosa | generated_qa_passed | master and gallery PNGs exported | https://www.heritagefoodcrops.org.nz/heirloom-beans/ | plump glossy ivory curved seed forms distinguish it from slender Mangere Pole | decoded at 512 and 128 with alpha bounds 46,47,419,419 and 12,12,105,105 | integrated in /test-garden.
- Kings Seeds | bean-climbing-volcanic | generated_qa_passed | master and gallery PNGs exported | https://www.heritagefoodcrops.org.nz/heirloom-beans/ | tapered tan dry seeds match Volcanic reference; halo removed with ImageGen | decoded at 512 and 128, alpha bounds 47,152,419,209 and 12,38,105,53 | integrated in /test-garden.
- Kings Seeds | bean-climbing-yoeme-purple-string | generated_qa_passed | master and gallery PNGs exported | https://www.heritagefoodcrops.org.nz/heirloom-beans/ | muted plum with pale lengthwise bands matches Yoeme photo | decoded at 512 and 128, alpha bounds 47,153,418,207 and 12,38,105,53 | integrated in /test-garden.
- Kings Seeds | bean-dwarf-amish | generated_qa_passed | master and gallery PNGs exported | https://www.heritagefoodcrops.org.nz/heirloom-beans/ | near-black narrow seeds with tan flecks match Amish Dwarf photo | decoded at 512 and 128, alpha bounds 47,53,418,408 and 12,13,105,103 | integrated in /test-garden.

Batch 02 passed the production build and 28 focused Playwright checks. Cloudflare deployment succeeded for commit 21fec5a55c18af63b56d86a1694ad0bfdc774fce (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42601425393).


## Batch 03

- Kings Seeds | bean-dwarf-berrgold-improved | generated_qa_passed | master and gallery PNGs exported | https://www.kingsseeds.co.nz/products/bean-dwarf-berrgold-improved | golden slender wax pods match V8038 | decoded at 512 and 128 with alpha bounds 115,47,283,418 and 29,12,71,105 | integrated in /test-garden.
- Kings Seeds | bean-dwarf-black-valentine | generated_qa_passed | master and gallery PNGs exported | https://www.diggers.com.au/products/bean-black-valentine | pale green pods, light pink flower and black seed with pale eye match the cultivar reference | decoded at 512 and 128 with alpha bounds 72,46,368,420 and 18,12,93,105 | integrated in /test-garden.
- Kings Seeds | bean-dwarf-borlotto-fire-tongue | generated_qa_passed | master and gallery PNGs exported | https://www.kingsseeds.co.nz/products/bean-dwarf-borlotto-fire-tongue | broad pods and cream seeds with burgundy flame markings match V8039 | decoded at 512 and 128 with alpha bounds 47,66,419,379 and 11,17,106,95 | integrated in /test-garden.
- Kings Seeds | bean-dwarf-cannellino | generated_qa_passed | master and gallery PNGs exported | https://www.kingsseeds.co.nz/products/bean-dwarf-cannellino | plump green shelling pods and ivory seeds match V8040 | decoded at 512 and 128, alpha bounds 66,46,380,419 and 16,12,96,105 | integrated in /test-garden.
- Kings Seeds | bean-dwarf-colour-combo | generated_qa_passed | master and gallery PNGs exported | https://www.kingsseeds.co.nz/products/bean-dwarf-colour-combo | yellow, green and violet slender pods match V8042 | decoded at 512 and 128, alpha bounds 69,47,374,419 and 17,12,94,105 | integrated in /test-garden.
- Kings Seeds | bean-dwarf-cranberry | generated_qa_passed | master and gallery PNGs exported | https://www.kingsseeds.co.nz/products/bean-dwarf-cranberry | cream oval seeds with cranberry flecks and broken bands match HFC038 | decoded at 512 and 128, alpha bounds 47,83,419,347 and 12,21,105,87 | integrated in /test-garden.
- Kings Seeds | bean-dwarf-fin-de-bagnols | generated_qa_passed | master and gallery PNGs exported | https://www.kingsseeds.co.nz/products/bean-dwarf-fin-de-bagnols | narrow green filet pods match V8043 | decoded at 512 and 128, alpha bounds 60,46,391,420 and 15,12,98,105 | integrated in /test-garden.
- Kings Seeds | bean-dwarf-kaiapoi-red | generated_qa_passed | master and gallery PNGs exported | https://www.heritagefoodcrops.org.nz/heirloom-beans/ | oblong crimson dry seeds match Kaiapoi Red photo | decoded at 512 and 128, alpha bounds 46,97,419,319 and 12,24,105,81 | integrated in /test-garden.
- Kings Seeds | bean-dwarf-mayocoba | generated_qa_passed | master and gallery PNGs exported | https://shop.woodlandfoods.com/products/mayocoba-beans/c-23/p-17423 | plump oval buttery yellow dry seeds match Mayocoba photo | decoded at 512 and 128, alpha bounds 47,80,418,352 and 12,20,105,89 | integrated in /test-garden.
- Kings Seeds | bean-dwarf-purple-tee-pee | generated_qa_passed | master and gallery PNGs exported | https://www.kingsseeds.co.nz/products/bean-dwarf-purple-tee-pee | slender violet pods match V8044 | decoded at 512 and 128, alpha bounds 91,47,331,419 and 23,12,83,105 | integrated in /test-garden.

Batch 03 passed the production build and 28 focused Playwright checks. Cloudflare deployment succeeded for commit 7a2d4025d5e00a5efa6bb1fec41c4cd699d82293 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42603413759).


## Batch 04

- Kings Seeds | bean-dwarf-roquefort | generated_qa_passed | replacement two-pod master and gallery exported | https://www.kingsseeds.co.nz/products/bean-dwarf-roquefort | V8045 pale wax pods; replacement avoids detached flecks in draft | 512 and 128 decoded with alpha bounds 78,46,357,420 and 20,12,89,105 | integrated in /test-garden.
- Kings Seeds | bean-dwarf-top-crop | generated_qa_passed | master and gallery PNGs exported | https://www.kingsseeds.co.nz/products/bean-dwarf-top-crop | medium green rounded pods match V8046 | PNG dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | bean-dwarf-xera-select | generated_qa_passed | master and gallery PNGs exported | https://www.kingsseeds.co.nz/products/bean-dwarf-xera-select | straight slender green pods match V8047 | PNG dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | bean-runner-blue-lake | generated_qa_passed | master and gallery PNGs exported | https://www.heritagefoodcrops.org.nz/heirloom-beans/ | narrow ivory dry seeds match Blue Lake photo | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | bean-runner-blue-shackamaxon | generated_qa_passed | master and gallery PNGs exported | https://www.heritagefoodcrops.org.nz/heirloom-beans/ | angular glossy blue-black seeds match Blue Shackamaxon photo | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | bean-runner-cherokee-trail-of-tears | generated_qa_passed | master and gallery PNGs exported | https://www.heritagefoodcrops.org.nz/heirloom-beans/ | oblong dark seeds with soft depressions match the cultivar photo | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | bean-runner-good-mother-stallard | generated_qa_passed | master and gallery PNGs exported | https://www.heritagefoodcrops.org.nz/heirloom-beans/ | rounded seeds and dense burgundy marbling match the cultivar photo | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | bean-runner-holy-climbing | generated_qa_passed | master and gallery exported | https://www.heritagefoodcrops.org.nz/heirloom-beans/ | ivory seeds with black eye markings match Angel Bean | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | bean-runner-hopi-beige | generated_qa_passed | master and gallery exported | https://www.heritagefoodcrops.org.nz/heirloom-beans/ | beige mottling and rust eye match cultivar | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | bean-runner-indian-hannah | generated_qa_passed | master and gallery exported | https://www.heritagefoodcrops.org.nz/heirloom-beans/ | blocky mixed speckled, patched and black seeds match cultivar | dimensions and alpha bounds validated | integrated in /test-garden.

Batch 04 passed the production build and 28 focused Playwright checks. Cloudflare deployment succeeded for commit b1234d8879d7eed69cc2ee0ed5a4df13bfcb8f82 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42682608667).

## Batch 05

- Kings Seeds | bean-runner-italian-flat | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/bean-runner-italian-flat | broad flat green pods with wavy seams match V8049 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | bean-runner-king-of-the-blues | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/bean-runner-king-of-the-blues | long curved indigo-purple pods match V8050 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | bean-runner-lazy-housewife | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/bean-runner-lazy-housewife | replacement shows elongated pale green pods with subtle seed swellings matching V8051 | dimensions and alpha bounds validated | integrated in /test-garden.


- Kings Seeds | bean-runner-neekar-golden | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/bean-runner-neekar-golden | long, straight golden wax pods match V8053 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | bean-runner-ojo-de-cabra | generated_qa_passed | master and gallery exported | https://www.heritagefoodcrops.org.nz/heirloom-beans/ | gray-beige seeds with brown stripes and dark eye rings match the cultivar photo | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | bean-runner-purple-star | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/bean-runner-purple-star | broad plum seeds with pale flecks match HFC014 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | bean-runner-scarlet | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/bean-runner-scarlet | red flowers and green wavy pods match V8054 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | beet-perpetual-spinach | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/beet-perpetual-spinach | green stalks and elongated leaves match V8282 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | beetroot-bulls-blood | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/beetroot-bulls-blood | burgundy foliage and red stems match V8056 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | beetroot-chioggia | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/beetroot-chioggia | red root and pale concentric rings match V8057 | dimensions and alpha bounds validated | integrated in /test-garden.

Batch 05 passed the production build and 28 focused Playwright checks. Cloudflare deployment succeeded for commit 9c19fd030c15fb3468630f28e0a6e5f4235ecf95 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42685318321).

## Batch 06

- Kings Seeds | beetroot-colour-blend | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/beetroot-colour-blend | mixed gold, red and pink beets and ringed slice match blend photo | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | beetroot-cylindra | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/beetroot-cylindra | elongated red cylindrical roots match V8060 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | beetroot-golden-detroit | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/beetroot-golden-detroit | round orange roots and yellow-veined green leaves match V8061 | dimensions and alpha bounds validated | integrated in /test-garden.

- Kings Seeds | beetroot-pablo-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/beetroot-pablo-f1 | uniform round crimson roots and red-veined green foliage match V8389 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | beetroot-ruby-queen | generated_qa_passed | master and gallery exported | https://survivalgardenseeds.com/products/ruby-queen-beet-seeds | ruby globe root with broad shoulder and burgundy stems matches cultivar photo | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | broad-bean-coles-prolific | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/broad-bean-coles-prolific | shorter olive green pods and pale beans match V8036 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | broad-bean-superaguadulce | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/broad-bean-superaguadulce | elongated green pods and long row of seeds match V8037 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | broccoli-chinese-gai-lan | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/broccoli-chinese-gai-lan | thick stems and broad dark leaves match V8002 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | broccoli-mclaren-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/broccoli-mclaren-f1 | dense blue-green dome and glaucous foliage match V8415 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | broccoli-sprouting-summer-purple | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/broccoli-sprouting-summer-purple | revised closed purple buds and narrow shoots match V8064 | dimensions and alpha bounds validated | integrated in /test-garden.

Batch 06 passed the production build and 28 focused Playwright checks. Cloudflare deployment succeeded for commit d1860751e4db37c69254e43daa685b7f5308f4f6 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42688032469).


## Batch 07

- Kings Seeds | broccoli-tasty-stems-f1 | generated_qa_passed | replacement master and gallery exported | https://www.kingsseeds.co.nz/products/broccoli-tasty-stems-f1 | three long stems and open branching heads of closed buds match V8066 | dimensions and alpha bounds validated; review fine edges at gallery scale | integrated in /test-garden.

- Kings Seeds | broccoli-sprouting-winter-rudolph | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/broccoli-sprouting-winter-rudolph | compact clustered purple heads match V8065 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | broccoli-summer-green-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/broccoli-summer-green-f1 | dense slate-green crowns with lobed contours match V8067 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | broccoli-winter-green-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/broccoli-winter-green-f1 | fine blue-green dome and lobed waxy leaves match V8068 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | brussels-sprouts-jade-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/brussels-sprouts-jade-f1 | dense staggered round green sprouts along a pale stalk match V8069 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | burdock-takinogawa-long | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/burdock-takinogawa-long | wavy olive basal foliage matches V8072 supplier photo | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | pumpkin-butternut-butterscotch-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/pumpkin-butternut-butterscotch-f1 | compact caramel rind and golden cut flesh match V8236 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | butternut-waltham | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/butternut-waltham | elongated neck and buff flecked rind match V8423 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cabbage-chinese-one-kilo-slowbolt-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cabbage-chinese-one-kilo-slowbolt-f1 | tall dark crinkled head and white ribs match V8004 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cabbage-chinese-wa-wa-tsai-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cabbage-chinese-wa-wa-tsai-f1 | compact pale savoyed heads and broad ivory ribs match V8005 | dimensions and alpha bounds validated | integrated in /test-garden.

Batch 07 passed the production build and all 28 focused Playwright checks.
Cloudflare deployment succeeded for commit 61b58aac044cd46ce0611e031b95584806ebec71 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42691200257).

## Batch 08

- Kings Seeds | cabbage-copenhagen-market | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cabbage-copenhagen-market | spherical light-green head and broad folded top leaf match V8074 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cabbage-kilaprince-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cabbage-kilaprince-f1 | waxy blue-green head and ivory cross section match V8416 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cabbage-mini-red-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cabbage-mini-red-f1 | compact purple head and ruffled indigo wrapper leaves match V8076 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cabbage-red-acre | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cabbage-red-acre | slate wrapper leaves and magenta head match V8455 supplier listing photo | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cabbage-space-saver-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cabbage-space-saver-f1 | compact pale center and dark green radial leaves match V8077 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cabbage-vertus-savoy | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cabbage-vertus-savoy | deeply blistered slate-green leaves and olive heart match V8079 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | caigua | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/caigua | pale green curved tapered pods match V8080 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cape-gooseberry | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cape-gooseberry | golden berry and split papery husk match V8081 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | capsicum-bell-colour-mix | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/capsicum-bell-colour-mix | four colours and lobed fruit match V8082 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cabbage-sugarloaf-mix | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/cdn/shop/files/V8420-1.png | pale green and purple conical heads match V8420 | dimensions and alpha bounds validated | integrated in /test-garden.

Batch 08 passed the production build and all 28 focused Playwright checks.
Cloudflare deployment succeeded for commit 8b581a885bf647e56137bc822f1364c29d69ec7c (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42694691005).

## Batch 09

- Kings Seeds | capsicum-californian-wonder-golden | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/capsicum-californian-wonder-golden | golden yellow blocky lobed fruit matches V8084 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | capsicum-cornos-red | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/capsicum-cornos-red | long tapered red bull horns and green ripening shoulder match V8088 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | capsicum-cornos-yellow | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/capsicum-cornos-yellow | glossy yellow tapered bull horn matches current listing V8434 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | capsicum-high-health-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/capsicum-high-health-f1 | slender green fruit and long thin stems match V8091 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | capsicum-marconi-red | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/capsicum-marconi-red | elongated blunt lobed red fruit matches V8089 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | capsicum-marconi-yellow | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/capsicum-marconi-yellow | angular golden fruit and blunt ends match V8427 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | capsicum-purple-beauty-1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/capsicum-purple-beauty-1 | compact blue-violet lobes and green stalk match V8396 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | capsicum-orange-bell-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/cdn/shop/files/V8086-1.jpg | orange blocky lobes and short stalk match V8086 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | capsicum-red-bell-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/capsicum-red-bell-f1 | scarlet blocky fruit and lance-shaped leaf match V8087 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | capsicum-yellow-banana | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/capsicum-yellow-banana | pale yellow-green tapered fruit matches V8092 | dimensions and alpha bounds validated | integrated in /test-garden.

Batch 09 passed the production build and all 28 focused Playwright checks.
Cloudflare deployment succeeded for commit 266181f54188543f023504955e1a34599344eab9 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42697731165).

## Batch 10

- Kings Seeds | carob-tree | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/carob-tree | flattened curved chocolate-brown pods match V8094 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | carrot-amsterdam-sprint | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/carrot-amsterdam-sprint | slender cylindrical orange roots with rounded tips match V8095 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | carrot-black-nebula | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/carrot-black-nebula | near-black root and dark purple cross section match V8359 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | carrot-kuroda-improved | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/carrot-kuroda-improved | broad conical root and pale growth rings match V8096 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | carrot-nutri-orange | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/carrot-nutri-orange | long slender orange roots and fine taper match V8387 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | carrot-nutri-purple-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/carrot-nutri-purple-f1 | dusty plum skin and pale taper match V8385 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | carrot-nutri-red-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/carrot-nutri-red-f1 | rose-red root and lighter longitudinal core match V8386 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | carrot-paris-market | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/carrot-paris-market | orange globes with slender taproots match V8097 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | carrot-nutri-white-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/cdn/shop/files/V8383-1.jpg | ivory root and long smooth taper match V8383 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | carrot-nutri-yellow-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/carrot-nutri-yellow-f1 | straw-yellow root with a fine curved taper matches V8384 | dimensions and alpha bounds validated | integrated in /test-garden.

Batch 10 passed the production build and all 28 focused Playwright checks.
Cloudflare deployment succeeded for commit 708149bce681cd0900c74dfec8d6945b0cac8765 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42700762312).

## Batch 11

- Kings Seeds | carrot-rainbow-blend-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/carrot-rainbow-blend-f1 | five root colours and tapered shapes match V8099 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | carrot-scarlet-nantes | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/carrot-scarlet-nantes | warm orange cylindrical roots and rounded taper match V8100 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | carrot-resistafly-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/carrot-resistafly-f1 | pale orange cylindrical root and blunt tip match V8418 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | carrot-touchon | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/carrot-touchon | coral orange cylindrical roots and fine tips match V8101 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cauliflower-all-the-year-round | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cauliflower-all-the-year-round | rounded chalk-white curd clusters and green wrappers match V8102 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cauliflower-clementine-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cauliflower-clementine-f1 | orange curd dome and slate wrapper leaves match V8417 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cauliflower-confetti | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cauliflower-confetti | ivory orange green and purple curds match V8421 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | broccoflower-geum-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/broccoflower-geum-f1 | chartreuse spiral cone clusters match V8063 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cauliflower-summer-love-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cauliflower-summer-love-f1 | small white curd and tall blue-gray wrappers match V8445 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cauliflower-sprouting-fioretto-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cauliflower-sprouting-fioretto-f1 | branching pale-green stems and ivory curds match V8390 | dimensions and alpha bounds validated | integrated in /test-garden.

Batch 11 passed the production build and all 28 focused Playwright checks.
Cloudflare deployment succeeded for commit e27abd829f219135049fb7208aea695b1302d129 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42703942625).

## Batch 12

- Kings Seeds | cauliflower-violet-sicilian | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cauliflower-violet-sicilian | deep violet curd and blue-green leaves match V8106 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | celeriac-mars | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/celeriac-mars | knobbly cream root and ribbed stems match V8107 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cauliflower-winter-love-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/cdn/shop/files/V8446-W.png | ivory dome and flared sage-green wrappers match V8446 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | celery-for-cutting | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/celery-for-cutting | thin ribbed stalks and serrated leaves match V8109 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | celery-tall-utah | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/celery-tall-utah | thick chartreuse ribbed stalks match V8406 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | celtuce | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/celtuce | scarred pale stalk and narrow crinkled leaves match V8007 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | chilli-mild-anaheim | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/chilli-mild-anaheim | broad glossy green pods and blunt taper match V8122 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | chia | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/chia | narrow pale bracted spike and opposite leaves match V8458 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | chilli-medium-asian-fire-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/chilli-medium-asian-fire-f1 | slender smooth scarlet pods match V8116 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | chilli-hot-bhut-jolokia | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/chilli-hot-bhut-jolokia | wrinkled scarlet pod and pointed taper match V8113 | dimensions and alpha bounds validated | integrated in /test-garden.

Batch 12 passed the production build and all 28 focused Playwright checks.
Cloudflare deployment succeeded for commit 47455425a1c94d7a5ba8ea229b03ffbafe362b0c (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42707496513).

## Batch 13

- Kings Seeds | chilli-carolina-reaper | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/chilli-carolina-reaper | squat rumpled red pod and stinger match V8397 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | chilli-cayenne-flame | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/chilli-cayenne-flame | slender rippled red and green pods match V8117 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | chilli-hot-habanero-red | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/chilli-hot-habanero-red | smooth red lantern and tapered lobes match V8114 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | chilli-medium-habanero-yellow | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/chilli-medium-habanero-yellow | yellow glossy irregular lobed pods match V8118 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | chilli-padron | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/chilli-padron | compact emerald pods and irregular contours match V8439 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | chilli-hungarian-yellow-wax | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/chilli-hungarian-yellow-wax | pale butter-yellow pod and blunt taper match V8124 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | chilli-mild-pancho-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/chilli-mild-pancho-f1 | smooth green body and blunt tip match V8126 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | chilli-pepperoncini | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/chilli-pepperoncini | folded green and scarlet pods with blunt tips match V8440 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | chilli-poblano | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/chilli-poblano | broad dark-green shoulder and pointed taper match V8441 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | chilli-mild-serrano | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/chilli-mild-serrano | smooth narrow red pod and blunt taper match V8127 | dimensions and alpha bounds validated | integrated in /test-garden.

Batch 13 passed the production build and all 28 focused Playwright checks.
Cloudflare deployment succeeded for commit 0d811156807053af46ca4ead80be3f2a2478cfa0 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42729968949).

## Batch 14

- Kings Seeds | chilli-mild-shishito-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/chilli-mild-shishito-f1 | olive-green creased pod and hooked blunt tip match V8128 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | chilli-hot-spicy-blend | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/chilli-hot-spicy-blend | varied round and tapered fruit shapes match V8115 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | chilli-tabasco | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/chilli-tabasco | small tapered red orange and yellow-green pods match V8412 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | chilli-medium-thai-hot-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/chilli-medium-thai-hot-f1 | upright red and pale green pods match V8121 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | choy-sum | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/choy-sum | smooth oval leaves and four-petalled yellow flowers match V8008 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | collard-greens | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/collard-greens | broad green leaves and pale branching ribs match V8129 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | corn-bicolour-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/corn-bicolour-f1 | gold and scattered ivory kernels match V8130 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | corn-painted-mountain | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/corn-painted-mountain | loose matte multicolour kernels match HFC016 | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | corn-glass-gem | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/corn-glass-gem | glossy translucent multicolour kernels and dry husk | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | corn-golden-sweet-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/corn-golden-sweet-f1 | uniform golden kernels and short green husk | dimensions and alpha bounds validated | integrated in /test-garden.

Batch 14 passed the production build and all 28 focused Playwright checks.
Cloudflare deployment succeeded for commit 996689b902329b5b2fe4f85c1e45e93be8d87b52 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42737589068).

## Batch 15

- Kings Seeds | corn-popcorn-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/corn-popcorn-f1 | gold popping kernels and papery husk | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | corn-salad-verte-de-cambrai | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/corn-salad-verte-de-cambrai | rounded glossy green leaves in a dense rosette | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cress-american-upland | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cress-american-upland | small rounded leaflets along branching stems | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cucumber-amira-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cucumber-amira-f1 | slender dark-green fruit hanging beneath broad leaves | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cucumber-cornichon-de-paris | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cucumber-cornichon-de-paris | two crossed bumpy pickling cucumbers, using the supplier photo shared with Homemade Pickles | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cucumber-crunchy-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cucumber-crunchy-f1 | short dark-green snack cucumbers on a leafy vine | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cucumber-crystal-apple | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cucumber-crystal-apple | pale cream apple cucumbers with a yellow blossom | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cucumber-homemade-pickles | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cucumber-homemade-pickles | medium-green bumpy cucumbers on a flowering vine, using the supplier photo shared with Cornichon de Paris | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cucumber-lebanese | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cucumber-lebanese | short plump green fruit with light ridges | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cucumber-medici-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cucumber-medici-f1 | slender straight green fruit with pale longitudinal striping | dimensions and alpha bounds validated | integrated in /test-garden.

Batch 15 passed the production build and all 28 focused Playwright checks.
Cloudflare deployment succeeded for commit 5ab68ea8c9ce90f9662766623a195d66bc04791e (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42739445342).

## Batch 16

- Kings Seeds | cucumber-poona-kheera | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cucumber-poona-kheera | rust-brown netted skin | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cucumber-spacemaster | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cucumber-spacemaster | dark compact fruit and yellow blossom | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cucumber-tasty-queen-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cucumber-tasty-queen-f1 | slender tapered ridged green fruit | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | cucumber-telegraph-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/cucumber-telegraph-f1 | long hanging dark green cucumber | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | eggplant-ebony | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/eggplant-ebony | glossy black ovoid fruits | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | eggplant-fiancee-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/eggplant-fiancee-f1 | cluster of narrow violet fruit with pale streaks | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | eggplant-midnight-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/eggplant-midnight-f1 | long glossy aubergine with green calyx | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | eggplant-thai-green-egg-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/eggplant-thai-green-egg-f1 | round ivory-green fruit with striped shoulders | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | eggplant-thai-purple | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/eggplant-thai-purple | round violet fruit with mottling | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | endive-ruffec-green-curled | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/endive-ruffec-green-curled | deeply curled green rosette with pale center | dimensions and alpha bounds validated | integrated in /test-garden.

Batch 16 passed the production build and all 28 focused Playwright checks.
Cloudflare deployment succeeded for commit a69d8c98c4abf6045748811f2657276c7ba6e22d (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42740971915).

## Batch 17

- Kings Seeds | fennel-milano | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/fennel-milano | pale rounded bulbs and feathery green fronds | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | goji-berry | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/goji-berry | glossy red berries on a leafy sprig | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | gourd-asian-loki-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/gourd-asian-loki-f1 | long smooth pale green gourds | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | melon-bitter-vanguard-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/melon-bitter-vanguard-f1 | pale green elongated bitter melon with shallow ribs | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | gourd-bitter-melon-keelen-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/gourd-bitter-melon-keelen-f1 | dark green pointed bitter melon with densely warted skin | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | gourd-large-bottle | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/gourd-large-bottle | round pale green bases with bottle necks | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | gourd-large-mix | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/gourd-large-mix | smooth pale and dark mottled bottle shapes | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | luffa | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/luffa | tan dried loofahs with porous cross sections | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | luffa-angled-long-ridge-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/luffa-angled-long-ridge-f1 | long green gourds with angular ribs | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | jicama | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/jicama | round tan tubers with thin roots | dimensions and alpha bounds validated | integrated in /test-garden.

Batch 17 passed the production build and all 28 focused Playwright checks.
Cloudflare deployment succeeded for commit c1b6ac6044a72c28b176595da600beacf1f1be75 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42742566723).

## Batch 18

- Kings Seeds | kale-blue-ridge-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/kale-blue-ridge-f1 | densely curled olive green rosette | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | kale-cavolo-nero | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/kale-cavolo-nero | elongated blue green blistered leaves | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | kale-noble | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/kale-noble | broad green leaves with prominent pale veins | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | kale-red-russian | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/kale-red-russian | lobed light green leaves and purple stems | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | kale-scarlet | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/kale-scarlet | deep purple curly foliage | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | kale-squire | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/kale-squire | tight green rosette with finely curled margins | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | kiwano-horned-melon | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/kiwano-horned-melon | mottled gold-green fruit with prominent horns | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | kohlrabi-early-purple-vienna | generated_qa_passed | master and gallery exported | https://www.holmesseed.com/early-purple-vienna/ | purple swollen stem with radiating petioles | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | kohlrabi-grand-duke-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/kohlrabi-grand-duke-f1 | pale green globe with long green petioles | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | leek-sentinel-f1 | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/leek-sentinel-f1 | straight white shank and upright blue-green leaves | dimensions and alpha bounds validated | integrated in /test-garden.

Batch 18 passed the production build and all 28 focused Playwright checks.
Cloudflare deployment succeeded for commit d129a17d1635ff9bd1a5df7efe8c1c41e0c5eb7a (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42744239288).

## Batch 19

- Kings Seeds | leek-winter-giant | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/leek-winter-giant | thick white shanks with blue-green leaves | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | lettuce-buttercrunch | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/lettuce-buttercrunch | soft layered green butterhead | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | lettuce-coral-green | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/lettuce-coral-green | bright green frilled coral rosette | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | lettuce-coral-red | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/lettuce-coral-red | burgundy finely curled coral rosette | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | lettuce-cos | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/lettuce-cos | upright elongated green cos leaves | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | lettuce-drunken-woman-fringed-head | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/lettuce-drunken-woman-fringed-head | green centre with burgundy fringed margins | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | lettuce-great-lakes | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/lettuce-great-lakes | compact crisphead with scalloped outer leaves | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | lettuce-leaf-blend | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/lettuce-leaf-blend | mixed burgundy and lime leaves | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | lettuce-little-gem | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/lettuce-little-gem | small compact green head with pale heart | dimensions and alpha bounds validated | integrated in /test-garden.
- Kings Seeds | lettuce-oakleaf-green | generated_qa_passed | master and gallery exported | https://www.kingsseeds.co.nz/products/lettuce-oakleaf-green | rounded oak-shaped lime leaves | dimensions and alpha bounds validated | integrated in /test-garden.

Batch 19 passed the production build and all 28 focused Playwright checks.
Cloudflare deployment succeeded for commit b5a3a32fedf58ecc48b5bcfb77a3d6296b81ea8f (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42745865757).

## Batch 20

- Kings Seeds | lettuce-oakleaf-red | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8394-1_1e41694f-dca8-4386-8450-3852696f1f4d_1080x.jpg?v=1720660867 | compared with the exact cultivar photo and validated alpha bounds.
- Kings Seeds | lettuce-red-caesar | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8183-1_4136b71f-ef9f-46be-be58-b788987cffe8_1080x.jpg?v=1725596040 | compared with the exact cultivar photo and validated alpha bounds.
- Kings Seeds | lettuce-salanova-butterhead-green | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8405-1_590515b8-16b5-4797-aa34-aa1763d4128b_1080x.png?v=1752445834 | compared with the exact cultivar photo and validated alpha bounds.
- Kings Seeds | lettuce-salanova-butterhead-red | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8395-1_d3dd6034-72d0-4d6f-a865-d76050eccaec_1080x.jpg?v=1720660869 | compared with the exact cultivar photo and validated alpha bounds.
- Kings Seeds | lettuce-salanova-leaf-green | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8460-W_1080x.png?v=1784972497 | compared with the exact cultivar photo and validated alpha bounds.
- Kings Seeds | lettuce-salanova-leaf-red | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8461-W.png | compared with the exact cultivar photo and validated alpha bounds.
- Kings Seeds | melon-charantais | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8436-W_433f3055-4a86-4ee2-a52a-e9787f7cf590_1080x.png?v=1784972330 | compared with the exact cultivar photo and validated alpha bounds.
- Kings Seeds | melon-honeydew-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8422-1_7ef91907-c789-46db-bb9b-9efe2660dc09_1080x.png?v=1752445835 | compared with the exact cultivar photo and validated alpha bounds.
- Kings Seeds | melon-medley-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8400-1_1080x.png?v=1721993175 | compared with the exact cultivar photo and validated alpha bounds.
- Kings Seeds | melon-tuscan-delight-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8197-1_35a9e951-458b-4a30-80a2-5a992654e0d8_1080x.jpg?v=1725596849 | compared with the exact cultivar photo and validated alpha bounds.

Batch 20 passed the production build. The focused Playwright suite passed 27 checks on the first run, and the remaining phone gallery check passed three consecutive targeted reruns.

Cloudflare deployment succeeded for Batch 20 commit 212a77a (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42795534694).

## Batch 21

- Kings Seeds | mesclun-italian-blend | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/products/V8198-1_1080x.png?v=1688013177 | compared with the exact supplier photo and validated alpha bounds.
- Kings Seeds | mesclun-kale-blend | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8199-1_93870567-e029-43f4-b099-d86687cbf9f6_1080x.jpg?v=1725596928 | compared with the exact supplier photo and validated alpha bounds.
- Kings Seeds | mesclun-mild-blend | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/products/V8201-1_1080x.png?v=1688013345 | compared with the exact supplier photo and validated alpha bounds.
- Kings Seeds | mesclun-oriental-blend | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8202-1_a795bed1-8fd8-4781-ad34-4783011d48c5_1080x.jpg?v=1725597049 | compared with the exact supplier photo and validated alpha bounds.
- Kings Seeds | mesclun-original-blend | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8203-1_48e2614b-0df8-4c84-8c15-7b40fbf54913_1080x.jpg?v=1725597112 | compared with the exact supplier photo and validated alpha bounds.
- Kings Seeds | mesclun-red-blend | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8204-1_cdda5019-51cd-4106-b3a9-c28ea1774a9e_1080x.jpg?v=1725597144 | compared with the exact supplier photo and validated alpha bounds.
- Kings Seeds | mesclun-winter-blend | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8205-1_63c73b9e-8510-415b-aef6-8f375fde2abe_1080x.jpg?v=1725597204 | compared with the exact supplier photo and validated alpha bounds.
- Kings Seeds | mibuna-green-spray | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8012-1_98818975-4b44-429f-adb4-71ef8246c757_1080x.jpg?v=1721600811 | compared with the exact supplier photo and validated alpha bounds.
- Kings Seeds | miners-lettuce | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8206-1_7a14f18d-dcdb-4e24-a1cc-436c97ee0902_1080x.jpg?v=1725597233 | compared with the exact supplier photo and validated alpha bounds.
- Kings Seeds | mizuna | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8013-1_8ac5607b-3989-4301-990c-ea51e03c8ab3_1080x.jpg?v=1721600850 | compared with the exact supplier photo and validated alpha bounds.

Batch 21 passed the production build and all 28 focused Playwright checks.

Cloudflare deployment succeeded for Batch 21 commit ed74dd2 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42798103136).

## Batch 22

- Kings Seeds | mizuna-red-coral | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/Mizuna_Red_Coral_-_Candy_1080x.png?v=1778457594 | exact supplier photo and alpha bounds checked.
- Kings Seeds | mizuna-red-kingdom-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8015-1_caa1fec8-5d55-4e2f-a0be-b700755470ef_1080x.jpg?v=1721600904 | exact supplier photo and alpha bounds checked.
- Kings Seeds | moringa-horseradish-tree | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8208-1_79e00ab3-5ff1-46e5-b225-082547058567_1080x.jpg?v=1725597298 | exact supplier photo and alpha bounds checked.
- Kings Seeds | mustard-giant-red | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8017-1_22f18bf6-c450-40e5-96ac-c4d864014b99_1080x.jpg?v=1721600979 | exact supplier photo and alpha bounds checked.
- Kings Seeds | okra-clemson-spineless | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8210-1_97cf2ef5-9e69-41e8-bba0-4fa6eff170c3_1080x.jpg?v=1725597345 | exact supplier photo and alpha bounds checked.
- Kings Seeds | okra-millionaire-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8211-1_2683e23b-d9fa-456c-9da3-91e8e90c515a_1080x.jpg?v=1725597376 | exact supplier photo and alpha bounds checked.
- Kings Seeds | onion-italian-long-keeper | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/products/V8213-1_1080x.png?v=1688015157 | exact supplier photo and alpha bounds checked.
- Kings Seeds | onion-pearl-drop | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8214-1_05f64e74-974f-4417-9f8e-0b469f85b6a4_1080x.jpg?v=1725597509 | exact supplier photo and alpha bounds checked.
- Kings Seeds | onion-pukekohe-long-keeper | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8375-1_05db4dd7-9182-4c64-97e8-7d311290a8b9_1080x.jpg?v=1725603547 | exact supplier photo and alpha bounds checked.
- Kings Seeds | onion-purplette | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8215-1_c06e85b9-a032-4a9a-a43e-c0cb37ffb8ad_1080x.jpg?v=1720748852 | exact supplier photo and alpha bounds checked.

Batch 22 passed the production build and focused Playwright suite.

Cloudflare deployment succeeded for Batch 22 commit 36e3798 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42800913088).

## Batch 23

- Kings Seeds | onion-red-brunswick | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8216-1_41373639-d486-44c5-b13c-7f2799205c0d_1080x.jpg?v=1725597585 | exact supplier photo and alpha bounds checked.
- Kings Seeds | onion-shallot-zebrune | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8220-1_1d623113-843d-4424-8004-1b27f6966cb0_1080x.jpg?v=1725597714 | exact supplier photo and alpha bounds checked.
- Kings Seeds | organic-bean-dwarf-top-crop | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8046-1_37dfb8e2-ab71-4103-a069-84c7798c630b_1080x.jpg?v=1721601929 | exact supplier photo and alpha bounds checked.
- Kings Seeds | organic-bean-runner-cobra | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6003-1_3f191879-613d-42dc-8abe-b96e6caac8a6_1080x.jpg?v=1721351373 | exact supplier photo and alpha bounds checked.
- Kings Seeds | organic-silverbeet-erbette | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6065-1_1ffe37a9-d40a-4cf9-8597-64af2ba74d81_1080x.jpg?v=1721355530 | exact supplier photo and alpha bounds checked.
- Kings Seeds | organic-beetroot-detroit-dark-red | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6005-1_d49b7e2e-d75f-4e02-97c2-34e78b44d76f_1080x.jpg?v=1721351544 | exact supplier photo and alpha bounds checked.
- Kings Seeds | organic-belstar-broccoli-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6006-1_77913c72-78c9-4984-ae2c-664067c23e3b_1080x.jpg?v=1721351579 | exact supplier photo and alpha bounds checked.
- Kings Seeds | organic-broccoli-raab-spring-rapini | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6008-1_169932ae-7ff0-46cc-8a03-1baf961ced75_1080x.jpg?v=1721351657 | exact supplier photo and alpha bounds checked.
- Kings Seeds | organic-broccoli-waltham | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6007-1_b7110884-6b37-46f9-b2ab-f34d62666789_1080x.jpg?v=1721351613 | exact supplier photo and alpha bounds checked.
- Kings Seeds | organic-brussels-sprouts-igor-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6009-1_6001442f-530c-4f81-9212-00f35337a10b_1080x.jpg?v=1721351692 | exact supplier photo and alpha bounds checked.

Batch 23 passed the production build. Playwright passed 27 checks on the first attempt, and the phone gallery alignment check passed on retry.

Cloudflare deployment succeeded for Batch 23 commit 14941fa (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42803533931).

## Batch 24 reference preparation

- Kings Seeds | organic-cauliflower-belot-f1 | reference_found | Agrosemens exact cultivar photo | https://www.agrosemens.com/jardin-graine-bio-choux-chou-fleur/215-Semences-Graines-Semence-Bio-Chou-Fleur.html
- Kings Seeds | organic-cauliflower-liria-f1 | reference_found | De Bolster exact cultivar photo | https://www.bolster.eu/cauliflower-liria-f1-brassica-oleracea/p9157

## Batch 24

- Kings Seeds | organic-butternut-honeynut | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6055-W_1080x.png?v=1784974002 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-cabbage-golden-acre | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6116-1_4f62f6b8-4891-43d6-9f1a-b92682b562f9_1080x.png?v=1752445819 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-capsicum-california-wonder-red | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6091-1_1080x.png?v=1688788245 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-capsicum-cornito-mix-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6104-1_c42694a0-63cd-4d10-ba29-76fc6dba853a_1080x.jpg?v=1720660858 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-capsicum-lunchbox-mix | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6105-1_329c7439-6c21-400b-a4ed-17c66488b814_1080x.jpg?v=1720660858 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-carrot-berlicum | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6014-1_1ccd06cd-6f2a-4783-898d-59f4820258b3_1080x.jpg?v=1721351840 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-carrot-tendersweet | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6015-1_b9d4f4e4-12b3-41b3-a84c-a45e03ad7438_1080x.jpg?v=1721351894 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-cauliflower-belot-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.agrosemens.com/215-5887-thickbox_default/Semences-Graines-Semence-Bio-Chou-Fleur.jpg | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-cauliflower-liria-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.bolster.eu/media/images/1442_dbweb.jpg?1749107409 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-cauliflower-romanesco-early | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6016-1_0657fedb-64b5-456b-8e51-3db1f4b5bc30_1080x.jpg?v=1721351925 | exact cultivar photo and alpha bounds checked.

## Batch 25

- Kings Seeds | organic-celery-tango | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/1_5759f70c-af0a-4f67-8259-5d3c76cdae59_1080x.png?v=1701996554 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-chilli-cayenne-red | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6094-1_1080x.png?v=1688788254 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-chilli-jalapeno-early | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6095-1_1080x.png?v=1688788248 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-corn-early-gem | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6126-W_1080x.png?v=1784972759 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-cress-moss-curled | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/products/O6022-1_1080x.png?v=1688020013 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-cucumber-paris-pickles | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6023-1_effee9d3-8341-4a08-94a2-8b8a195ea836_1080x.jpg?v=1721352275 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-cucumber-tendergreen | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6024-2_1080x.jpg?v=1721352311 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-eggplant-black-beauty | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6027-W_1080x.png?v=1784973962 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-eggplant-long-purple | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6028-1_06cac7cd-2fd0-40bd-b044-d24ae1773969_1080x.jpg?v=1721352651 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-kale-tuscan-black | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6034-1_37ec5e23-c2f8-414d-a3c6-30a0010df070_1080x.jpg?v=1721352925 | exact cultivar photo and alpha bounds checked.

## Batch 26

- Kings Seeds | organic-kale-westerland | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6096-1_95a0e872-f31e-44ca-965c-7edfe9baa322_1080x.jpg?v=1721354121 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-kohlrabi-purple-vienna | generated_qa_passed | 512 px master and 128 px gallery | https://kwekerijkweek.be/cdn/shop/files/KOOLRABI_purplevienna_1.png?v=1690287827 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-leek-carentan-giant | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6036-1_bbc8546d-254a-41cb-923a-1248b07324f3_1080x.jpg?v=1721353019 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-lettuce-iceberg | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6042-1_7bbf0683-7a40-4723-95b6-7b16e03b610b_1080x.jpg?v=1721353201 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-lettuce-little-caesar | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8363-1_1080x.png?v=1688853411 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-lettuce-lollo-bionda | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6117-1_f650a5be-ef5f-4dca-be8e-eb52a99e0b95_1080x.png?v=1752445835 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-lettuce-frill-lollo-rossa | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6041-1_24d2b2d1-0730-4fc2-b949-a3b450043b33_1080x.jpg?v=1721353173 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-lettuce-butterhead-merveille-des-quatre-saisons | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6038-1_cb8991e7-1ef5-496a-a8a4-6219404fea23_1080x.jpg?v=1721353084 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-lettuce-cos-parris-island-cos | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6039-1_56596bc2-f7df-4454-ab60-caf8aa108bb2_1080x.jpg?v=1721353115 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-lettuce-oakleaf-green-salad-bowl | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6043-1_1080x.png?v=1729037347 | exact cultivar photo and alpha bounds checked.

## Batch 27

- Kings Seeds | organic-lettuce-oakleaf-red-salad-bowl | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6044-1_67c9a22b-f6ac-47f3-8d80-521e48351c46_1080x.jpg?v=1721353286 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-melon-pride-of-wisconsin | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6097-1_10e7b11b-f33f-4f75-86fd-1d51731ad285_1080x.jpg?v=1721354054 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-mesclun | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6045-1_98b10ce0-b9fd-4e72-ab3f-fc743878cb48_1080x.jpg?v=1721353336 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-onion-red-amposta | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6048-1_1bb6b4c7-2e70-406e-98e6-8aa2164ba011_1080x.jpg?v=1721354938 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-onion-shallot-conservor-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6118-1_638a21ce-4e86-4687-9a49-8027899cc0f3_1080x.png?v=1752445840 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-pak-choi-shanghai-green | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6119-1_7dad39b0-30d0-492f-b92a-bd22415cf64a_1080x.png?v=1752445840 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-parsnip-guernsey | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8226-1_1080x.png?v=1752445840 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-perilla-bi-colour | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/3_15d18f93-0ca0-4934-b077-5f0e8a8e540c_1080x.png?v=1754440705 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-pumpkin-new-england-pie | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6057-1_732c3535-0a83-40eb-b039-e8d66df342f2_1080x.jpg?v=1721355263 | exact cultivar photo and alpha bounds checked.
- Kings Seeds | organic-pumpkin-whangaparoa-crown | generated_qa_passed | 512 px master and 128 px gallery | https://www.naturesnutrition.co.nz/cdn/shop/files/pumpkin_grande.jpg?v=1724214671 | exact cultivar photo and alpha bounds checked.

## Batch 28

- Kings Seeds | organic-chicory-palla-rossa-early | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6019-1_e7fed6ac-68dc-47db-ba26-4d0074b96d77_1080x.jpg?v=1721352038 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-radish-cherrybelle | generated_qa_passed | 512 px master and 128 px gallery | https://northcircleseeds.com/cdn/shop/products/CherryBelleOrg_800x.png?v=1607981854 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-radish-french-breakfast | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6061-1_fdafb219-2424-476c-a709-8f9b796f89d3_1080x.jpg?v=1721355411 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-radish-white-daikon | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6063-1_48daea41-28d4-46e7-abf4-0f9b21008b11_1080x.jpg?v=1721355471 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-rocket | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6064-1_bfe5c2f6-8d2b-4ba8-ab9e-f82aae3b675b_1080x.jpg?v=1721355511 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-silverbeet-bright-yellow | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6066-1_e18986d3-8854-4ee8-92b9-38a5f8c900bd_1080x.jpg?v=1721355557 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-silverbeet-ruby-red | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6067-1_b82aa1ab-a139-46e7-9000-edfa4c21e149_1080x.jpg?v=1721355580 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-spinach-bloomsdale | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6098-1_f75555ce-83a0-4b3f-8021-1ba767a33feb_1080x.jpg?v=1721356166 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-spinach-winter-giant | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6068-1_028250d7-4091-4dc7-a32d-55d9bb070c9e_1080x.jpg?v=1721355611 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-spring-onion-tokyo-long-white | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/products/O6051-2_1080x.png?v=1720405396 | harvest artwork checked against cultivar photo. Earlier stages pending.

## Batch 29

- Kings Seeds | organic-squash-burgess-buttercup | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6100_1080x.jpg?v=1690171002 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-squash-winter-sweet-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6059-1_42d56a14-c600-4259-b543-7264c60c8a17_1080x.jpg?v=1721355330 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-tomato-confetti-mix | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6107-1_6c1e0e1d-15d5-43c6-b89f-31c2f1bc580c_1080x.jpg?v=1720660862 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-tomato-artisan-blush | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6072-1_e46bee77-6b01-46c7-9b8d-b2c2f9f902a5_1080x.jpg?v=1721355754 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-tomato-beefsteak-select | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6069-1_464c96e9-2cd7-47bd-bd89-3030a82cf218_1080x.jpg?v=1721355634 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-tomato-berkeley-tie-dye-pink | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6113-1_8f04a813-6e9e-4465-93ba-1ba06195fb62_1080x.png?v=1752445850 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-tomato-brads-atomic-grape | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6114-1_caa818a8-1521-4ca0-baa6-a5b07bef9b83_1080x.png?v=1752445856 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-tomato-copia | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6115-1_82b33001-05a9-4c19-83a4-a7c6c8f0e78c_1080x.png?v=1752445852 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-tomato-costoluto-fiorentino | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6070-1_3ca2686a-e03c-47e7-916a-0ab8e902285e_1080x.jpg?v=1721355670 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-tomato-gardeners-delight | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6073-1_968e100b-96a4-44d3-b440-e96a65c5b536_1080x.jpg?v=1721355794 | harvest artwork checked against cultivar photo. Earlier stages pending.

## Batch 30

- Kings Seeds | organic-tomato-indigo-blue-berries | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6074-1_7af89365-b0c6-4e7b-8748-e7834eb8d1a9_1080x.jpg?v=1721355813 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-tomato-roma | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6077-1_72195a20-f37f-43b7-89e1-60ee56f505d7_1080x.jpg?v=1721355958 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-tomato-rosella | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6075-1_eee7347c-d016-4b5e-be84-9cbf021902f3_1080x.jpg?v=1721355853 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-tomato-speckled-roman | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6106-1_f48dd204-22a4-48e5-90f3-5535314c66c5_1080x.jpg?v=1720660860 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-tomato-sunrise-bumble-bee | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6076-1_9c4f9aad-a652-4c4c-91f2-66c92f033f2a_1080x.jpg?v=1721355882 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-turnip-milan-red-top | generated_qa_passed | 512 px master and 128 px gallery | https://www.monjardinbio.com/cdn/shop/products/navet-milan-rouge-bio-zoom.jpg?v=1660480794 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-watermelon-black-tail-mountain | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6124-W_1080x.png?v=1784973927 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-zucchini-black-beauty | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/products/O6081-1_1080x.png?v=1688006161 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | organic-zucchini-summer-gold | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6082-1_3b596660-1bf3-4edd-9341-06ecd30938e9_1080x.jpg?v=1721356114 | harvest artwork checked against cultivar photo. Earlier stages pending.
- Kings Seeds | pak-choi-green-ace-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8019-1_1ed7700a-93ce-488b-9c05-a8cb5ff1a823_1080x.jpg?v=1721601050 | harvest artwork checked against cultivar photo. Earlier stages pending.

## Pending Kings Seeds reference inventory

The current catalogue has 429 IDs. The generated artwork manifest maps 390 of them. The local inventory at work/references/pending-catalogue.tsv includes the remaining 39 IDs in catalogue order and records a distinct local reference filename and its source URL for each. These references are queued for illustration and visual review.

Rasmussen Batch 18 reference gap: habanero-oz-latern-white-chilli-seeds-10-seeds remains pending an exact labelled photo. Generic White Habanero references were excluded.

Rasmussen Batch 22 reference gap: rocoto-manzano-red-flat-chilli-seeds-10-seeds needs a labelled photo that distinguishes the Flat selection from standard Red.

Rasmussen Batch 24 reference gap: silverbeet-silverado-compacta-150-seeds still needs a labelled photo confirming the Compacta selection.

## Rasmussen reference inventory

The local work/references/rasmussen-pending.tsv inventory covers 269 catalogue IDs outside the ten verified originals. It records 268 downloaded photo references and one unresolved ID, Rocoto Manzano Red Flat. Scarlett's Variegated Chilli now maps to the CoqHot cultivar photo in the local inventory. Oz Lantern White, Golden Orb and Silverado Compacta references have since been recovered.

Batch 24 passed the production build and focused Playwright suite.
Cloudflare deployment succeeded for Batch 24 commit 1e24a19 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42806062465).

Batch 25 passed the production build and focused Playwright suite.
Cloudflare deployment succeeded for Batch 25 commit 860eff6 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42808578635). The phone gallery alignment check passed on retry.

Batch 26 passed the production build and focused Playwright suite.
Cloudflare deployment succeeded for Batch 26 commit e4e302d (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42887774804).

## Approved growth-stage expansion

The approved Little Gem mockup adds six stages per Kings Seeds and Rasmussen catalogue entry, including entries with artwork already deployed and all future entries. The sequence is Seed, First sprout, Baby plant, Semi-mature, Pre-harvest, and Harvest. The approved proof sheet is saved locally at work/little-gem-growth-mockup.png.

Produce separate transparent 512 px masters and 128 px gallery PNGs in the approved botanical style. Preserve the deployed artwork and ten Rasmussen originals. Reuse existing artwork for Harvest when the illustration depicts the harvested form. Use cultivar and stage references where available and record provenance. Present stages together in /test-garden and keep the production planner resolver and saved garden data intact. Review each stage visually and technically and apply the same build, browser, and deployment checks to each validated batch. The library completion audit includes this expansion.

### Completion gate for both catalogues

For every exact Kings Seeds and Rasmussen catalogue ID, verify all six ordered stage mappings and their two PNG sizes. Apply the same check to previously deployed icons, the ten preserved Rasmussen originals, and each future batch. A cultivar with only its existing image is still pending growth-stage coverage. Count an existing illustration as Harvest only after reviewing it against that stage. Show missing stages as pending in /test-garden and record each stage's source and review status. The overall goal stays open until the full catalogue passes this audit.

Batch 27 passed the production build and focused Playwright suite.
Cloudflare deployment succeeded for Batch 27 commit db457531dff3b8d7730e2a0e185157e5d81f502b (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42899970005).
Cloudflare deployment succeeded for Batch 28 commit 54463fb9eddb6a16fda0f422cfb332068aee5bf1 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42908044773).

Batch 29 passed all 28 focused browser checks and deployed on Cloudflare at b5cc199 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42915206076).

Batch 30 deployed on Cloudflare at 0ba8f16 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42922020390). The production build passed. Playwright passed 27 checks on the first attempt and the phone gallery check passed on retry.

## Kings Seeds Batch 31

- Kings Seeds | pak-choi-mei-quing-choi-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8020-1_b9ae4de0-2d45-4a37-beab-865243dd1d33_1080x.jpg?v=1721601074 | Harvest reviewed against the cultivar photo. Earlier stages pending.
- Kings Seeds | pak-choi-red-choi-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8021-1_c12b4093-a3a7-4969-9843-2ba13e6d8380_1080x.jpg?v=1721601115 | Harvest reviewed against the cultivar photo. Earlier stages pending.
- Kings Seeds | pak-choi-white-stem | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8024-1_6ffd3aff-294e-4487-ad04-0e9bb700b5c1_1080x.jpg?v=1721601189 | Harvest reviewed against the cultivar photo. Earlier stages pending.
- Kings Seeds | papaya-red-lady-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8410-1_525c2dc3-ffca-4853-92a5-ed7a024409d5_1080x.png?v=1752445840 | Harvest reviewed against the cultivar photo. Earlier stages pending.
- Kings Seeds | parsnip-javelin-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8409-1_ec6776d8-298c-40da-9fbd-62648ee8ff90_1080x.png?v=1752445845 | Harvest reviewed against the cultivar photo. Earlier stages pending.
- Kings Seeds | passionfruit-large-black | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8227-1_2fe5bd18-639c-4c1b-a5ea-719ea76d81c8_1080x.jpg?v=1720667504 | Harvest reviewed against the cultivar photo. Earlier stages pending.
- Kings Seeds | pea-alderman-tall-climbing | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8228-1_8017ee52-63d5-4a81-a002-839748665e1b_1080x.jpg?v=1725598002 | Harvest reviewed against the cultivar photo. Earlier stages pending.
- Kings Seeds | pea-greenfeast | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8229-1_c58aaef1-9285-4100-a4b6-7ec889f39f04_1080x.jpg?v=1725598046 | Harvest reviewed against the cultivar photo. Earlier stages pending.
- Kings Seeds | pea-mucio | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8391-1_e6bc0266-b6c6-48b5-ad51-59f28265482a_1080x.jpg?v=1720660865 | Harvest reviewed against the cultivar photo. Earlier stages pending.
- Kings Seeds | pea-sugar-snap-tall | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8426-1W_1080x.png?v=1757032954 | Harvest reviewed against the cultivar photo. Earlier stages pending.

Batch 31 passed the production build and all 28 focused browser checks. Cloudflare deployed commit 40eddc7 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42926815464).

The /test-garden inspector displays all six stages for every supplier entry. The growth-stage manifest starts with ten reviewed Batch 31 harvest mappings. Unmapped stages display Pending. The production build and all 32 focused browser checks passed.

Mapped 30 previously reviewed Kings Seeds harvest illustrations to their exact cultivar growth records, for 40 mapped Harvest slots. Verified catalogue keys, reference URLs and both PNG sizes. The production build passed. Playwright passed 31 checks on the first attempt and the phone gallery check on retry.

## Kings Seeds Batch 32

- Kings Seeds | pepino | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/products/V8235-1_1080x.png?v=1688019301 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | perilla-green | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8411-1W_1080x.png?v=1765489917 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | perilla-purple | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8025-1_26f1bb02-c3e9-44dd-b747-69c78f074cb1_1080x.jpg?v=1721601208 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | pigeon-pea | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8364-1_17995513-cfc2-45e5-bcf6-a268bb05ff44_1080x.jpg?v=1725603279 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | pumpkin-atlantic-giant | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8237-1_4c88c93a-ddca-4111-ad66-0c2184c8ca9f_1080x.jpg?v=1725598318 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | pumpkin-crown-prince | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8239-1_008dced8-c2dc-4076-bbcc-6e61c38b2b6d_1080x.jpg?v=1720749408 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | pumpkin-flat-white-boer | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8240-1_4241dd3b-3ec6-468f-8a80-93b7de3a1465_1080x.jpg?v=1725598435 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | pumpkin-henris-potimarron | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8241-1_7fe02bb3-0809-424c-9476-41b1965bcad4_1080x.jpg?v=1725598479 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | pumpkin-kakai | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8398-W_1080x.png?v=1784973841 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | pumpkin-long-island-cheese | generated_qa_passed | 512 px master and 128 px gallery | https://www.harrisseeds.com/cdn/shop/files/01699b_b3194d47-74ff-4dd8-82b4-4d4ddbe2d692.jpg?v=1738389538 | Harvest reviewed and mapped. Earlier stages pending.

Batch 32 passed the production build and all 32 focused browser checks. The Kings Seeds manifest contains 320 unique assets at each size. Fifty cultivars have reviewed Harvest mappings.

Batch 32 deployed at 86de64f (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42931273086).

Little Gem lettuce has six reviewed growth images in /test-garden. Each transparent PNG is exported individually from the approved Little Gem mockup, using resampling for the 512 px masters. The original catalogue icon remains in its existing mapping. Both PNG sizes passed review, the production build passed and all 36 browser checks passed.

Little Gem deployed at 686e465 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42931952698).

## Kings Seeds Batch 33

- Kings Seeds | pumpkin-musquee-de-provence | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8245-1_ddbee6fc-53a8-48f8-90c0-0069d9ba07e4_1080x.jpg?v=1725598554 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | pumpkin-queensland-blue | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8246-1_36b2624f-697f-4ff7-ab65-fed2b648a10b_1080x.jpg?v=1725598603 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | pumpkin-small-sugar | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8247-1_aec4c6a1-0b9d-42e9-8c4a-845aadd145dd_1080x.jpg?v=1725598635 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | quinoa | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8452-W_1080x.png?v=1784781445 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | chicory-treviso | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8111-1_aa322ea3-d26c-418a-b1a7-9c108db1d37b_1080x.jpg?v=1725587599 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | radish-easter-egg | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8257-1_0df34af7-9c50-4930-886e-470786c170f2_1080x.jpg?v=1725599129 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | radish-german-giant | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/products/V8259-1_1080x.png?v=1688008675 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | radish-gourmet-blend | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8261-1_c6e0ed8d-f4e8-464e-923e-6be4b6443474_1080x.jpg?v=1725599221 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | radish-jin-mat-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8268-1_8d4a7b0e-68f1-4b09-b032-4177c7373b8a_1080x.jpg?v=1725599337 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | radish-mini-daikon-purple-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8269-1_7ddbe3a4-5a4a-4cff-928f-eee2ddbd0e86_1080x.jpg?v=1725599396 | Harvest reviewed and mapped. Earlier stages pending.

Batch 33 passed the production build and all 36 focused browser checks. The Kings Seeds manifest contains 330 unique assets at each size. Sixty-one cultivars have reviewed Harvest mappings.

Batch 33 deployed at f53f5cd (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42933789242).

## Kings Seeds Batch 34

- Kings Seeds | radish-red-cherry-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8264-1_e46a3849-576e-4b98-bb68-7f40f516f14e_1080x.jpg?v=1725599291 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | radish-seol-chun-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8271-1_2cd46ef4-8013-44bc-b7af-b0e65fe37c86_1080x.jpg?v=1725599445 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | radish-watermelon | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8273-1_11e33119-270a-4e87-838f-a411668aabfa_1080x.jpg?v=1725599500 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | radish-winter-noir | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8407-1_7800ab65-0e4b-4c0d-b451-fe2773c3f082_1080x.png?v=1752445846 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | radish-yuki | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8401-W1_1080x.png?v=1740521778 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | rhubarb-cherry-red | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8275-1_ca5fb914-259d-4dcd-835b-ca791389e147_1080x.jpg?v=1725599550 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | rocket-runway | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8277-1_16fdf807-4d08-4b1f-9f9f-71001288904d_1080x.jpg?v=1725599758 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | roselle | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8279-1_eadc10ea-ae8a-4be6-b2f0-052e587aca85_1080x.jpg?v=1725600196 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | zucchini-scallopini-sunbeam-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8358-1_17f6894a-b275-4181-83e7-d5798d71e8b0_1080x.jpg?v=1725603120 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | shiso-green-1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8448-W_6e052c70-910e-4bd9-aa04-260bd9ebe376_1080x.png?v=1784971965 | Harvest reviewed and mapped. Earlier stages pending.

Batch 34 passed the production build and all 36 browser checks after the phone gallery test was corrected to measure card positions in a single browser call. The Kings Seeds manifest has 340 unique assets at each size and 71 reviewed Harvest mappings.

Batch 34 deployed at ee489fe (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42935858227).

## Kings Seeds Batch 35

- Kings Seeds | silverbeet-ford-hook-giant | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8286-1_5e546452-95b5-427d-a5ec-ecf225f254bb_1080x.jpg?v=1725600514 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | silverbeet-rainbow-lights | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/products/V8287-1_1080x.png?v=1688000945 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | snow-pea-goliath | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8232-1_fce42a47-d7bd-4e58-b345-5e5a82553dd7_1080x.jpg?v=1725598157 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | pea-shiraz | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8230-1_3bfcaea4-4bdb-4098-8c2f-0d4274337a90_1080x.jpg?v=1725598112 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | snow-pea-sugar-pod-copy | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8403-1_767c072f-69b2-48b2-bf90-168ee8caaec9_1080x.png?v=1752445845 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | soybean | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8447-W_1080x.png?v=1784973631 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | spinach-malabar | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/products/V8288-1_1080x.png?v=1725600587 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | spinach-new-zealand | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8289-1_e752c1c9-5f52-4ae3-a626-72e8c74a194e_1080x.jpg?v=1725600617 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | spinach-santana-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8292-1_dff99fe0-4500-4e2f-af8a-40150a5f1c61_1080x.jpg?v=1725600696 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | spinach-strawberry | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/products/V8290-1_1080x.png?v=1688025774 | Harvest reviewed and mapped. Earlier stages pending.

Batch 35 passed the production build and all 36 focused browser checks. The Kings Seeds manifest has 350 unique assets at each size and 81 reviewed Harvest mappings.

Batch 35 deployed at 0df5691 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42937635121).

## Kings Seeds Batch 36

- Kings Seeds | spinach-summer-solstice-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8293-1_46e5a694-8a1f-49ec-a528-4d05e8d5868d_1080x.jpg?v=1720749577 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | spinach-winter-upright-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8294-1_0a598065-a2c9-4779-93ec-138ec4c78075_1080x.jpg?v=1720749599 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | spring-onion-ishikura | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8221-1_774e3fa7-0627-47cf-8572-410a18590dcd_1080x.jpg?v=1725597750 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | spring-onion-red-bunching | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/products/V8222-1_1080x.png?v=1688021265 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | squash-african-gem | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8249-1_78d93829-72e7-4a07-bcaf-e0ab76d97d7b_1080x.jpg?v=1725598710 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | squash-jade-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8250-1_3a6f0948-b84e-4c05-804a-f7015d079b7c_1080x.jpg?v=1725598742 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | squash-kumi-kumi | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8251-1_8e54db78-76ee-4b4c-90c3-0fc3e67b9346_1080x.jpg?v=1725598783 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | squash-north-georgia-candy-roaster | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8443-W_1080x.png?v=1784973417 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | squash-spaghetti | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/products/V8255-2_1080x.png?v=1720430580 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | swede-champion-purple-top | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8295-1_642b4937-8bf4-4d0a-b7d4-d9de296a5b14_1080x.jpg?v=1725600762 | Harvest reviewed and mapped. Earlier stages pending.

Batch 36 passed the production build and all 36 browser checks after the pending filter test was updated to account for fewer than 72 remaining Kings Seeds entries. The Kings Seeds manifest has 360 unique assets at each size and 91 reviewed Harvest mappings.

Batch 36 deployed at 9fb1244 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42939568589).

## Kings Seeds Batch 37

- Kings Seeds | tamarillo-large-red | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8296-1_63bbcc0c-bc49-4634-bb97-7f54582e67e6_1080x.jpg?v=1720749731 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomatillo-grande-verde | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8297-1_3d4a9a17-69fe-486e-a829-2a3a28e45ca1_1080x.jpg?v=1725600821 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-albenga-oxheart | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8298-1_75721542-f9f4-4391-9cd8-b0b261306eb3_1080x.jpg?v=1725600932 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-amana-orange | generated_qa_passed | 512 px master and 128 px gallery | https://extension.rutgers.edu/sites/default/files/styles/16x9_full_500_1_5x/public/tomato-varieties/Amana_Orange-1_0.jpg?h=69f2b9d0&itok=2cK0BaGp | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-amish-orange-sherbert | generated_qa_passed | 512 px master and 128 px gallery | https://www.sadost.ru/img/_big_foto/semena-tomat-amishey-oranjeviy-scherbet-amish-orange-sherbet_big_2.jpg | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-ananas-noire | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8399-1_b79f6752-c7f0-4fc1-8b76-01bddceff618_1080x.jpg?v=1720660873 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-aunt-rubys-german-green | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8299-1_97b3739e-5c0c-438a-b90d-5a4ff694a70b_1080x.jpg?v=1725601024 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-baxters-early-bush | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8317-1_6c57ac6b-c69c-4ba0-84d0-9fcdb302af23_1080x.jpg?v=1725601603 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-beefsteak-blend | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8314-1W_1080x.png?v=1764630396 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-black | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8318-1_2894eee7-370c-414a-a545-8a75d6aa0f33_1080x.jpg?v=1725601636 | Harvest reviewed and mapped. Earlier stages pending.

Batch 37 passed the production build and all 36 focused browser checks. The Kings Seeds manifest has 370 unique assets at each size and 101 reviewed Harvest mappings.

Batch 37 deployed at 22a6f3f (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42941685886).

## Kings Seeds Batch 38

- Kings Seeds | tomato-black-krim | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8302-1_8d05e07f-36e7-484c-94c5-f9fc61a30350_1080x.jpg?v=1725601122 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-bloody-butcher | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8338-1_f72f2b0c-2760-4eac-bd62-244bfe47c83d_1080x.jpg?v=1725602339 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-bob-logan | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/HFC027-W2.png | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-brandywine-pink | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8305-1_1dbbd392-659c-46dc-ba82-e9107fe7e5b9_1080x.jpg?v=1725601262 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-carol | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/HFC028-W2.png | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-cherokee-purple | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8334-1_3c797b82-a140-4682-80c8-822a553917c6_1080x.jpg?v=1725602185 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-berry-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8319-1_2f7a10b3-c547-4a91-8419-19cdf7127375_1080x.jpg?v=1725601668 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-delicious | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8413-1_a29d7fd9-8b62-4147-9564-cf480c078d47_1080x.png?v=1752445851 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-fantastico-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8320-1_bf96eaa8-8e04-451a-ad2c-b1d3b0ed5b6f_1080x.jpg?v=1725601712 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-glimpse | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/HFC018-1_78c6b78f-cf64-46ab-8adf-0114be4cee11_1080x.png?v=1752445879 | Harvest reviewed and mapped. Earlier stages pending.

Batch 38 passed the production build and all 36 focused browser checks. The Kings Seeds manifest has 380 unique assets at each size and 111 reviewed Harvest mappings. Carol was regenerated after the first render failed the source-edge transparency check.

Batch 38 deployed at 8f372d7 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42943935952).

## Kings Seeds Batch 39

- Kings Seeds | tomato-gold-nugget | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8321-1_b3b42256-143b-4b4d-9714-564255e0eceb_1080x.jpg?v=1725601751 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-golden-bell | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/HFC019-1_7b9d0657-5332-4efd-9990-774fa3cfcbfb_1080x.png?v=1752445880 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-golden-cascade | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8322-1_ad186c7e-af59-41dc-892b-456e5398d58e_1080x.jpg?v=1725601784 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-golden-grape | generated_qa_passed | 512 px master and 128 px gallery | https://www.heritagefoodcrops.org.nz/wp-content/uploads/2020/06/Golden-Grape-1024x575.jpg | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-golden-light | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/HFC020-1_208b897a-2441-4426-9d02-8b0fde5cc9df_1080x.png?v=1752445882 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-green-zebra | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/products/V8311-1_1080x.png?v=1688024870 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-indigo-pear-drops | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8326-1_3ecd6038-4856-412a-a7a7-35dd3c6e6472_1080x.jpg?v=1725601910 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-kelloggs-breakfast | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8414-1_db5cd994-65b1-4246-9877-db95aced6e63_1080x.png?v=1752445855 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-matts-wild-cherry | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8368-1_60cc94fe-4522-43d6-a775-0d9ca6774a1f_1080x.jpg?v=1725603404 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-mini-orange | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/HFC021-1_8bf51190-541f-4fb2-91a3-b6c56e204aa5_1080x.png?v=1752445883 | Harvest reviewed and mapped. Earlier stages pending.

Batch 39 passed the production build and all 36 focused browser checks. The Kings Seeds manifest has 390 unique assets at each size and 121 reviewed Harvest mappings.

Batch 39 deployed at 1d33361 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42946128654).

Batch 40 is in progress locally. Moneymaker, Moonbeam and Mortgage Lifter passed visual comparison and 512 px and 128 px PNG export checks. ImageGen returned a quota error on Mountain Gold with a reported reset of 2026-11-11 09:43:42 UTC. Resume with Mountain Gold at index 3. Integrate and deploy after the ten-illustration batch passes review.

Ten existing artichoke, asparagus and bean illustrations passed Harvest-stage review. Their exact cultivar mappings and original provenance are recorded in the growth-stage manifest, bringing the reviewed Harvest count to 131. The production build and all 36 browser checks passed.

The previous Harvest mappings deployed at 1ed7511 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42947365270).

Reviewed the ten dwarf bean illustrations from Batch 03 as harvested pods or dried beans and mapped them by exact cultivar ID. Both PNG sizes were verified, bringing the Harvest total to 141. The production build and all 36 browser checks passed.

The dwarf bean Harvest mappings deployed at 0b9a239 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42947942059).

Reviewed and mapped ten more existing bean illustrations, from Xera Select through King of the Blues. Both PNG sizes were verified. There are now 151 reviewed Harvest mappings. The production build and all 36 browser checks passed.

The additional bean Harvest mappings deployed at f4cf571 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42948517669).

All ten verified Rasmussen originals depict ripe fruit and now have separate 512 px and 128 px transparent Harvest exports mapped to their exact catalogue IDs. Original PNGs were preserved byte-for-byte. The Harvest manifest has 161 mappings. The production build and all 36 browser checks passed.

The Rasmussen Harvest exports deployed at 7242421 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42949347780).

Reviewed and mapped ten existing beetroot, broad bean, and broccoli illustrations to Harvest. Both PNG sizes were verified. The Harvest total reached 171, and the production build and all 36 browser checks passed.

The prior Harvest mappings deployed at 28963e2 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42949895172).

Reviewed and mapped ten existing broccoli, Brussels sprout, butternut and Chinese cabbage illustrations to Harvest. Both PNG sizes were verified. The Harvest total reached 181. The production build and all 36 browser checks passed.

The prior Harvest mappings deployed at 9449e17 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42950506829).

Reviewed and mapped ten existing cabbage, caigua, Cape gooseberry and capsicum illustrations to Harvest. Both PNG sizes were verified. The Harvest total reached 191. The production build and all 36 browser checks passed.

The prior Harvest mappings deployed at d9c3ff3 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42951051194).

Reviewed and mapped ten existing Kings Seeds capsicum illustrations to Harvest. Both PNG sizes were verified. The Harvest total reached 201. The production build and all 36 browser checks passed.

The capsicum Harvest mappings deployed at 6d0bd90 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42951651439).

Reviewed and mapped existing carob and nine carrot illustrations to Harvest. Both PNG sizes were verified. The Harvest total reached 211. The production build and all 36 browser checks passed.

The carob and carrot Harvest mappings deployed at 30868bf (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42952192471).

Reviewed and mapped four existing carrot and six cauliflower and broccoflower illustrations to Harvest. Both PNG sizes were verified. The Harvest total reached 221. The production build and all 36 browser checks passed.

The carrot and cauliflower Harvest mappings deployed at 0efda07 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42952714961).

Reviewed and mapped ten existing cauliflower, celeriac, celery, celtuce, and chilli illustrations to Harvest. Chia remains pending Harvest review because its illustration shows a flowering spike. Both PNG sizes were verified. The Harvest total reached 231. The production build and all 36 browser checks passed.

The prior Harvest mappings deployed at b66f3f8 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42953256524).

Reviewed and mapped ten existing Kings Seeds chilli illustrations to Harvest, using the cultivar's documented harvest colour, including green-picked varieties. Both PNG sizes were verified. The Harvest total reached 241. The production build and all 36 browser checks passed.

The prior Harvest mappings deployed at 02dfceb (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42953809613).

Reviewed and mapped ten existing Kings Seeds chilli, leafy green and corn illustrations to Harvest. Both PNG sizes were verified. The Harvest total reached 251. The production build and all 36 browser checks passed.

The prior Harvest mappings deployed at cd989a1 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42954320414).

Reviewed ten existing Kings Seeds leafy green and cucumber illustrations and mapped them to Harvest. Both PNG sizes were verified, bringing the Harvest total to 261. The production build and 32 browser checks passed on the first run. Four gallery checks exceeded the default timeout and passed with a longer timeout.

The prior Harvest mappings deployed at 8286d6c (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42957300355).

Reviewed and mapped ten existing cucumber, eggplant, endive and fennel illustrations to Harvest. Both PNG sizes were verified. The Harvest total reached 271. The production build and 35 browser checks passed on the first run. The tablet gallery check timed out and passed on rerun.

The prior Harvest mappings deployed at 940301a (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42981311146).

Reviewed and mapped ten existing goji, gourd, bitter melon, luffa, jicama and kale illustrations to Harvest. Both PNG sizes were verified. The Harvest total reached 281. The production build and all 36 browser checks passed.

The prior Harvest mappings deployed at c2fcdea (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42981878304).

Reviewed and mapped ten existing kale, kiwano, kohlrabi and leek illustrations to Harvest. Both PNG sizes were verified. The Harvest total reached 291. The production build and all 36 browser checks passed.
