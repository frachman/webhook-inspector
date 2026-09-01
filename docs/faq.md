# FAQ

## Does Hookbin replay or forward requests?

No. The current product captures requests for inspection. Replay, export, and
signature verification are not part of the current documented capability.

## Can I use Hookbin for production traffic?

No. Use it for debugging and controlled integration tests with safe data.
Endpoints and captures expire, and the request history is capped.

## Which request methods are supported?

`GET`, `POST`, `PUT`, `PATCH`, and `DELETE`.

## Is the viewer URL public?

The webhook URL is intended to be shared with the sender. The viewer token is
different and must remain private because it authorizes access to captures.

## What happens when an endpoint expires?

The endpoint stops accepting captures and is removed by scheduled cleanup. Its
captured requests are removed with it.
