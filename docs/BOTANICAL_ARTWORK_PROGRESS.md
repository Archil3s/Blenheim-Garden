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
