# Localhost API access — 21 October 2026

## Current UI update

The setup panels, proxy toggle, runner download and response import controls were removed at the user’s request. Transport is automatic: public URLs use the proxy, local URLs use the browser. Connection failures show a brief message. The earlier implementation notes below describe the preceding version.

Verified the simplified UI with a public GET returning 200 OK and a localhost URL showing no setup panels. TypeScript, targeted lint, and 58 affected tests passed.

## Reported case

Production page: `https://pdf.msyn.in/api-client`. Target supplied by the user: localhost port `8080`; the API route and certificate were not supplied.

Browser reproduction on the deployed page:

- Proxy request to `http://localhost:8080/` was rejected with the existing public-port restriction.
- Direct HTTP request timed out after 30 seconds.
- Direct request to `https://localhost:8080/` returned `Failed to fetch`. The browser did not reveal a reliable underlying cause. This result alone cannot distinguish TLS trust, CORS, permission, connection, or server problems.

No browser certificate warnings were bypassed and no development CA was installed in Windows or the browser. Port 3000 belonged to another application, so the fixed project was previewed separately on port 3001.

## Changes

- Recognized localhost, loopback IPv4/IPv6, private LAN literals, and `.local` names now select direct browser transport regardless of the saved public-proxy preference. The public proxy's private-address restrictions remain intact.
- Local fetches explicitly use CORS mode and declare local address-space intent for supporting browsers. This does not grant permission, bypass CORS, or disable TLS verification.
- Added an in-tool setup panel showing the current page origin, required methods/header names for CORS configuration, local-network permission information, and certificate/hostname requirements. For production, the origin is `https://pdf.msyn.in`.
- Generic browser fetch errors no longer pretend to diagnose CORS specifically. The UI identifies the possible causes and the browser's diagnostic limit.
- Added a downloadable one-request Node.js 20+ runner for loopback targets only. It opens no server, requires no packages, validates TLS, and accepts a caller-supplied CA/certificate PEM using `--ca`. It preserves method, Unicode body, headers and request length, bounds time/response size, follows only same-origin loopback redirects, and refuses to overwrite an existing output file.
- Added local JSON response import, with format/size validation and a visible source label. This file is read in the browser; it is not sent through MSYN.
- Downloaded request scripts intentionally include the current request, including any authentication. The UI explains that the file must be kept private. The runner does not change system trust or set `NODE_TLS_REJECT_UNAUTHORIZED=0`.

## Verification

- **10 new tests passed**, including execution of the actual generated runner in separate Node processes against temporary real HTTP/HTTPS loopback servers.
- HTTP server with no CORS headers: successful DELETE, exact Unicode/special-character payload and correct byte length.
- Self-signed HTTPS without a trusted CA: rejected.
- The same HTTPS endpoint with the supplied test CA: successful response.
- Trusted CA with a hostname mismatch: rejected.
- Existing response file: preserved; overwrite refused.
- Public lookalike hosts, malformed response imports, and public/direct request options checked.
- **200 tests passed across all 25 suites** after these changes. TypeScript and targeted lint passed. Production build passed (90 generated pages).
- Browser preview: entering `https://localhost:8080/` automatically disabled the proxy and exposed setup instructions. Runner download succeeded; the downloaded `.mjs` passed `node --check`.
- Browser response import displayed 200 and the synthetic fixture's expected JSON. This was explicitly an import fixture, not a successful live response from the user's port 8080.

The production deployment has not been changed. The actual service on port 8080 still needs its route, CORS policy, certificate trust, and browser permissions configured, or the local runner must be used with that service's own CA/certificate.

## Using the runner after deployment

1. Enter the full URL, e.g. `https://localhost:8080/your-api-route`.
2. Expand **Run locally without browser CORS** and choose **Download local runner**.
3. Run `node msyn-local-request.mjs --ca "C:\path\localhost-ca.pem" --out response.json`. For HTTP, omit `--ca`; for HTTPS use the CA/certificate that belongs to your own local API. The certificate must cover the hostname used.
4. Choose **Import local response** and select the generated JSON file.

Browser setup references: [Chrome Local Network Access](https://developer.chrome.com/blog/local-network-access), [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS), [MDN local network access](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Local_network_access).

## Browser connection regression fixed

Removed the forced targetAddressSpace: local fetch option, which mismatched the loopback destination in the tested browser. Standard CORS fetch now returns 200 OK for http://localhost:8000/api/v1/equity/golden-cross from the local API client (56 ms, 6.4 KB). Browser response contains the expected JSON. This verifies local preview only; production deployment and untrusted TLS were not changed. TypeScript, lint, and 42 request/local integration tests passed.

## Next.js targets without CORS headers

Both http://localhost:3000/ and http://192.168.0.210:3000/ returned 200 HTML without Access-Control-Allow-Origin; direct browser fetch could not read them. Added a same-origin, development-only local request transport. It accepts localhost and private literal IP addresses only, validates origin and local page hostname, preserves TLS validation, bounds request/response sizes and duration, and does not follow redirects. The public production proxy remains unchanged. Both addresses now return 200 in the API client (18 ms localhost; 39 ms LAN). These are HTML root pages. Four new transport tests and 32 request tests pass.

## Server-only HTTP transport

Removed the direct browser HTTP fallback. All HTTP Send actions now POST to /api/proxy (public destinations) or /api/local-request (local destinations). Confirmed both routes in Next.js server logs and successful browser responses. In production the local route returns an explicit local-agent-required error instead of attempting to access the hosting server loopback or calling the target from the browser. This change has not been deployed by this task. 36 request and development-local tests passed.
