# Dhruv — Site Change Requests (22 Oct 2026)

Source: WhatsApp thread with Dhruv Bafna, today 11:29am-12:23pm.

## Tribal Zone (`work/catalogue-at-scale.html`)
- [x] 1. ~~Hero video should match the referenced size and fill the entire space~~ **N/A — this was from yesterday's separate Shopify-preview thread, not the Vaelo site. Dropped.**
- [x] 2. Remove the "6X" stat — no literal "6X" existed; read together with item 9, interpreted as the Orders stat being wrong. Changed Orders `100X` → `500+`.
- [x] 3. Make a certain element larger so it takes up the whole space — fixed via item 6's grid merge (clips now flow straight into stills, no stranded small item).
- [x] 4. Add "Factory Commercial Shoot" to scope — done. (Factory video itself still needs the asset file — not yet supplied.)
- [x] 5. Remove "OC Maharera" / "Ready to move in", replace with revenue stat — **this was actually Marigold Miraaya's kpis, not Tribal Zone** (the exact kpi text matched Marigold). Corrected there: kpis now read "₹3.5 cr — Revenue generated with Meta ads and Social Media", brief copy also updated.
- [x] 6. Fix alignment — root cause found: clips and stills rendered in two separate grids, so a partial row could never be filled. Merged into one grid in `build-cases.py`; verified visually, no more gaps.
- [x] 7. Match Tribal Zone hero layout to Deon Tapes — confirmed by Smeet; resolved as part of the item 6 grid fix (both now flow cleanly).
- [ ] 8. Add "10 lakhs" figure — **still blocked, Dhruv sending Shopify screenshot to confirm**
- [x] 9. Change stat to "500+ orders" — done (see item 2).
- [ ] 10. Swap in new Tribal Zone videos/photos — **still blocked, waiting on Yash**
- [x] 11. Change a figure to "3k+" — this was DVOC Institute's Followers stat, not Tribal Zone (confirmed by position in thread). Changed `1500+` → `3k+`.

## DVOC Institute (`work/built-to-enroll.html`)
- [x] 12. Update scope to: Meta ads, WhatsApp bot, web design, social media — done.

## Zerolys (`work/make-the-science-legible.html`)
- [ ] 13. Add Zerolys website link, note "worked on in 2026" — **blocked, need the actual URL from Dhruv, wasn't included in the message**

## Site-wide
- [ ] 14. More content coming for one section — check alignment once added — **blocked, waiting on content**
- [ ] 15. Remove the "6 wala part" — the `work/conceptual.html` case study ("Vaelo Creative" / "6 Concepts produced"). **Still blocked on Yash's replacement assets.** Year field fixed to 2026 in the meantime (item 16).
- [x] 16. Replace "2025" with "2026" everywhere — done (DVOC, Zerolys, Vaelo Creative/conceptual, VOIZ all updated).

## Niti Bothra (`work/niti-bothra.html`)
- [x] 17. Either remove the single model photo or add 2 more — confirmed by Smeet it's the "Niti Bothra" page. Visually identified the lone photo (17.jpg, navy/gold kurta against stone wall) stranded alone in the last row. Removed it (no replacement assets on hand to add 2 more instead).

## To Dear Self (`work/to-dear-self.html`)
- [ ] 18. Update to "generated over 1 lakh in sales in one month, plus worked on their website" — **still blocked, waiting on Yash for replacement assets**
- [x] 19. Add "social media management" to scope — done.

## Marigold Miraaya (`work/marigold-miraaya.html`)
- [x] 20. Fix uneven gallery row spacing — same root cause and fix as item 6 (merged grid in `build-cases.py`). Verified visually clean top to bottom.

---

## Still blocked / waiting on Dhruv or Yash
- Item 8: Tribal Zone "10 lakhs" figure — Shopify screenshot pending
- Item 10: New Tribal Zone videos/photos — pending from Yash
- Item 13: Zerolys website URL — not yet provided
- Item 14: new content for alignment check — not yet sent
- Item 15: conceptual.html "6 concepts" section removal — replacement assets pending from Yash
- Item 18: To Dear Self sales-stat update — replacement assets pending from Yash

## Resolved open questions
1. "Remove the 6X" vs "remove the whole 6 wala part" — confirmed two separate items (2 and 15).
2. Still open: hold the 10 lakhs / 500+ orders figure until the Shopify screenshot, or proceed as typed?
