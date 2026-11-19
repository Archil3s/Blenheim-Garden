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

The current catalogue has 429 IDs. The generated artwork manifest maps all 429 of them. The local inventory at work/references/pending-catalogue.tsv includes the remaining 39 IDs in catalogue order and records a distinct local reference filename and its source URL for each. These references are queued for illustration and visual review.

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

The prior Harvest mappings deployed at 378e846 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42982421931).

Reviewed and mapped ten existing lettuce illustrations to Harvest. Both PNG sizes were verified. The Harvest total reached 301. The production build and all 36 browser checks passed.

The prior Harvest mappings deployed at 0ca707d (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42982928871).

Reviewed and mapped ten existing Salanova lettuce, melon and mesclun illustrations to Harvest. Both PNG sizes were verified. The Harvest total reached 311. The production build and all 36 browser checks passed.

The prior Harvest mappings deployed at 2024f97 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42983502029).

Reviewed and mapped ten existing mesclun, mibuna, miner's lettuce and mizuna illustrations to Harvest. Both PNG sizes were verified. The Harvest total reached 321. The production build and all 36 browser checks passed.

The prior Harvest mappings deployed at 2b3ccdf (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42984100823).

Reviewed and mapped ten existing moringa, mustard, okra and onion illustrations to Harvest. Both PNG sizes were verified. The Harvest total reached 331. The production build and all 36 browser checks passed.

The prior Harvest mappings deployed at 45792b1 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42984781189).

Reviewed ten existing Kings Seeds organic vegetable illustrations and mapped them to Harvest. Both PNG sizes were verified. The Harvest total reached 341. The production build and all 36 browser checks passed.

The prior organic vegetable Harvest mappings deployed at 43cd6d7 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42985570641).

Mapped ten reviewed organic capsicum, carrot, cauliflower, celery and chilli illustrations to Harvest. Both PNG sizes were verified. The Harvest total reached 351. The production build and all 36 browser checks passed.

The prior organic vegetable Harvest mappings deployed at 87785b7 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42986270741).

Reviewed ten organic Kings Seeds illustrations from Early Jalapeno through Purple Vienna kohlrabi and mapped them to Harvest. Both PNG sizes were verified. The Harvest total reached 361. The production build and all 36 browser checks passed.

The prior organic Harvest mappings deployed at d0ba4ce (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42986973741).

Reviewed and mapped ten existing organic leek, lettuce and melon illustrations to Harvest. Both PNG sizes were verified. The Harvest total reached 371. The production build and all 36 browser checks passed.

The prior organic Harvest mappings deployed at 88b0d34 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42987663252).

Reviewed and mapped eight existing organic vegetable illustrations and two runner bean illustrations to Harvest. Both PNG sizes were verified. The Harvest total reached 381. The production build and all 36 browser checks passed.

The prior Harvest mappings deployed at f506918 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42988393781).

Reviewed and mapped ten existing climbing, dwarf and runner bean illustrations to Harvest. Both PNG sizes were verified. The Harvest total reached 391. The production build and all 36 browser checks passed.

The prior bean Harvest mappings deployed at a5feedf (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42989042488).

Reviewed the nine existing Kings Seeds icons still lacking a Harvest mapping. Five depict the harvested part and were mapped. Garnet Red amaranth, asparagus pea, Takinogawa Long burdock and chia still require separate Harvest artwork. Both PNG sizes were verified for the five mappings. The Harvest total reached 396. The production build and all 36 browser checks passed.

The final review of existing Kings Seeds icons deployed at f0f386d (https://github.com/Archil3s/Blenheim-Garden/actions/runs/42989778004).

Reconciled all 39 remaining Kings Seeds catalogue IDs to Batches 40 through 43 in catalogue order. All 39 reference files exist and have distinct SHA-256 hashes and HTTPS provenance. Batch 40 resumes with Mountain Gold after the reported 09:43:42 UTC quota reset. Rasmussen's original source manifest lists Red Flat separately from Manzano Red. The existing Red Flat concept illustration still requires exact cultivar photo review.

Reconciled the Rasmussen queue against the 279 catalogue IDs and ten verified originals. The 269 queued IDs have no duplicates or omissions. All 268 available references have distinct SHA-256 hashes, HTTPS provenance and valid decodable image data (244 PNG, 22 JPEG, two WebP). Rocoto Manzano Red Flat remains the single reference gap.

Audited all 4,248 growth-stage slots across the 708 live cultivar IDs. The manifest contains 396 Harvest mappings and the five earlier Little Gem stages. Each mapped PNG pair passed dimension and RGBA checks and has provenance. The local references/growth-stage-pending.tsv queue records the 3,847 missing slots by exact supplier, cultivar ID and stage. The three staged Batch 40 pairs also passed the size and RGBA checks.

Prepared the local Rasmussen export and integration scripts for generated artwork. The first ten reference rows passed the script's catalogue, provenance and existing-mapping checks. Integration will validate the generated PNG pairs before writing either manifest.

Ran the Rasmussen catalogue and provenance preflight against all 27 generation batches. Twenty-six passed. Batch 22 contains the unresolved Rocoto Manzano Red Flat reference. The other nine entries in that batch have local photos.

All 39 reference images for Kings Seeds Batches 40–43 passed full raster decoding.

Stage references for the four existing Kings Seeds illustrations that need dedicated Harvest artwork:

- Garnet Red amaranth | Kings Seeds identifies young leaves and mature grain as harvestable. Use a ripe panicle with visible seed, or the harvested young leaves. https://www.kingsseeds.co.nz/products/amaranth-garnet-red
- Asparagus pea | Illustrate the small, harvest-sized winged pods. Use the New Zealand supplier photo for cultivar identity and the UK seed supplier description for pod size. https://www.kingsseeds.co.nz/products/asparagus-pea and https://www.kingsseeds.com/10301-asparagus-pea
- Takinogawa Long burdock | Use harvested roots as the subject. RareSeeds provides a named Takinogawa root photo and La Ferme de Sainte Marthe documents the exact Long cultivar. https://www.rareseeds.com/burdock-takinogawa and https://www.fermedesaintemarthe.com/en/products/bardane-japonaise-takinogawa-long-ou-gobo-ab
- Chia | Kings Seeds identifies the seed heads as the harvested part. Show a mature seed head with seed detail. https://www.kingsseeds.co.nz/products/chia

Mapped existing Garnet Red amaranth, asparagus pea and chia artwork to Pre-harvest after review. Their Harvest slots remain pending. Burdock remains unassigned to a stage. Both PNG sizes and the production build passed. All 36 browser checks passed after narrowing the master preview assertion to distinguish it from the new stage thumbnails.

The three Pre-harvest mappings deployed at 28db5d0 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/43082603320).

## Kings Seeds Batch 40

- Kings Seeds | tomato-moneymaker | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8342-1_74d42ac5-9946-4f0d-adb5-2ed3f6fdf8e3_1080x.jpg?v=1725602536 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-moonbeam | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/HFC022-1_2125d7a8-dac0-415b-9ecb-d31704475f55_1080x.png?v=1752445884 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-mortgage-lifter | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8365-1_49a7f5e1-e7e6-42da-bfc7-e62e7a9cf7b0_1080x.jpg?v=1725603321 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-mountain-gold | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/HFC030-W2_1080x.png?v=1785389082 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-oley | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/HFC023-1_1b0ba677-a799-4aa2-b682-4364a67c2785_1080x.png?v=1752445885 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-rainbow-cherry-blend | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8329-1_1b835e16-e377-4e14-ae08-ff67551bad56_1080x.jpg?v=1725602028 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-red-pear | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8369-1_204200e3-7427-436e-b723-6792205b4d86_1080x.jpg?v=1725603444 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-russian-red | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8343-1_2f6c31b5-14ba-475e-bfdc-8c00b6203473_1080x.jpg?v=1725602568 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-sicilian-sauce-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8337-1_67c7d7da-01a2-49a9-bf18-8faebcc19b65_1080x.jpg?v=1725602317 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-sub-arctic-plenty | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8344-1_fe1529ed-69cc-48ed-bf03-163b2f96b351_1080x.jpg?v=1725602604 | Harvest reviewed and mapped. Earlier stages pending.

Batch 40 passed the production build and all 36 focused browser checks. There are 400 Kings Seeds cultivar illustrations and 406 Harvest mappings across both suppliers. Batches 41–43 contain the 29 remaining Kings Seeds cultivar illustrations.

Batch 40 deployed at 8cfc259 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/43084324577).

## Kings Seeds Batch 41

- Kings Seeds | tomato-sugar-plum-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8328-1_e4919a85-c7f6-4e68-b55a-28afd9ae439b_1080x.jpg?v=1725601981 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-sungold | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8382-1_d6fd6665-321f-476f-8f4e-7f85e3951294_1080x.jpg?v=1725603711 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-tangella | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/HFC024-1_3b773cc1-8e48-41c1-94f4-0198184d6077_1080x.png?v=1752445888 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-tigerella | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8366-1_4e537429-8f07-4b6f-be32-4375c41f0cdf_1080x.jpg?v=1725603361 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-tommy-toe | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8331-1_e2551b50-e6b0-4102-9aa1-f8037eecbaf5_1080x.jpg?v=1725602085 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | tomato-yellow-pear | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8381-1_41b7ca3e-5860-4c88-89d6-19b9e3309392_1080x.jpg?v=1725603672 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | turnip-milan-red-top | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6078-1_89d4bec7-1652-4069-a922-da035a800bb9_1080x.jpg?v=1721355994 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | turnip-snowball | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8346-1_84bd78ac-0c47-4935-9495-a6f594cdfe82_1080x.jpg?v=1725602684 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | turnip-tokyo-white-cross-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8347-1_f0c12eaf-c1c7-46cc-80b5-28692ba6a133_1080x.jpg?v=1725602717 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | water-spinach-bamboo-leaf | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8348-1_ec3581c0-9f93-4278-ba66-2e3fa5c09572_1080x.jpg?v=1725602748 | Harvest reviewed and mapped. Earlier stages pending.

Batch 41 passed the production build and all 36 focused browser checks. There are 410 Kings Seeds cultivar illustrations and 416 Harvest mappings across both suppliers. Nineteen Kings Seeds cultivars still need their first illustration.

Batch 41 deployed at f6a9d82 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/43086718542).

## Kings Seeds Batch 42

- Kings Seeds | watercress | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8349-1_a13fa372-ddbe-4830-8564-dac9d02ba52a_1080x.jpg?v=1725602777 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | watermelon-apple-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8432-W_1080x.png?v=1784972011 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | watermelon-charleston-gray | generated_qa_passed | 512 px master and 128 px gallery | https://sowtrueseed.com/cdn/shop/products/Charleston_Gray_2.jpg?v=1752171949 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | watermelon-crimson-sweet | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6079-1_52dde458-bde7-423d-be49-e743cc5cd002_1080x.jpg?v=1721356026 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | watermelon-dulce-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/WatermelonDulce_1080x.png?v=1697138268 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | watermelon-gold-in-gold-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8350-1_8379fe20-8eea-4880-b002-546a703c1ed8_1080x.jpg?v=1725602833 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | watermelon-moon-stars | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8350-W2_1080x.png?v=1784973797 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | watermelon-mountain-sweet-yellow | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8444-W_1080x.png?v=1784972069 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | watermelon-sugar-baby | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/O6080-1_9e7b4672-198d-4bb6-b61e-afe8c9fc6562_1080x.jpg?v=1721356048 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | watermelon-sweet-red-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8352-1_3bf805ad-39b8-4108-b257-5b340724566a_1080x.jpg?v=1725602901 | Harvest reviewed and mapped. Earlier stages pending.

Batch 42 passed the production build and all 36 focused browser checks. There are 420 Kings Seeds cultivar illustrations and 426 reviewed Harvest mappings across both suppliers. Nine Kings Seeds cultivars still need their first illustration.

Batch 42 deployed at d9831d3 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/43089178710).

## Kings Seeds Batch 43

- Kings Seeds | rocket-arugula | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8277_1080x.jpg?v=1741408842 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | wild-rocket-dragons-fire | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8419-1_eb870cc3-1edc-4a8e-9abf-9c53f65a0ccd_1080x.png?v=1752445846 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | chicory-witloof | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/products/V8112-1_1080x.png?v=1688002011 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | zucchini-black-coral-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8353-1_0356270e-8f20-41d9-ada7-87b6adc336ba_1080x.jpg?v=1725602938 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | zucchini-cocozelle | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8354-1_dc00fb6d-acc3-449c-a8fb-24c23e3a4c85_1080x.jpg?v=1725602980 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | zucchini-costata-romanesco | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8355-1_146c37ca-86b1-4e3f-a057-34094f8c7fd2_1080x.jpg?v=1725603015 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | zucchini-gold-rush-f1 | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8356-1_0a3703f7-eb5b-4fb8-92af-f82afaee9386_1080x.jpg?v=1725603050 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | squash-rampicante | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8254-1_8473ce6d-badc-4d64-81b0-407c0a5ebc05_1080x.jpg?v=1725598910 | Harvest reviewed and mapped. Earlier stages pending.
- Kings Seeds | zucchini-tondo-di-nizza | generated_qa_passed | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8453_W_1080x.png?v=1784970099 | Harvest reviewed and mapped. Earlier stages pending.

Batch 43 passed the production build and all 36 focused browser checks. The generated artwork manifest covers all 429 Kings Seeds IDs. The growth manifest has 435 reviewed Harvest mappings across both suppliers. Four existing Kings Seeds icons still need dedicated Harvest art, and earlier growth stages remain pending across the catalogue.

Batch 43 deployed at 775ca92 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/43091521766).

## Rasmussen Batch 01

- Rasmussen | aji-colorado-orange-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/2A9862F7-84E7-4205-B692-B9F67971CD71.png?v=1743915279&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | aji-cristal-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://southdevonchillifarm.co.uk/cdn/shop/files/AjiCrystal2_d6d2123f-34ff-4b6c-b0dc-1743fc2f7c91.jpg?v=1726582142&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | aji-fantasy-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiFantasy.png?v=1744687289&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | aji-giallo-arancio-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiGialloArancio.png?v=1744625909&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | aji-guyana-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/D722CEB6-17ED-49B0-AF38-302ED10C535E.png?v=1743915362&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | aji-lemon-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/710A1E46-3BB0-4B24-90C3-7E0340981A4A_5df4fdc9-6b7a-410a-8dfb-9c2fd78b6a33.png?v=1759100133&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | aji-lemon-starburst-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiLemonStarburst.png?v=1744690396&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | aji-mango-stumpy-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0F6FC353-1E27-4AA7-8041-9CBD0A533FC7.png?v=1743915417 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | aji-melocoton-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiMelocoton_1.png?v=1745009464&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | aji-merken-cacho-de-cabra-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiMerkenCachodecabra.png?v=1744690903&width=1946 | Harvest reviewed and mapped. Earlier stages pending.

Aji Lemon Stumpy is the supplier and catalogue display name for the historical aji-lemon-starburst product ID. The artwork follows the exact Stumpy reference.

Rasmussen Batch 01 passed the production build and all 40 focused browser checks. Rasmussen now has ten generated illustrations and ten verified originals. The library has 445 reviewed Harvest mappings.

Rasmussen Batch 01 deployed at e69e532 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/43094056836).

## Rasmussen Batch 02

- Rasmussen | aji-norteno-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://www.tomatenfluesterer.at/cdn/shop/files/Aji-Norteno-Pepper-DER-TOMATENFLUSTERER-59467044.jpg?v=1700311746&width=1445 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | aji-panca-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Aji_Panca_Chilli_Seeds_10_seeds_c1fc2a4d-5bb2-414c-86cf-f3da46075fb7.png?v=1751492101 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | aji-peanut-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiPeanut.png?v=1744626251&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | aji-pineapple-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://www.barney.dk/cdn/shop/files/Aji-Pineapple.jpg?v=1759526551 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | aji-rojo-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/9784C412-B965-4B90-9F3B-785D7B3D606F_42474444-e3e7-449b-ad0d-756ff2382154.png?v=1759100146&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | aji-sparkly-white-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/C1F7D06D-C83B-4DD1-AC36-13A3A3C12B53.png?v=1743915870&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | aji-strawberry-drop-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiStrawberryDrop_b55133b5-56e7-4709-91be-b8793b9c246c.png?v=1759100149 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | anaheim-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/CB453B1B-D409-4157-96A5-40E74C8C669A.png?v=1743918180&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | anna-banana-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-6868451224287324368.png?v=1744147015&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | arriba-saia-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://acdn-us.mitiendanube.com/stores/003/612/494/products/1001592140-ef31c00ffd4dbdcfa417744799582513-1024-1024.webp | Harvest reviewed and mapped. Earlier stages pending.

Rasmussen Batch 02 passed the production build and all 40 focused browser checks. Rasmussen now has twenty generated illustrations and ten verified originals. The library has 455 reviewed Harvest mappings.

## Rasmussen Batch 03

- Rasmussen | artichoke-violet-de-provence-25-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://www.edenbrothers.com/cdn/shop/files/artichoke-violet-de-provence-aly-1.jpg?v=1724342123&width=1445 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | bahamian-goat-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://pepperjoe.com/cdn/shop/files/Bahamian-Goat-Pepper.02.jpg?v=1730930995&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | beetroot-chioggia-150-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Beetroot_-_Chioggia_150_seeds.png?v=1776722697&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | beetroot-white-albino-100-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Beetroot_-_White_Albino_100_seeds.png?v=1776721352&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | mini-bell-pepper-yellow-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Mini_Bell_Pepper_-_Yellow_Chilli_Seeds_10_seeds_b9e5cf59-03dc-40bf-bad8-af76e4c9c395.png?v=1778027633&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | bell-pepper-orange-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Bell_Pepper_-_Orange_Chilli_Seeds_10_seeds.png?v=1778027869&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | bell-pepper-purple-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/BellPepper-Purple_1.png?v=1744628884&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | bell-pepper-red-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Bell_Pepper_-_Red_Chilli_Plant_in_4_pot.png?v=1761701654&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | bell-pepper-soroksari-chilli-seeds-10-seeds-1 | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Bell_Pepper_-_Soroksari_Chilli_Seeds_10_seeds_54ff8cec-8b18-4033-b793-eb817e8aa58a.png?v=1779003643&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | berry-cream-bbg-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://i0.wp.com/patrickspepperpatch.com/wp-content/uploads/2022/09/mamp-2-e1662667057655.jpg?fit=615%2C403&ssl=1 | Harvest reviewed and mapped. Earlier stages pending.

Batch 03 passed the production build and all 40 focused browser checks. Rasmussen now has 30 generated illustrations plus ten verified originals. The library has 465 reviewed Harvest mappings.

Batch 03 deployed at dbc2528 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/43952445749).

## Rasmussen Batch 04

- Rasmussen | bhut-jolokia-ghost-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/1F37F3B0-4FEF-4926-A9B9-96173183D493.png?v=1743918231&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | bhut-jolokia-ghost-chocolate-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/A6022C02-54E6-461F-843B-0EF17BAD588F.png?v=1743918268&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | bianca-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-7335701170309855491.png?v=1745315141&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | big-rainbow-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Big_Rainbow_Tomato_10_seeds.png?v=1778210714&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | biquinho-iracema-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/19643A92-E692-4878-BACA-5870FBB49C2A.png?v=1743918310&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | biquinho-yellow-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Biquinho_Yellow_Chilli_Seeds_10_seeds.png?v=1751696854&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | bishop-crown-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/BishopCrown.png?v=1744691910&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | black-fire-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/C7A9380B-D71F-4CF6-BDD0-1BBBAE216B6E_ad6951e4-4294-4acd-92dd-02eddb3cdafa.png?v=1759100160&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | black-krim-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Black_Krim_Tomato_10_seeds.png?v=1778054534&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | black-pearl-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-5269673168418145426.png?v=1744629111&width=1946 | Harvest reviewed and mapped. Earlier stages pending.

Batch 04 passed the production build and all 44 focused browser checks. Rasmussen now has 40 generated illustrations plus ten verified originals. The library has 475 reviewed Harvest mappings.

Batch 04 deployed at 9d6a369 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44175346684).

## Rasmussen Batch 05

- Rasmussen | black-zebra-cherry-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Black_Zebra_Cherry_Tomato_10_seeds.png?v=1778053201&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | bleeding-heart-yellow-bbg-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Bleeding_Heart_Yellow_BBG_Chilli_Seeds_10_seeds.png?v=1783733641&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | blue-beauty-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Blue_Beauty_Tomato_10_seeds.png?v=1778208856&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | bolivian-rainbow-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/9599B612-9439-4E73-B188-17FB66A6D469.png?v=1743918373&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | brazilian-starfish-orange-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://static.wixstatic.com/media/8d9077_228f7b22304d46d586aaf15d0b1fefe3~mv2.jpg/v1/fill/w_480%2Ch_534%2Cal_c%2Cq_80%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/8d9077_228f7b22304d46d586aaf15d0b1fefe3~mv2.jpg | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | broad-bean-hughey-crimson-40-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Broad_Bean__Hughey_Crimson_40_seeds.png?v=1776120956&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | broad-bean-lucifer-30-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Broad_Bean__Lucifer_30_seeds.png?v=1776118971&width=600 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | broccoli-de-cicco-150-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://www.everwilde.com/media/0800/VBRODEC-A-De-Cicco-Broccoli-Seeds.jpg | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | brown-poblano-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/B165C08A-3643-4629-8844-CD3C4686DD83.png?v=1743918404&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | brussels-sprouts-catskill-150-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://cdn.shopify.com/s/files/1/2016/2681/files/Brussel-Sprouts-Catskill-Comp.jpg?v=1762198159 | Harvest reviewed and mapped. Earlier stages pending.

Batch 05 passed the production build and all 44 focused browser checks. Rasmussen now has 50 generated illustrations plus ten verified originals. The library has 485 reviewed Harvest mappings.

Batch 05 deployed at c5357db (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44177996300).

## Rasmussen Batch 06

- Rasmussen | brussels-sprouts-red-bull-50-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Brussels_Sprouts_-_Red_Bull_50_seeds.png | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | bulgarian-carrot-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/89936954-C949-42DA-8399-F4C8433F9545.png | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | cabbage-chieftain-savoy-150-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://www.adaptiveseeds.com/wp-content/uploads/2014/12/cabbage-chieftan-savoy-3.jpg | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | cabbage-golden-acre-150-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Cabbage_-_Golden_Acre_150_seeds.png | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | cabbage-greyhound-150-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://seaspringseeds.co.uk/wp-content/uploads/2018/10/greyhound-web20.jpg | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | cabbage-red-acre-150-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://www.damseeds.com/cdn/shop/products/1361.jpg | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | candy-cane-chilli-seeds-10-seeds-copy | generated_qa_passed | 512 px master and 128 px gallery | https://pepperjoe.com/cdn/shop/files/Candy-Cane-Pepper.jpg | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | carolina-reaper-yellow-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Carolina_Reaper_-_Yellow.png | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | carrot-kyoto-red-200-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://res.cloudinary.com/rareseeds/image/upload/c_lpad%2Cdpr_1.0%2Cf_auto%2Cq_auto/v1/media/catalog/product/c/a/carrot_kyoto_red_1_1.jpg?_i=AB | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | carrot-parisian-market-500-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://seedsofplenty.com.au/cdn/shop/products/V-CAR-06p1.jpg | Harvest reviewed and mapped. Earlier stages pending.

Batch 06 passed the production build and all 44 focused browser checks. Rasmussen now has 60 generated illustrations plus ten verified originals. The library has 495 reviewed Harvest mappings.
Batch 06 deployed at 7bfd39a (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44180796003).

## Rasmussen Batch 07

- Rasmussen | carrot-topweight-500-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Carrot_-_Topweight_500_seeds.png?v=1771919019&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | cayenne-antho-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/CayenneAntho.png?v=1744698261&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | chinese-pink-celery-150-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Chinese_Pink_Celery_150_seeds.png?v=1754899339&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | white-queen-celery-150-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Celery_-_Chinese_White_150_seeds.png?v=1754899245&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | cherry-large-hot-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/D5F3C9B3-3200-43D8-A116-E05BFE08C593.png?v=1743918455&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | cheyenne-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Cheyenne_2.png?v=1744708438&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | chile-de-arbol-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Chiledearbol.png?v=1744708637&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | chile-japones-chilli-seeds-10-seeds-copy | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/ChileJapones.png?v=1744708859&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | chiltepin-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://inheritedseeds.com/cdn/shop/products/PSX_20210913_123902_640x453_a570b09e-a700-42c2-ba91-7afff5463a33_2048x.jpg?v=1632757822 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | chinese-broccoli-kailaan-150-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Chinese_Broccoli_-_Kailaan_150_seeds.png?v=1776736079&width=533 | Harvest reviewed and mapped. Earlier stages pending.

Batch 07 passed the production build and all 44 focused browser checks. Rasmussen now has 70 generated illustrations plus ten verified originals. The library has 505 reviewed Harvest mappings.

Batch 07 deployed at 076eaf8 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44183641432).

## Rasmussen Batch 08

- Rasmussen | clementine-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-1422474861888346866.png?v=1745315303&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | collards-ole-timey-blue-100-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-2066488138417859340.png?v=1744084751&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | copia-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-182857575953057140.png?v=1744146971&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | costoluto-fiorentino-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-7564257366304778001.png?v=1744146942&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | cream-sausage-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-5762819004087334577.png?v=1745315546&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | cucumber-lebanese-20-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Cucumber_-_Lebanese_20_seeds.png?v=1787714956&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | cucumber-telegraph-20-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Cucumber_-_Telegraph_20_seeds.png?v=1787715402&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | cuor-di-bue-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-2656461158533589710.png?v=1745315777&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | czech-black-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Czech_Black_Chilli_Seeds_10_seeds.png?v=1776987573&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | dark-galaxy-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-7564257368229590292.png?v=1744146878&width=533 | Harvest reviewed and mapped. Earlier stages pending.

Batch 08 passed the production build and all 44 focused browser checks. Rasmussen now has 80 generated illustrations plus ten verified originals. The library has 515 reviewed Harvest mappings.

Batch 08 deployed at 02da7c8 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44186278756).

## Rasmussen Batch 09

- Rasmussen | devils-claw-mustard-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Devils_Claw_Mustard.png?v=1749109150&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | devils-tongue-red-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Devils_Tongue_-_Red_Chilli_Seeds_10_seeds.png?v=1780563836&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | devils-tongue-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Devils_Tongue_Chilli_Seeds.png?v=1748249825&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | duemila-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/9484D575-2D73-4A6E-B187-56297DABAA64.png?v=1743918959&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | eggplant-black-beauty-30-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Eggplant_-_Black_Beauty_30_seeds.png?v=1788037669&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | eggplant-rabi-long-green-30-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Eggplant_-_Rabi_Long_Green_30_seeds.png?v=1788035950&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | eggplant-thai-green-egg-30-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Eggplant_-_Thai_Green_Egg_30_seeds.png?v=1788131279&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | eggplant-violetta-lunga-30-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Eggplant_-_Violetta_Lunga_30_seeds.png?v=1788038582&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | egyptian-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Egyptian_Tomato_10_seeds.png?v=1777930015&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | er-jing-tiao-sichuan-cayenne-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://baobaofarm.ca/cdn/shop/products/IMG_2061-chinese_long_pepper_super_sichuan_400x_d27bd23d-44e9-4850-b611-f4d6c5faf203.webp?v=1678240926&width=1946 | Harvest reviewed and mapped. Earlier stages pending.

Batch 09 passed the production build and all 44 focused browser checks. Rasmussen now has 90 generated illustrations plus ten verified originals. The library has 525 reviewed Harvest mappings.

Batch 09 deployed at 187f670 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44188464991).

## Rasmussen Batch 10

- Rasmussen | fatalii-jigsaw-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://fatalii.net/jigsaw/1.jpg | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | feuerwerk-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-2271401902960612027.png?v=1744146853&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | fish-pepper-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/A6519973-F44A-4C6C-8D59-8CFBA18D2DD8.png?v=1743921756&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | fish-pepper-yellow-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Fish_Pepper_-_Yellow_Chilli_Seeds_10_seeds.png?v=1779484903&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | fresno-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://www.sandiaseed.com/cdn/shop/files/Fresnoonepepper.jpg?v=1755799413 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | friggitello-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AC4FC00B-07CA-404C-AEEE-E8065B5F6E1E.png?v=1743921784&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | frontera-sweet-habanero-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Frontera_Sweet_Habanero_Chilli_Seeds_10_seeds.png?v=1777863184&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | furry-red-boar-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-2581024378723723188.png?v=1744146827&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | gajo-de-melon-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-3087679337085405308.png?v=1744146793&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | garden-peach-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-8177875894228342254.png?v=1746651042&width=1946 | Harvest reviewed and mapped. Earlier stages pending.

Batch 10 passed the production build and all 44 focused browser checks. Rasmussen now has 100 generated illustrations plus ten verified originals. The library has 535 reviewed Harvest mappings.

Batch 10 deployed at bee5e40 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44190542095).

## Rasmussen Batch 11

- Rasmussen | gardener-s-delight-cherry-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-7157807500572647458.png?v=1744146760&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | german-red-strawberry-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-7157807499944239857.png?v=1744146722&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | gherkin-national-pickling-cucumber-20-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Gherkin_-_National_Pickling_Cucumber_20_seeds.png?v=1761473468&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | goats-weed-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Goats_Weed_Chilli_Seeds_10_seeds.png?v=1784085629&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | gochu-vita-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Gochu_Vita_Chilli_Seeds_10_seeds.png?v=1777856826&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | golden-nugget-variegated-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/B70BA650-B3B0-4B7A-A1D6-32B0EF081C1A.png?v=1743921840&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | green-sausage-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Green_Sausage_Tomato_10_seeds.png?v=1778209176&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | guajillo-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/C6A564F9-0127-4974-8165-1C03FDF6AB93.png?v=1743921869&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | habanada-chilli-seeds-10-seeds-copy | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Habanada_Chilli.png?v=1749109717&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | habanero-hot-lemon-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Habanero_Hot_Lemon_Chilli_Seeds_10_seeds.png?v=1777868632&width=533 | Harvest reviewed and mapped. Earlier stages pending.

Batch 11 passed the production build and all 44 focused browser checks. Rasmussen now has 110 generated illustrations plus ten verified originals. The library has 545 reviewed Harvest mappings.

Batch 11 deployed at 2b76935 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44192499697).

## Rasmussen Batch 12

- Rasmussen | habanero-mustard-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Habanero_Mustard_Chilli_Seeds_10_seeds.png?v=1785225912&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | habanero-peach-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Habanero_Peach_Chilli_Seeds.png?v=1748249732&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | habanero-red-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/DDB7B964-4AFE-47D6-A6B5-0A2977CD6777.png?v=1743922074&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | habanero-white-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-2186959235940727689.png?v=1743998845&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | habanero-yellow-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-1408962398835017570.png?v=1743998924&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | hangjiao-3-solar-flare-space-chilli-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Hangjiao_3_Solar_Flare_space_chilli_Chilli_Seeds_10_seeds.png?v=1783734136&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | hazel-may-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Hazel_May_Tomato_10_seeds.png?v=1778054902&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | hungarian-yellow-wax-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Hungarian_Yellow_Wax_Chilli_Seeds_10_seeds.png?v=1778653449&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | hurma-ukraine-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-5787587313907165709.png?v=1744146682&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | inca-red-hot-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-5269673182252388836_bceed6c1-4dc2-4d46-ba7e-a76db22832bb.png?v=1759100201&width=533 | Harvest reviewed and mapped. Earlier stages pending.

Batch 12 passed the production build and all 44 focused browser checks. Rasmussen now has 120 generated illustrations plus ten verified originals. The library has 555 reviewed Harvest mappings.

Batch 12 deployed at 0ec5e8a (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44194290847).

## Rasmussen Batch 13

- Rasmussen | indigo-gold-berries-cherry-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Indigo_Gold_Berries_Cherry_Tomato_10_seeds.png?v=1778053709&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | indigo-pear-drop-cherry-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Indigo_Pear_Drop_Cherry_Tomato_10_seeds.png?v=1777975054&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | indigo-rose-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-2271401903405726133.png?v=1744146661&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | italian-red-cherry-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-5255039740486687926.png?v=1746651869&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | j-walsh-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-5381140525062187745.png?v=1746651305&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | jalapeno-el-jefe-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-1343660206598141893.png?v=1743998785&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | jalapeno-farmers-market-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Jalape_o_-_Farmers_Market.png?v=1749028003&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | jalapeno-mega-jefe-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Jalapeo_-_Mega_Jefe_Chilli_Plant_in_4_pot.png?v=1760082869&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | jalapeno-purple-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-1408962402024820873_fcfdce6a-a64b-46e6-91c9-c28948cad317.png?v=1759100207&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | jamaican-mushroom-red-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/JamaicanMushroom-Red.png?v=1745009184&width=1946 | Harvest reviewed and mapped. Earlier stages pending.

Batch 13 passed the production build and all 44 focused browser checks. Rasmussen now has 130 generated illustrations plus ten verified originals. The library has 565 reviewed Harvest mappings.

Batch 13 deployed at a806db3 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44196165321).

## Rasmussen Batch 14

- Rasmussen | jamaican-mushroom-yellow-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/JamaicanMushroom-Yellow.png?v=1745009253&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | japanese-black-trifele-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-4829446491312583573.png?v=1744146570&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | jaune-flamme-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-2581024378773043568.png?v=1744146541&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | jicama-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-6847059145466812691.png?v=1744084789&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | jimmy-nardello-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Jimmy_Nardello_Chilli_Seeds_10_seeds.png?v=1778230350&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | jwala-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Jwala_Chilli_Seeds_9c61e14e-bea7-4c96-8b26-36d5e685118d.png?v=1759100211&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | kale-dazzling-blue-lacinato-100-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Kale_-__Dazzling_Blue_Lacinato_100_seeds.png?v=1754900115&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | kiwi-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-6908983620458414450.png?v=1744146512&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | ks-lemon-starburst-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/KS_Lemon_Starburst_Chilli_Seeds_10_seeds.png?v=1783732402&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | ks-starrscream-chocolate-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/KS_Starrscream_Chocolate_Chilli_Seeds_10_seeds.png?v=1784866939&width=533 | Harvest reviewed and mapped. Earlier stages pending.

Batch 14 passed the production build and all 44 focused browser checks. Rasmussen now has 140 generated illustrations plus ten verified originals. The library has 575 reviewed Harvest mappings.

Batch 14 deployed at f459b7f (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44197925190).

## Rasmussen Batch 15

- Rasmussen | ks-white-thai-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-5878785031049799848.png?v=1743998737&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | large-mennonite-pink-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-7957196436250196799.png?v=1744146468&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | lemon-drop-cherry-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-2907535371344413881.png?v=1744146444&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | lettuce-alkindus-75-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-6847059142265090549.png?v=1744084809&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | lettuce-drunken-woman-150-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Lettuce_-_Drunken_Woman_150_seeds.png?v=1772309976&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | lettuce-flashy-trout-s-back150-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-5787587331222256472.png?v=1744084824&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | lettuce-green-deer-tongue-150-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-1130865318206925652.png?v=1744084851&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | lettuce-iceberg-150-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Lettuce_-_Iceberg_150_seeds.png?v=1772309898&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | lettuce-italienischer-150-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-6589228066794776671.png?v=1744084867&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | lettuce-pomegranate-crunch-75-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-4164039663388251542.png?v=1744084887&width=533 | Harvest reviewed and mapped. Earlier stages pending.

Batch 15 passed the production build and all 44 focused browser checks. Rasmussen now has 150 generated illustrations plus ten verified originals. The library has 585 reviewed Harvest mappings.

Batch 15 deployed at 1da34b3 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44199702285).

## Rasmussen Batch 16

- Rasmussen | lettuce-truchas-75-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-4350939049818573778.png?v=1744084909&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | luffa-sponge-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Luffa_-_Sponge_10_seeds.png?v=1758433868&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | malabar-spinach-red-15-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-3762093397797672063.png?v=1744084930&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | malawi-piquante-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Malawi_Piquante.png?v=1746699902&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | mambo-orange-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/MamboOrange.png?v=1744710564&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | marconi-yellow-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Marconi_-_Yellow_Chilli_Seeds_10_seeds.png?v=1777788309&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | matts-wild-cherry-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Matt_s_Wild_Cherry_Tomato_10_seeds.png?v=1746069097&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | honeydew-melon-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Honeydew_Melon_10_seeds.png?v=1772915383&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | mexico-midget-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-9114624619058412904.png?v=1746651512&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | mexico-pink-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-2868128872858453373.png?v=1744146418&width=1946 | Harvest reviewed and mapped. Earlier stages pending.

Batch 16 passed the production build and all 44 focused browser checks. Rasmussen now has 160 generated illustrations plus ten verified originals. The library has 595 reviewed Harvest mappings.

Batch 16 deployed at f708b5f (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44201219460).

## Rasmussen Batch 17

- Rasmussen | mirabelle-blanche-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-1253591471152994834.png?v=1746651718&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | moonglow-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Moonglow_Tomato_10_seeds_bbd9ad1f-c728-4c12-830d-67e85453339e.png?v=1775001908&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | murupi-amarela-yellow-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Murupi_Amarela_Yellow_Chilli_Seeds_10_seeds.png?v=1746699796&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | naga-red-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-2776930785669589852.png?v=1743998715&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | naga-yellow-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://www.gorolchilli.cz/assets/images/products/27/naga-yellow-8_logo1280x.jpg | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | new-zealand-spinach-30-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/New_Zealand_Spinach_30_seeds.png?v=1753781144&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | oaxacan-jewel-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-6813282144860766723.png?v=1744146367&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | oley-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Oley_Tomato_10_seeds.png?v=1778209463&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | onion-ailsa-craig-75-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-8741948687121267997.png?v=1744084945&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | onion-pukekohe-long-keeper-100-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Onion_-_Pukekohe_Long_Keeper_150_seeds.png?v=1776737592&width=1946 | Harvest reviewed and mapped. Earlier stages pending.

Batch 17 passed the production build and all 44 focused browser checks. Rasmussen now has 170 generated illustrations plus ten verified originals. The library has 605 reviewed Harvest mappings.

Batch 17 deployed at e00f5ac (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44203189074).

## Rasmussen Batch 18

- Rasmussen | onion-red-long-of-tropea-100-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-6648900758604588289.png?v=1744084963&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | onion-walla-walla-sweet-100-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-8741948688508073388.png?v=1744084980&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | orange-icicle-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Orange_Icicle_Tomato_10_seeds.png?v=1760685733&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | orange-lantern-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Orange_Lantern_Chilli_Seeds.png?v=1748249647&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | orange-russian-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-8038261245098974066.png?v=1744146320&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | oxhorn-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Oxhorn.png?v=1744711534&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | habanero-oz-latern-white-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://junglestory.co.nz/cdn/shop/files/Habanero_-_Oz_Latern_White_Chilli_Seeds_10_seeds.png?v=1790072430 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | pak-choi-canton-white-dwarf-150-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Pak_Choi_-_Canton_White_Dwarf_150_seeds.png?v=1776737063&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | pak-choi-red-choi-f1-150-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Pak_Choi_-_Red_Choi_F1_150_seeds.png?v=1789246431&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | pasilla-chilaca-bajio-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Pasilla_Chilaca_Bajio_Chilli_Seeds_10_seeds.png?v=1783736775&width=533 | Harvest reviewed and mapped. Earlier stages pending.

Batch 18 passed the production build and all 44 focused browser checks. Rasmussen now has 180 generated illustrations plus ten verified originals. The library has 615 reviewed Harvest mappings.

Batch 18 deployed at ca775ba (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44205006498).

## Rasmussen Batch 19

- Rasmussen | peach-blow-sutton-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Peach_Blow_Sutton_Tomato_10_seeds.png?v=1778210579&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | peri-peri-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-5269673181948577483.png?v=1743998636&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | pigeon-pea-30-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Pigeon_Pea_30_seeds.png?v=1788150139&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | pimenta-leopard-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-5909184329083020445.png?v=1743998614&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | pimenta-luna-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-5269673182278396200.png?v=1743998594&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | pink-berkeley-tie-dye-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-8515642803700456589.png?v=1744146209&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | pink-grapefruit-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-2066488137067966195.png?v=1744146158&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | poblano-san-luis-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-5909184329813868253.png?v=1743998568&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | popcorn-mushroom-75-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Popcorn_-_Mushroom_75_seeds.png | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | popcorn-ruby-red-75-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Popcorn_-_Ruby_Red_75_seeds.png?v=1791966771&width=533 | Harvest reviewed and mapped. Earlier stages pending.

Batch 19 passed the production build and all 44 focused browser checks. Rasmussen now has 190 generated illustrations plus ten verified originals. The library has 625 reviewed Harvest mappings.

Batch 19 deployed at 13c1212 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44206915144).

## Rasmussen Batch 20

- Rasmussen | principe-borghese-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-5543267051267669429.png?v=1744146116&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | puerto-rican-yellow-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Puerto_Rican_Yellow_Chilli_Seeds_10_seeds.png?v=1783737454&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | pumpkin-butternut-waltham-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Pumpkin_-_Butternut_Waltham_10_seeds.png?v=1753699341&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | pumpkin-kabocha-japanese-pumpkin-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Pumpkin_-_Kabocha_Japanese_Pumpkin_10_seeds.png?v=1753699510&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | pumpkin-kumi-kumi-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Pumpkin_-_Kumi_Kumi_10_seeds.png?v=1762211725&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | pumpkin-sugar-pie-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Pumpkin_-_Sugar_Pie_10_seeds.png?v=1753699491&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | purple-pumpkin-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/PurplePumpkin.png?v=1744711893&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | purple-tiger-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/PurpleTiger.png?v=1744712205&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | purple-ufo-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-2776930786462616704.png?v=1743998542&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | purple-varigetta-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Purple_Varigetta_Chilli_Seeds_10_seeds.png?v=1778654387&width=1946 | Harvest reviewed and mapped. Earlier stages pending.

Batch 20 passed the production build and all 44 focused browser checks. Rasmussen now has 200 generated illustrations plus ten verified originals. The library has 635 reviewed Harvest mappings.

Batch 20 deployed at d833157 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44208691557).

## Rasmussen Batch 21

- Rasmussen | quinoa-taiwanese-giant-tree-spinach-100-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Quinoa_-_Taiwanese_Giant_Tree_Spinach_100_seeds.png?v=1754902947&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | radicchio-palla-rossa-500-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Radicchio_-_Palla_Rossa_500_seeds.png?v=1788035010&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | radish-crayon-colours-mix-250-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Radish_-_Crayon_Colours_Mix_250_seeds.png?v=1762418341&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | radish-daikon-relish-cross-75-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Radish_-_Daikon_Relish_Cross_75_seeds.png?v=1753700876&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | radish-easter-egg-mix-250-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Radish_-_Easter_Egg_Mix_250_seeds.png?v=1762418516&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | radish-french-breakfast-250-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Radish_-_French_Breakfast_250_seeds.png?v=1772009023&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | radish-hailstone-250-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Radish_-_Hailstone_250_seeds.png?v=1789110876&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | radish-rats-tail-75-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Radish_-_Rats_Tail_75_seeds.png?v=1753701027&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | radish-white-icicle-250-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Radish_-_White_Icicle_250_seeds.png?v=1753700853&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | ramitode-de-dulce-currant-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Ramitode_de_dulce_Currant_Tomato.png?v=1746528272&width=533 | Harvest reviewed and mapped. Earlier stages pending.

Batch 21 passed the production build and all 44 focused browser checks. Rasmussen now has 210 generated illustrations plus ten verified originals. The library has 645 reviewed Harvest mappings.

Batch 21 deployed at 1ea5bff (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44210436077).

## Rasmussen Batch 22

- Rasmussen | reisetomate-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-1563213948315988206.png?v=1746652024&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | rhubarb-cardinal-crunch-20-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Rhubarb_-_Cardinal_Crunch_20_seeds.png?v=1788509158&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | rocoto-aji-large-red-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-5909184325770644561.png?v=1743998518&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | rocoto-manzano-orange-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-5208874586627816740.png?v=1743981199&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | rocoto-manzano-red-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Rocoto_Manzano_-_Red_chilli_Seeds_10_seeds.png?v=1780036726&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | rocoto-manzano-yellow-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Rocoto_Manzano_-_Yellow.png?v=1748339671&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | rose-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-3613474609564314936.png?v=1744146024&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | san-marzano-redorta-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/San_Marzano_Redorta_Tomato_10_seeds.png?v=1773472638&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | scabitha-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Scabitha_Tomato_10_seeds.png?v=1778210555&width=533 | Harvest reviewed and mapped. Earlier stages pending.

Rocoto Manzano Red Flat remains pending an exact cultivar photograph. The nine reviewed entries passed the production build and all 44 focused browser checks. Rasmussen now has 229 Harvest illustrations including ten verified originals.

Batch 22 deployed at 87b12da (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44212113103).

## Rasmussen Batch 23

- Rasmussen | scallopini-benning-s-green-tint-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Scallopini_-_Bennings_Green_Tint_10_seeds.png?v=1753781332&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | scallopini-golden-orb-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://junglestory.co.nz/cdn/shop/files/Scallopini_-_Golden_Orb_10_seeds.png?v=1793407831 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | scallopini-white-pearl-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Scallopini_-_White_Pearl_10_seeds.png?v=1762418109&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | scarletts-chilli-varigatted-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://www.coqhot.com/wp-content/uploads/2026/07/scarlett-variegated-1.webp | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | scoresby-dwarf-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Scoresby_Dwarf_Tomato_10_seeds.png?v=1778210118&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | scotch-bonnet-red-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/ScotchBonnetRed.png?v=1744887502&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | serrano-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Serrano_1.png?v=1744887917&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | blackout-shishito-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Blackout_Shishito_Chilli_Seeds_10_seeds.png?v=1783732196&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | crimson-shiso-perilla-150-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-7167940616277179078.png?v=1744085004&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | green-shiso-perilla-150-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Shiso_Green_perilla_150_seeds.png?v=1775288053&width=1946 | Harvest reviewed and mapped. Earlier stages pending.

Batch 23 passed the production build and all 44 focused browser checks. Rasmussen now has 239 Harvest illustrations including ten verified originals.

## Kings Seeds Harvest Reference Check

- Asparagus pea | Inspected the UK supplier photograph showing young winged pods alongside a flower. Saved locally as references/asparagus-pea-harvest-candidate.jpg for Harvest artwork. https://www.kingsseeds.com/images/thumbs/0009022_10301-1_550.jpeg
- Chia | Confirmed mature seed heads and seeds as the Harvest subject. The supplier image download returned HTTP 403. https://www.kingsseeds.co.nz/products/chia
- Takinogawa Long burdock | The candidate root-photo download returned HTTP 403. https://www.rareseeds.com/burdock-takinogawa
- Takinogawa burdock | Downloaded and visually verified the named RareSeeds harvest photograph from its image host. Saved locally as references/takinogawa-burdock-harvest.jpg. The image shows long, slender, tan harvested taproots. https://www.rareseeds.com/burdock-takinogawa
- Chia | Saved and visually checked the Kings Seeds V8458 catalogue photograph as references/chia-supplier-v8458.png. Use it for spike structure. The green spikes are a pre-harvest reference. Use the labelled Commons photograph for mature seed shape and markings. https://www.kingsseeds.co.nz/products/chia and https://commons.wikimedia.org/wiki/File:Semillas_de_Ch%C3%ADa.jpg
- Garnet Red amaranth | Saved and visually reviewed the Kings Seeds photo of the named young-leaf selection as references/garnet-red-young-leaf.png. Use its burgundy leaves and magenta stems alongside the vegetable listing, which identifies young leaves as a harvest. https://www.kingsseeds.co.nz/products/amaranth-garnet-red and https://www.kingsseeds.co.nz/products/amaranth-garnet-red-microgreen

### Rasmussen growth-stage reference follow-up

- Aji Cito | The supplier plant listing identifies the exact cultivar and documents its bushy growth habit and green-to-yellow ripening. https://rasmussengardens.co.nz/products/aji-cito-chilli-plant-in-4-pot
- Aji Ahuachapán | The supplier plant listing identifies the exact cultivar and documents its tall habit and tapered orange ripe pods. https://rasmussengardens.co.nz/products/aji-ahuachapan-chilli-plant-in-4-pot
- The ten seed-product JSON lookups returned HTTP 403. The two plant listings supply stage context while photo retrieval remains pending.

- Rocoto Manzano Red Flat | Exact product slug returned no indexed results. Image search surfaced standard Manzano Red without a Flat selection label, so those photos were excluded. The archive availability request could not be verified. All six slots remain pending an exact photo.

### Pepper early-stage references

- First Sprout | Use two narrow pointed cotyledons on a short emerging stem. UC Agriculture and Natural Resources documents the cotyledon shape and distinguishes the later true leaves. https://ucanr.edu/blog/stanislaus-sprout/article/growing-peppers-seed-part-1-supplies-planting-seeds-and-seedlings
- Baby Plant | Show the first true leaves and continued shoot growth above the cotyledons. Kansas State Research and Extension describes this transition in its transplant guide. https://www.brown.k-state.edu/lawn-garden/documents/Growing%20Your%20Own%20Vegetable%20Transplants.pdf
- The pepper seedling study supplies a Capsicum annuum developmental comparison in Figure 1. Use it as species-level evidence alongside the named cultivar photo. https://pmc.ncbi.nlm.nih.gov/articles/PMC4577988/

### Tomato early-stage references

- First Sprout | Show a slender shoot with two narrow smooth-edged cotyledons. Western Michigan University Figure 11 documents their shape. https://files.wmich.edu/s3fs-public/attachments/u5694/2024/Plant_Nutrient_Deficiency.pdf
- Baby Plant | Show the first true leaves above and between the lower cotyledons. The University of Kentucky tomato grafting guide labels both structures on a seedling. Use the named supplier photograph separately for cultivar traits. https://ccd.uky.edu/sites/default/files/2026-03/ccd-ta-04_gh-grafting_accessible.pdf

### Cucurbit early-stage references

- First Sprout | Use two large fleshy cotyledons with smooth edges on an emerging stem. The International Seed Testing Association documents this structure for melon and squash, including pumpkin. https://www.idseed.org/ckfinder/userfiles/files/M%26P%202023%20En.pdf
- Baby Plant | Show a developing true leaf above the cotyledons. Ohio State's pumpkin development slides show the transition, and the University of Florida squash guide shows the contrast between oval cotyledons and lobed true leaves. Use the exact supplier photo for mature cultivar traits. https://bpb-us-w2.wpmucdn.com/u.osu.edu/dist/f/4395/files/2017/11/Pumpkin-prod-basics-swveg2017-1a1jw7y.pdf and https://ipm.ifas.ufl.edu/pdfs/reflective_mulch_whiteflies_and_squash.pdf
- Rocoto Manzano Red Flat | Checked the available workspace HTML, attachment names, and repository history for the exact cultivar. The recorded concept and catalogue records identify the cultivar, but no labelled source photograph was recovered from those files.

Batch 23 deployed at f30f63e (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44213755510).

## Rasmussen Batch 24

- Rasmussen | red-shiso-perilla-150-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Shiso_Red_perilla_150_seeds.png?v=1775288174&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | silverbeet-silverado-compacta-150-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Silverbeet_-_Silverado_Compacta_150_seeds.png | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | silvery-fir-tree-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Silvery_Fir_Tree_Tomato_10_seeds.png?v=1778092604&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | speckled-roman-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Speckled_Roman_Tomato_10_seeds.png?v=1777975331&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | delicata-squash-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Delicata_squash_10_seeds.png?v=1747222927&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | squash-tromba-d-albenga-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Squash_-_Tromba_dAlbenga_10_seeds.png?v=1753700034&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | sugar-rush-cream-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/sugarrushcream.png?v=1745008918&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | sugar-rush-peach-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/sugarrushpeach_1.png?v=1744712651&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | sugar-rush-peach-stumpy-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Sugar_Rush_Peach_Stumpy_Chilli_Plant_in_4_pot.png?v=1760083131&width=600 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | sugar-rush-red-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://scovillecanada.com/cdn/shop/files/SugarRushRed.png?v=1728057934 | Harvest reviewed and mapped. Earlier stages pending.

Batch 24 passed the production build and all 44 focused browser checks. Rasmussen now has 249 Harvest illustrations including ten verified originals.

Batch 24 deployed at 13c7636 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44578302955).

## Rasmussen Batch 25

- Rasmussen | sugar-rush-stripey-chilli-seeds-10-seeds-copy | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/SugarRushStripey.png?v=1744713480&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | sunrise-bumble-bee-cherry-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-8814006281680414674.png?v=1744145960&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | sweet-paprika-yugoslavia-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Sweet_Paprika__Yugoslavia_Chilli_Seeds_10_seeds.png?v=1778231240&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | tabasco-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://www.worldofchillies.com/shop/tabasco-chilli/files/stack_drag_image-701.jpg | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | tangerine-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Tangerine_Tomato_10_seeds.png?v=1746154819&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | tiger-melon-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Tiger_Melon_10_seeds.png?v=1747222964&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | tlacolula-pink-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://res.cloudinary.com/rareseeds/image/upload/c_lpad%2Cdpr_1.0%2Cf_auto%2Cq_auto/v1/media/catalog/product/t/o/tomato-tlacolula-pink-lss-dsc_2642.jpg?_i=AB | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | tomatillo-amethyst-emerald-geodes-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Tomatillo_Amethyst__Emerald_Geodes_10_seeds.png?v=1780986349&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | tomatillo-chupon-de-malinalco-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Tomatillo_Chupon_de_Malinalco.png?v=1746959555&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | tomatillo-plaza-latina-giant-green-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-7167940618612770854.png?v=1744794183&width=1946 | Harvest reviewed and mapped. Earlier stages pending.

Batch 25 passed the production build and all 44 focused browser checks. Rasmussen now has 259 Harvest illustrations including ten verified originals.

Batch 25 deployed at 2ea410c (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44580920849).

## Rasmussen Batch 26

- Rasmussen | tomatillo-purple-keepers-modern-landrace-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Tomatillo_Purple_Keepers_Modern_Landrace_10_seeds.png?v=1780985587&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | tomatillo-purple-violeta-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Tomatillo_-_Purple_Violeta_1.png?v=1744794751&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | tomatillo-verde-puebla-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-8814006280104046405.png?v=1744794208&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | turnip-wonnegold-50-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://junglestory.co.nz/cdn/shop/files/Turnip_-_Wonnegold_50_seeds_3259f8a1-cd22-4894-b934-a6b1668691ad.png?v=1793303785 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | uchu-cream-variegated-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Uchu_Cream_Variegated_Chilli_Seeds.png?v=1748340090&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | variegated-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-4978068362576461863.png?v=1746652776&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | vintage-wine-stripped-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Vintage_Wine_-_Stripped_Tomato_10_seeds.png?v=1778210029&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | white-chupetinho-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-5909184329455919322.png?v=1743980817&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | white-coyote-zan-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-2186959234679160227.png?v=1743980775&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | white-wonder-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-7005811031023466699.png?v=1744145916&width=1946 | Harvest reviewed and mapped. Earlier stages pending.

Batch 26 passed the production build and all 44 focused browser checks. Rasmussen now has 269 Harvest illustrations including ten verified originals.

Batch 26 deployed at bedb967 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44583187367).

## Rasmussen Batch 27

- Rasmussen | window-box-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-8741948686990336574.png?v=1744145897&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | yaki-blue-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Yaki_Blue_Chilli.png?v=1749030986&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | yellow-banana-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Yellow_Banana_Chilli_Seeds_10_seeds.png?v=1778653962&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | yellow-cropper-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Yellow_Cropper_Tomato_10_seeds_544097f1-1b20-4e0e-ab87-d6e67a092df2.png?v=1778209891&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | yellow-yummy-tomato-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Yellow_Yummy_Tomato_10_seeds.png?v=1746154952&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | zatta-melon-15-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/ZattaMelon.png?v=1744237569&width=1946 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | zebrange-stripey-chilli-seeds-10-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Zebrange_Stripey_Chilli_Seeds_10_seeds.png?v=1779172246&width=533 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | zucchini-black-beauty-15-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://junglestory.co.nz/cdn/shop/files/Zucchini__Black_Beauty_15_seeds_e6991e79-e3d9-44fa-9569-4c03453a79cb.png?v=1792374785 | Harvest reviewed and mapped. Earlier stages pending.
- Rasmussen | zucchini-yellow-15-seeds | generated_qa_passed | 512 px master and 128 px gallery | https://junglestory.co.nz/cdn/shop/files/Zucchini__Yellow_15_seeds.png?v=1788855184 | Harvest reviewed and mapped. Earlier stages pending.

Batch 27 passed the production build and all 44 focused browser checks. Rasmussen now has 278 Harvest illustrations including ten verified originals.

Batch 27 deployed at a4d0730 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44585745943).

## Kings Seeds Harvest Completion

- Kings Seeds | amaranth-garnet-red | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/cdn/shop/files/V8379-2_1080x.png?v=1721082912 | Harvest visually reviewed and mapped.
- Kings Seeds | asparagus-pea | 512 px master and 128 px gallery | https://www.kingsseeds.com/images/thumbs/0009022_10301-1_550.jpeg | Harvest visually reviewed and mapped.
- Kings Seeds | burdock-takinogawa-long | 512 px master and 128 px gallery | https://www.rareseeds.com/burdock-takinogawa | Harvest visually reviewed and mapped.
- Kings Seeds | chia | 512 px master and 128 px gallery | https://www.kingsseeds.co.nz/products/chia | Harvest visually reviewed and mapped.

Kings Seeds now has 429 Harvest mappings. Production build and all 44 focused gallery checks passed.

Kings Seeds Harvest completion deployed at eb2fdfc (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44587081957).

## Rasmussen Growth Batch 01

- Rasmussen | aji-ahuachapan-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Aji_Ahuachapan_ac300ebb-72a5-41c6-8e94-b329d88bfc10.png?v=1759098423&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-ahuachapan-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Aji_Ahuachapan_ac300ebb-72a5-41c6-8e94-b329d88bfc10.png?v=1759098423&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-ahuachapan-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Aji_Ahuachapan_ac300ebb-72a5-41c6-8e94-b329d88bfc10.png?v=1759098423&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-ahuachapan-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Aji_Ahuachapan_ac300ebb-72a5-41c6-8e94-b329d88bfc10.png?v=1759098423&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-ahuachapan-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Aji_Ahuachapan_ac300ebb-72a5-41c6-8e94-b329d88bfc10.png?v=1759098423&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-cito-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiCito.png?v=1744625451&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-cito-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiCito.png?v=1744625451&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-cito-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiCito.png?v=1744625451&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-cito-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiCito.png?v=1744625451&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-cito-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiCito.png?v=1744625451&width=1946 | Visually reviewed and mapped.

Aji Cito and Aji Ahuachapan each have six mapped stages. The seed and seedling anatomy is based on pepper growth references. Production build and all 44 focused gallery checks passed.

Rasmussen Growth Batch 01 deployed at 7bf752c (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44590094818).

## Rasmussen Growth Batch 02

- Rasmussen | aji-amarillo-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Aji_Amarillo_2.png?v=1745008492&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-amarillo-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Aji_Amarillo_2.png?v=1745008492&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-amarillo-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Aji_Amarillo_2.png?v=1745008492&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-amarillo-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Aji_Amarillo_2.png?v=1745008492&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-amarillo-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Aji_Amarillo_2.png?v=1745008492&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-berry-amarillo-long-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiBerryAmarilloLong.png?v=1744686578 | Visually reviewed and mapped.
- Rasmussen | aji-berry-amarillo-long-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiBerryAmarilloLong.png?v=1744686578 | Visually reviewed and mapped.
- Rasmussen | aji-berry-amarillo-long-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiBerryAmarilloLong.png?v=1744686578 | Visually reviewed and mapped.
- Rasmussen | aji-berry-amarillo-long-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiBerryAmarilloLong.png?v=1744686578 | Visually reviewed and mapped.
- Rasmussen | aji-berry-amarillo-long-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiBerryAmarilloLong.png?v=1744686578 | Visually reviewed and mapped.

Aji Amarillo and Aji Berry Amarillo Long each have six mapped stages. Seed and seedling anatomy follows the pepper references. The production build and all 44 focused gallery checks passed.

Rasmussen Growth Batch 02 deployed at c91f575 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44592593426).

## Rasmussen Growth Batch 03

- Rasmussen | aji-brazilian-pumpkin-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiBrazilianPumpkin.png?v=1744624078&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-brazilian-pumpkin-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiBrazilianPumpkin.png?v=1744624078&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-brazilian-pumpkin-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiBrazilianPumpkin.png?v=1744624078&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-brazilian-pumpkin-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiBrazilianPumpkin.png?v=1744624078&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-brazilian-pumpkin-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiBrazilianPumpkin.png?v=1744624078&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-champion-chilli-seeds-10-seeds-copy | seed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiChampion.png?v=1744624572&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-champion-chilli-seeds-10-seeds-copy | first-sprout | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiChampion.png?v=1744624572&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-champion-chilli-seeds-10-seeds-copy | baby-plant | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiChampion.png?v=1744624572&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-champion-chilli-seeds-10-seeds-copy | semi-mature | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiChampion.png?v=1744624572&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-champion-chilli-seeds-10-seeds-copy | pre-harvest | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiChampion.png?v=1744624572&width=1946 | Visually reviewed and mapped.

Aji Brazilian Pumpkin and Aji Champion each have six mapped stages. Seed and seedling anatomy follows the pepper references. The production build and all 44 focused gallery checks passed.

Rasmussen Growth Batch 03 deployed at 983abf8 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44594869065).

## Rasmussen Growth Batch 04

- Rasmussen | aji-charapita-peach-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiCharapita_Peach.png?v=1744686874&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-charapita-peach-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiCharapita_Peach.png?v=1744686874&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-charapita-peach-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiCharapita_Peach.png?v=1744686874&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-charapita-peach-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiCharapita_Peach.png?v=1744686874&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-charapita-peach-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiCharapita_Peach.png?v=1744686874&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-charapita-armarillo-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-5967731109627236000.png?v=1743910109&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-charapita-armarillo-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-5967731109627236000.png?v=1743910109&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-charapita-armarillo-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-5967731109627236000.png?v=1743910109&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-charapita-armarillo-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-5967731109627236000.png?v=1743910109&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-charapita-armarillo-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0001-5967731109627236000.png?v=1743910109&width=1946 | Visually reviewed and mapped.

Aji Charapita Amarillo and Aji Charapita Peach each have six mapped stages. Seed and seedling anatomy follows the pepper references. The production build and all 44 focused gallery checks passed.

Rasmussen Growth Batch 04 deployed at ab20ff5 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44597097189).

## Rasmussen Growth Batch 05

- Rasmussen | 7-pot-jonah-yellow-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/2135891885.jpg?v=1745969573&width=1946 | Visually reviewed and mapped.
- Rasmussen | 7-pot-jonah-yellow-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/2135891885.jpg?v=1745969573&width=1946 | Visually reviewed and mapped.
- Rasmussen | 7-pot-jonah-yellow-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/2135891885.jpg?v=1745969573&width=1946 | Visually reviewed and mapped.
- Rasmussen | 7-pot-jonah-yellow-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/2135891885.jpg?v=1745969573&width=1946 | Visually reviewed and mapped.
- Rasmussen | 7-pot-jonah-yellow-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/2135891885.jpg?v=1745969573&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-charapon-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiCharapon.png?v=1744625103&width=1445 | Visually reviewed and mapped.
- Rasmussen | aji-charapon-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiCharapon.png?v=1744625103&width=1445 | Visually reviewed and mapped.
- Rasmussen | aji-charapon-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiCharapon.png?v=1744625103&width=1445 | Visually reviewed and mapped.
- Rasmussen | aji-charapon-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiCharapon.png?v=1744625103&width=1445 | Visually reviewed and mapped.
- Rasmussen | aji-charapon-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiCharapon.png?v=1744625103&width=1445 | Visually reviewed and mapped.

Aji Charapon and 7 Pot Jonah Yellow each have six mapped stages. Seed and seedling anatomy follows the pepper references. The production build and all 44 focused gallery checks passed.

Rasmussen Growth Batch 05 deployed at f9a04c8 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44599546189).

## Rasmussen Growth Batch 06

- Rasmussen | aji-colorado-orange-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/2A9862F7-84E7-4205-B692-B9F67971CD71.png?v=1743915279&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-colorado-orange-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/2A9862F7-84E7-4205-B692-B9F67971CD71.png?v=1743915279&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-colorado-orange-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/2A9862F7-84E7-4205-B692-B9F67971CD71.png?v=1743915279&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-colorado-orange-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/2A9862F7-84E7-4205-B692-B9F67971CD71.png?v=1743915279&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-colorado-orange-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/2A9862F7-84E7-4205-B692-B9F67971CD71.png?v=1743915279&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-cristal-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://southdevonchillifarm.co.uk/cdn/shop/files/AjiCrystal2_d6d2123f-34ff-4b6c-b0dc-1743fc2f7c91.jpg?v=1726582142&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-cristal-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://southdevonchillifarm.co.uk/cdn/shop/files/AjiCrystal2_d6d2123f-34ff-4b6c-b0dc-1743fc2f7c91.jpg?v=1726582142&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-cristal-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://southdevonchillifarm.co.uk/cdn/shop/files/AjiCrystal2_d6d2123f-34ff-4b6c-b0dc-1743fc2f7c91.jpg?v=1726582142&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-cristal-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://southdevonchillifarm.co.uk/cdn/shop/files/AjiCrystal2_d6d2123f-34ff-4b6c-b0dc-1743fc2f7c91.jpg?v=1726582142&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-cristal-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://southdevonchillifarm.co.uk/cdn/shop/files/AjiCrystal2_d6d2123f-34ff-4b6c-b0dc-1743fc2f7c91.jpg?v=1726582142&width=1946 | Visually reviewed and mapped.

Aji Colorado Orange and Aji Cristal each have six mapped stages. Seed and seedling anatomy follows the pepper references. The production build and all 44 focused gallery checks passed.

Rasmussen Growth Batch 06 deployed at 26b9ec1 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44601702937).

## Rasmussen Growth Batch 07

- Rasmussen | aji-fantasy-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiFantasy.png?v=1744687289&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-fantasy-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiFantasy.png?v=1744687289&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-fantasy-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiFantasy.png?v=1744687289&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-fantasy-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiFantasy.png?v=1744687289&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-fantasy-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiFantasy.png?v=1744687289&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-giallo-arancio-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiGialloArancio.png?v=1744625909&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-giallo-arancio-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiGialloArancio.png?v=1744625909&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-giallo-arancio-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiGialloArancio.png?v=1744625909&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-giallo-arancio-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiGialloArancio.png?v=1744625909&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-giallo-arancio-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiGialloArancio.png?v=1744625909&width=1946 | Visually reviewed and mapped.

Aji Fantasy and Aji Giallo Arancio each have six mapped stages. Seed and seedling anatomy follows the pepper references. The production build and all 44 focused gallery checks passed.

Rasmussen Growth Batch 07 deployed at b882841 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44603939449).

## Rasmussen Growth Batch 08

- Rasmussen | aji-guyana-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/D722CEB6-17ED-49B0-AF38-302ED10C535E.png?v=1743915362&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-guyana-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/D722CEB6-17ED-49B0-AF38-302ED10C535E.png?v=1743915362&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-guyana-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/D722CEB6-17ED-49B0-AF38-302ED10C535E.png?v=1743915362&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-guyana-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/D722CEB6-17ED-49B0-AF38-302ED10C535E.png?v=1743915362&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-guyana-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/D722CEB6-17ED-49B0-AF38-302ED10C535E.png?v=1743915362&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-lemon-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/710A1E46-3BB0-4B24-90C3-7E0340981A4A_5df4fdc9-6b7a-410a-8dfb-9c2fd78b6a33.png?v=1759100133&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-lemon-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/710A1E46-3BB0-4B24-90C3-7E0340981A4A_5df4fdc9-6b7a-410a-8dfb-9c2fd78b6a33.png?v=1759100133&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-lemon-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/710A1E46-3BB0-4B24-90C3-7E0340981A4A_5df4fdc9-6b7a-410a-8dfb-9c2fd78b6a33.png?v=1759100133&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-lemon-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/710A1E46-3BB0-4B24-90C3-7E0340981A4A_5df4fdc9-6b7a-410a-8dfb-9c2fd78b6a33.png?v=1759100133&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-lemon-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/710A1E46-3BB0-4B24-90C3-7E0340981A4A_5df4fdc9-6b7a-410a-8dfb-9c2fd78b6a33.png?v=1759100133&width=1946 | Visually reviewed and mapped.

Aji Guyana and Aji Lemon each have six mapped stages. Seed and seedling anatomy follows the pepper references. The production build and all 44 focused gallery checks passed.

Rasmussen Growth Batch 08 deployed at 334c0c6 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44606659221).

## Rasmussen Growth Batch 09

- Rasmussen | aji-lemon-starburst-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiLemonStarburst.png?v=1744690396&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-lemon-starburst-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiLemonStarburst.png?v=1744690396&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-lemon-starburst-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiLemonStarburst.png?v=1744690396&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-lemon-starburst-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiLemonStarburst.png?v=1744690396&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-lemon-starburst-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiLemonStarburst.png?v=1744690396&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-mango-stumpy-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0F6FC353-1E27-4AA7-8041-9CBD0A533FC7.png?v=1743915417 | Visually reviewed and mapped.
- Rasmussen | aji-mango-stumpy-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0F6FC353-1E27-4AA7-8041-9CBD0A533FC7.png?v=1743915417 | Visually reviewed and mapped.
- Rasmussen | aji-mango-stumpy-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0F6FC353-1E27-4AA7-8041-9CBD0A533FC7.png?v=1743915417 | Visually reviewed and mapped.
- Rasmussen | aji-mango-stumpy-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0F6FC353-1E27-4AA7-8041-9CBD0A533FC7.png?v=1743915417 | Visually reviewed and mapped.
- Rasmussen | aji-mango-stumpy-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/0F6FC353-1E27-4AA7-8041-9CBD0A533FC7.png?v=1743915417 | Visually reviewed and mapped.

Aji Lemon Stumpy and Aji Mango Stumpy each have six mapped stages. Seed and seedling anatomy follows the pepper references. The production build and all 44 focused gallery checks passed.

Rasmussen Growth Batch 09 deployed at 7e45902 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44609543750).

## Rasmussen Growth Batch 10

- Rasmussen | aji-melocoton-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiMelocoton_1.png?v=1745009464&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-melocoton-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiMelocoton_1.png?v=1745009464&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-melocoton-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiMelocoton_1.png?v=1745009464&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-melocoton-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiMelocoton_1.png?v=1745009464&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-melocoton-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiMelocoton_1.png?v=1745009464&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-merken-cacho-de-cabra-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiMerkenCachodecabra.png?v=1744690903&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-merken-cacho-de-cabra-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiMerkenCachodecabra.png?v=1744690903&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-merken-cacho-de-cabra-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiMerkenCachodecabra.png?v=1744690903&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-merken-cacho-de-cabra-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiMerkenCachodecabra.png?v=1744690903&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-merken-cacho-de-cabra-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiMerkenCachodecabra.png?v=1744690903&width=1946 | Visually reviewed and mapped.

Aji Melocoton and Aji Merken Cacho de Cabra each have six mapped stages. Seed and seedling anatomy follows the pepper references. The production build and all 44 focused gallery checks passed.

Rasmussen Growth Batch 10 deployed at a7277ed (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44611964339).

## Rasmussen Growth Batch 11

- Rasmussen | aji-norteno-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://www.tomatenfluesterer.at/cdn/shop/files/Aji-Norteno-Pepper-DER-TOMATENFLUSTERER-59467044.jpg?v=1700311746&width=1445 | Visually reviewed and mapped.
- Rasmussen | aji-norteno-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://www.tomatenfluesterer.at/cdn/shop/files/Aji-Norteno-Pepper-DER-TOMATENFLUSTERER-59467044.jpg?v=1700311746&width=1445 | Visually reviewed and mapped.
- Rasmussen | aji-norteno-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://www.tomatenfluesterer.at/cdn/shop/files/Aji-Norteno-Pepper-DER-TOMATENFLUSTERER-59467044.jpg?v=1700311746&width=1445 | Visually reviewed and mapped.
- Rasmussen | aji-norteno-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://www.tomatenfluesterer.at/cdn/shop/files/Aji-Norteno-Pepper-DER-TOMATENFLUSTERER-59467044.jpg?v=1700311746&width=1445 | Visually reviewed and mapped.
- Rasmussen | aji-norteno-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://www.tomatenfluesterer.at/cdn/shop/files/Aji-Norteno-Pepper-DER-TOMATENFLUSTERER-59467044.jpg?v=1700311746&width=1445 | Visually reviewed and mapped.
- Rasmussen | aji-panca-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Aji_Panca_Chilli_Seeds_10_seeds_c1fc2a4d-5bb2-414c-86cf-f3da46075fb7.png?v=1751492101 | Visually reviewed and mapped.
- Rasmussen | aji-panca-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Aji_Panca_Chilli_Seeds_10_seeds_c1fc2a4d-5bb2-414c-86cf-f3da46075fb7.png?v=1751492101 | Visually reviewed and mapped.
- Rasmussen | aji-panca-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Aji_Panca_Chilli_Seeds_10_seeds_c1fc2a4d-5bb2-414c-86cf-f3da46075fb7.png?v=1751492101 | Visually reviewed and mapped.
- Rasmussen | aji-panca-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Aji_Panca_Chilli_Seeds_10_seeds_c1fc2a4d-5bb2-414c-86cf-f3da46075fb7.png?v=1751492101 | Visually reviewed and mapped.
- Rasmussen | aji-panca-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/Aji_Panca_Chilli_Seeds_10_seeds_c1fc2a4d-5bb2-414c-86cf-f3da46075fb7.png?v=1751492101 | Visually reviewed and mapped.

Aji Norteno and Aji Panca each have six mapped stages. Seed and seedling anatomy follows the pepper references. The production build and all 44 focused gallery checks passed.

Rasmussen Growth Batch 11 deployed at efc5044 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44614332583).

## Rasmussen Growth Batch 12

- Rasmussen | aji-peanut-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiPeanut.png?v=1744626251&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-peanut-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiPeanut.png?v=1744626251&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-peanut-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiPeanut.png?v=1744626251&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-peanut-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiPeanut.png?v=1744626251&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-peanut-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiPeanut.png?v=1744626251&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-pineapple-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://www.barney.dk/cdn/shop/files/Aji-Pineapple.jpg?v=1759526551 | Visually reviewed and mapped.
- Rasmussen | aji-pineapple-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://www.barney.dk/cdn/shop/files/Aji-Pineapple.jpg?v=1759526551 | Visually reviewed and mapped.
- Rasmussen | aji-pineapple-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://www.barney.dk/cdn/shop/files/Aji-Pineapple.jpg?v=1759526551 | Visually reviewed and mapped.
- Rasmussen | aji-pineapple-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://www.barney.dk/cdn/shop/files/Aji-Pineapple.jpg?v=1759526551 | Visually reviewed and mapped.
- Rasmussen | aji-pineapple-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://www.barney.dk/cdn/shop/files/Aji-Pineapple.jpg?v=1759526551 | Visually reviewed and mapped.

Aji Peanut and Aji Pineapple each have six mapped stages. Seed and seedling anatomy follows the pepper references. The production build and all 44 focused gallery checks passed.

Rasmussen Growth Batch 12 deployed at ed1d220 (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44616572201).

## Rasmussen Growth Batch 13

- Rasmussen | aji-rojo-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/9784C412-B965-4B90-9F3B-785D7B3D606F_42474444-e3e7-449b-ad0d-756ff2382154.png?v=1759100146&width=533 | Visually reviewed and mapped.
- Rasmussen | aji-rojo-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/9784C412-B965-4B90-9F3B-785D7B3D606F_42474444-e3e7-449b-ad0d-756ff2382154.png?v=1759100146&width=533 | Visually reviewed and mapped.
- Rasmussen | aji-rojo-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/9784C412-B965-4B90-9F3B-785D7B3D606F_42474444-e3e7-449b-ad0d-756ff2382154.png?v=1759100146&width=533 | Visually reviewed and mapped.
- Rasmussen | aji-rojo-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/9784C412-B965-4B90-9F3B-785D7B3D606F_42474444-e3e7-449b-ad0d-756ff2382154.png?v=1759100146&width=533 | Visually reviewed and mapped.
- Rasmussen | aji-rojo-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/9784C412-B965-4B90-9F3B-785D7B3D606F_42474444-e3e7-449b-ad0d-756ff2382154.png?v=1759100146&width=533 | Visually reviewed and mapped.
- Rasmussen | aji-sparkly-white-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/C1F7D06D-C83B-4DD1-AC36-13A3A3C12B53.png?v=1743915870&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-sparkly-white-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/C1F7D06D-C83B-4DD1-AC36-13A3A3C12B53.png?v=1743915870&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-sparkly-white-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/C1F7D06D-C83B-4DD1-AC36-13A3A3C12B53.png?v=1743915870&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-sparkly-white-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/C1F7D06D-C83B-4DD1-AC36-13A3A3C12B53.png?v=1743915870&width=1946 | Visually reviewed and mapped.
- Rasmussen | aji-sparkly-white-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/C1F7D06D-C83B-4DD1-AC36-13A3A3C12B53.png?v=1743915870&width=1946 | Visually reviewed and mapped.

Aji Rojo and Aji Sparkly White each have six mapped stages. Seed and seedling anatomy follows the pepper references. The production build and all 44 focused gallery checks passed.

Rasmussen Growth Batch 13 deployed at ed404ac (https://github.com/Archil3s/Blenheim-Garden/actions/runs/44618713630).

## Rasmussen Growth Batch 14

- Rasmussen | aji-strawberry-drop-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiStrawberryDrop_b55133b5-56e7-4709-91be-b8793b9c246c.png?v=1759100149 | Visually reviewed and mapped.
- Rasmussen | aji-strawberry-drop-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiStrawberryDrop_b55133b5-56e7-4709-91be-b8793b9c246c.png?v=1759100149 | Visually reviewed and mapped.
- Rasmussen | aji-strawberry-drop-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiStrawberryDrop_b55133b5-56e7-4709-91be-b8793b9c246c.png?v=1759100149 | Visually reviewed and mapped.
- Rasmussen | aji-strawberry-drop-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiStrawberryDrop_b55133b5-56e7-4709-91be-b8793b9c246c.png?v=1759100149 | Visually reviewed and mapped.
- Rasmussen | aji-strawberry-drop-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/AjiStrawberryDrop_b55133b5-56e7-4709-91be-b8793b9c246c.png?v=1759100149 | Visually reviewed and mapped.
- Rasmussen | anaheim-chilli-seeds-10-seeds | seed | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/CB453B1B-D409-4157-96A5-40E74C8C669A.png?v=1743918180&width=1946 | Visually reviewed and mapped.
- Rasmussen | anaheim-chilli-seeds-10-seeds | first-sprout | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/CB453B1B-D409-4157-96A5-40E74C8C669A.png?v=1743918180&width=1946 | Visually reviewed and mapped.
- Rasmussen | anaheim-chilli-seeds-10-seeds | baby-plant | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/CB453B1B-D409-4157-96A5-40E74C8C669A.png?v=1743918180&width=1946 | Visually reviewed and mapped.
- Rasmussen | anaheim-chilli-seeds-10-seeds | semi-mature | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/CB453B1B-D409-4157-96A5-40E74C8C669A.png?v=1743918180&width=1946 | Visually reviewed and mapped.
- Rasmussen | anaheim-chilli-seeds-10-seeds | pre-harvest | 512 px master and 128 px gallery | https://rasmussengardens.co.nz/cdn/shop/files/CB453B1B-D409-4157-96A5-40E74C8C669A.png?v=1743918180&width=1946 | Visually reviewed and mapped.

Aji Strawberry Drop and Anaheim each have six mapped stages. Seed and seedling anatomy follows the pepper references. The production build and all 44 focused gallery checks passed.
