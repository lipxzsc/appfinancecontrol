<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Monthly PDF and CSV reports share `computeReportBalances`; add registered investment principal to the existing operations balance without adding estimated yield twice.
- Local Pro activation is development-only; production entitlement must come from verified backend payment events because browser storage is user-controlled.
- Finance cloud hydration must never seed after a failed read and blocks writes until hydration succeeds, preventing financial data overwrite.
- CSV exports neutralize formula-leading text through the shared CSV escaper because spreadsheet quoting alone is unsafe.
