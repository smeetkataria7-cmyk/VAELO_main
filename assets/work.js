/* ==========================================================================
   VAELO — work data. One object per case study.
   Add a project here, then run `python3 build-cases.py` to regenerate
   the pages in /work. Nothing else needs editing.
   ========================================================================== */
window.VAELO_WORK = [
  {
    slug: 'launch-not-a-rollout',
    idx: '01',
    title: 'Launch, Not a Rollout',
    cat: 'D2C',
    scope: 'Brand + Performance',
    year: '2026',
    client: 'Confidential — D2C personal care',
    tile: 't-a',
    summary: 'A new range with a fixed launch date, no existing audience, and a category where everything looks the same on shelf and identical in feed.',
    brief: 'The client had a finished product, a hard launch date and no audience. The category is crowded with brands that all resolved to the same visual language — soft pastels, sans-serif wordmark, a claim nobody reads. A staged rollout would have burned the launch window before anyone noticed the product existed.',
    did: 'We built the identity and the packaging system first, because the pack is the ad in a category people meet on a shelf. Then the full launch asset library was produced in-house — product, lifestyle and UGC-style video — so the Meta buy launched against creative we made ourselves. One team held the positioning from the first sketch to the third round of ad iterations, which is why the test loop closed in days rather than weeks.',
    kpis: [['240', 'Assets shipped'], ['9 days', 'Concept to live'], ['4', 'Channels at launch']]
  },
  {
    slug: 'marigold-miraaya',
    idx: '02',
    title: 'Marigold Miraaya',
    cat: 'Real Estate',
    scope: 'Film + Social Campaign',
    year: '2026',
    client: 'Marigold Miraaya by K H Jogani',
    tile: 'tall',
    summary: 'A completed Mumbai tower with its OC in hand, sold on how the evenings feel rather than on the floor plan.',
    brief: 'Marigold Miraaya had reached the point most developments treat as the finish line \u2014 OC received, ready to move in, MahaRERA P51800003669. The category answers that moment with specification: carpet area, configuration, possession date. None of it tells a buyer what living there is actually like, and every competing listing reads the same way.',
    did: 'We shot the building the way residents use it and built the campaign around moments rather than amenities \u2014 carrom in the indoor games room, a couple in the poolside cabana, families in the water at the same hour. The line carries the argument: Evenings Well Spent. Unwind. Together. Something for Everyone. The specification and the RERA number stay on the pack where they belong; the campaign sells the evening.',
    kpis: [['OC', 'Received'], ['P51800003669', 'MahaRERA'], ['Ready', 'To move in']],
    images: { hero: '', gallery: ['assets/work/marigold-miraaya/film.mp4'] }
  },
  {
    slug: 'catalogue-at-scale',
    idx: '03',
    title: 'Catalogue at Scale',
    cat: 'Fashion',
    scope: 'AI Production',
    year: '2025',
    client: 'Confidential — apparel label',
    tile: 't-c',
    summary: 'A catalogue too large to shoot conventionally inside the season it was meant to sell in.',
    brief: 'Hundreds of SKUs, a season that would be over before a traditional shoot schedule finished, and a brand team who would reject anything that looked synthetic. The constraint was never cost — it was calendar.',
    did: 'We stood up an AI production pipeline for product and lifestyle imagery with a consistency specification tight enough to pass the brand team\'s own review: fixed lighting logic, a locked colour response, and a per-SKU checklist. Everything that failed review went back through the pipeline rather than into a reshoot.',
    kpis: [['1 season', 'Delivered in-window'], ['100%', 'Brand-review pass'], ['0', 'Reshoots']]
  },
  {
    slug: 'built-to-enroll',
    idx: '04',
    title: 'Built to Enroll',
    cat: 'Ed-Tech',
    scope: 'Content Systems',
    year: '2025',
    client: 'Confidential — ed-tech platform',
    tile: 't-d',
    summary: 'Strong course outcomes, and a content operation that could not keep pace with the enrolment calendar.',
    brief: 'Enrolment runs to a calendar that does not move. The content operation did move — deadlines slipped, approvals stalled in inboxes, and trend-driven swaps arrived too late to make the window they were meant to catch.',
    did: 'We designed the system before producing anything: a content calendar with real stage gates, an approval flow with named owners, and a change log so a trend swap is a recorded decision rather than a lost message. Then we produced against it through two full intake cycles to prove it held under load.',
    kpis: [['2', 'Intake cycles run'], ['7 stages', 'Idea to posted'], ['0', 'Missed windows']]
  },
  {
    slug: 'make-the-science-legible',
    idx: '05',
    title: 'Make the Science Legible',
    cat: 'Sustainable Packaging',
    scope: 'Design',
    year: '2025',
    client: 'Confidential — materials company',
    tile: 't-e',
    summary: 'A genuinely sustainable material story that customers could not read off the pack in three seconds.',
    brief: 'The sustainability claim was real, third-party verified, and buried. It sat below an ingredient list, in a typographic hierarchy that gave equal weight to everything — which is the same as giving weight to nothing.',
    did: 'We rebuilt the pack hierarchy so the claim lands before the ingredient list, with an iconography set that carries the science without a paragraph of explanation. The system was drawn to scale across the full range, including the smallest format, where most pack systems quietly fall apart.',
    kpis: [['3 sec', 'Claim comprehension target'], ['1 system', 'Full range'], ['SKU-min', 'Tested at smallest format']]
  }
];
