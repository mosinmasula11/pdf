# REST API Client test report

Tested on 18 October 2026 at `http://localhost:3000/api-client` using the in-app browser. Requests used public demo/echo endpoints and synthetic payloads and credentials. No application implementation was changed during this audit.

## Live checks

| Check | Result | Evidence |
| --- | --- | --- |
| Default GET | Pass | JSONPlaceholder returned 200 and five posts. |
| POST JSON | Pass | JSONPlaceholder returned 201 with the submitted fields and id 101. |
| PUT / PATCH / DELETE | Pass | HTTPBin returned 200 and echoed each method and JSON payload. |
| HEAD | Pass | 200 with response headers and an empty body. |
| OPTIONS | Pass | 200 with response headers and an empty body. |
| URL-encoded body | Pass | HTTPBin echoed `qa=hello & नमस्ते` without corruption. |
| Raw body | Pass | Sent `QA raw payload` to HTTPBin. |
| Bearer authentication | Pass | Echo contained the synthetic bearer Authorization header. |
| Basic authentication, ASCII | Pass | Echo contained the expected Base64 Authorization header. |
| API key in query | Pass | Echo contained `X-API-Key=qa-synthetic-key`. |
| Custom request header | Pass | HTTPBin echoed `X-Qa-Test: rest-client-check`. |
| Direct browser mode | Pass | Proxy disabled; JSONPlaceholder returned 200 and five posts. |
| Five built-in presets | Pass | JSONPlaceholder GET/POST, HTTPBin headers, ReqRes single user, and GitHub octocat all returned successful responses. |
| HTTP error | Pass | HTTPBin status endpoint displayed 404 NOT FOUND. |
| Invalid URL | Pass | Displayed status 0 and the URL parsing error without crashing. |
| Pretty / Raw / Headers views | Pass | Response body and response header values displayed. |
| Copy response | Pass | Clipboard contained the 1,420-character response. |
| Download response | Pass | Downloaded JSON parsed independently: five entries, first id 1. |
| JSON formatting error | Warning | Beautify reports malformed JSON, but Send still transmits it. This may be useful for negative API tests; the behavior should be explicit. |
| Collection save and reload | Partial | Name, method, and URL restored, but raw body was lost. |
| Unicode Basic authentication | Fail | Entering `परीक्षण` as username immediately crashed the page with InvalidCharacterError from btoa. Reload recovered the page. |
| Generated form-body code | Fail | cURL omitted the URL-encoded body that the actual request sent. Shared code generation omits it for all six languages. |
| Generated query-auth code | Fail | cURL omitted the API key query parameter present in the actual request. Shared code generation uses the uncompiled URL for all languages. |
| Generated raw JavaScript | Fail | Produced `body: JSON.stringify(QA raw payload)`; independent `node --check` failed with SyntaxError. |
| Query parameter synchronization | Fail | Changing the URL to a URL without a query left `_limit=5` displayed in Params. |
| History across methods | Fail | PUT, PATCH, DELETE, HEAD, OPTIONS, and POST to the same URL replaced each other; history deduplicates solely by URL. |

## Repair priorities

1. **High: unrestricted server proxy.** `src/app/api/proxy/route.ts` accepts an arbitrary caller-supplied URL and follows redirects with no destination checks or authentication. On a public deployment this exposes an open proxy and potential server-side request forgery to destinations reachable by the server. This is a source-review finding; internal services and metadata endpoints were not probed. Restrict protocols and destinations, validate resolved addresses and every redirect, and prevent DNS rebinding. Preserve support for local APIs through an explicitly controlled development configuration or direct browser mode.
2. **High: credentials retained automatically.** Both history and collections serialize bearer tokens, Basic passwords, API key values, and custom headers into plaintext localStorage. History does this automatically after a request. Avoid persisting secrets by default and clearly disclose any explicit opt-in credential storage. This is confirmed by the serialization code; only synthetic credentials were entered during testing.
3. **High: Unicode authentication crashes rendering.** `ApiClientTool.tsx:268` calls btoa on arbitrary Unicode. Code snippets are computed during rendering even when the Code Snippet tab is closed. Encode safely and surface supported-auth validation without throwing during render.
4. **Medium: unbounded requests and responses.** The proxy has no application timeout, request cancellation propagation, or response size limit; it buffers the entire response as text. The client provides no cancellation control. This is a source-review finding; intentionally oversized or indefinitely stalled endpoints were not exercised.
5. **Medium: request exports differ from sent requests.** Share URL/header/body compilation between Send and all snippet generators. Include query auth and URL-encoded fields. Quote raw text and language literals correctly; Python also currently inserts JSON booleans/null directly into Python source. Only the raw JavaScript syntax check and cURL omissions were independently reproduced; the other language escaping issues were identified by source review.
6. **Medium: raw body persistence.** Add raw body to the saved request model, history, collection serialization, and restore path.
7. **Medium: stale query table.** Clear Params when a URL has no query or an empty query, including preset changes. Editing a stale row currently reintroduces removed parameters.
8. **Medium: history loses distinct methods.** Include method and relevant request configuration in request identity, or retain chronological attempts rather than replacing all calls to the same URL.

## Limits and artifacts

This was a development-browser audit, not a production deployment or load test. API-key header placement, disabled row behavior, redirect handling, actual network timeouts, binary response fidelity, HTML preview isolation, and execution of every generated language snippet remain unverified. Existing unrelated workspace changes were preserved.

- Screenshot of reproduced Unicode crash: `C:/Users/mosin/.codex/visualizations/2026/10/18/01a14eff-00af-7142-b260-0250a51c5454/api-client-unicode-failure.jpg`.
- Generated raw JavaScript fixture: `.qa/api-raw-generated.js` (ignored test artifact).
- Download validated: `C:/Users/mosin/Downloads/response-1792331500587.json`.
- Disposable collection `QA disposable raw request` and synthetic request history remain available for reproducing the findings.
