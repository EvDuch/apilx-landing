# APILX CSS Modules

These files are a mechanical split of `../styles.css` for safer maintenance.
The production pages still load `../styles.css` as one bundled stylesheet, so
the static landing does not pay the extra request and cascade cost of runtime
`@import` chains.

Keep this order if the modules are ever bundled into `styles.css` again:

1. `00-base.css`
2. `01-header-nav.css`
3. `02-hero.css`
4. `03-globe-map.css`
5. `04-calculator.css`
6. `05-faq.css`
7. `06-footer.css`
8. `07-responsive.css`
9. `08-modals-lead-dialog.css`
10. `09-catalog.css`
11. `10-benefits.css`
12. `11-calculator-modern.css`
13. `12-background-referral-updates.css`
14. `13-final-overrides.css`

`13-final-overrides.css` intentionally contains late cascade fixes and risky
legacy overrides. Move rules out of it only after visual verification.
