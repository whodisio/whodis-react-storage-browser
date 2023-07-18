# whodis-react-storage-browser

A secure auth token storage mechanism for whodis-react in browser.

Supports both serverside and clientside rendering.

![ci_on_commit](https://github.com/whodisio/whodis-react-storage-browser/workflows/ci_on_commit/badge.svg)
![deploy_on_tag](https://github.com/whodisio/whodis-react-storage-browser/workflows/deploy_on_tag/badge.svg)

# install

```sh
npm install --save whodis-react-storage-browser
```

# use

Please see the [whodis-react](https://github.com/whodisio/whodis-react) package for instructions on how to use this browser storage mechanism.

# nuances

### cookie based authentication -vs- local development

Cookies are used in the web environment because they are the only way to securely store an auth token in a browser.

- `HTTPOnly` flag prevents javascript from accessing the cookie, protecting the token against XSS attacks.
- `Secure` flag prevents the token from being sent without HTTPS encryption, protecting the token against MITM attacks.
- `Same-Site` flag (+ additional server side validation) prevents the token from being sent from _any_ website, protecting the token against CSRF attacks.

So, using a cookie is a fundamental requirement of securing an auth token in the browser. However, browsers have a lot of rules setup around cookies in order to protect users. There are two that affect us in local development specifically.

##### 1. website must be `same-site` in order for a browser to set and send a cookie

Browsers protect the user by making sure that the cookie is intended for the website it is sent to - and that the cookie is only sent to the intended website. These are critical to the security of cookies - but do add some extra complexity to working with cookies in local development. Specifically:

- if the domain of the cookie does not match the domain of the website that the cookie was sent to, the browser will not set it.
- if the domain of the api that the website is contacting does not match the domain of the cookie, the browser will not send it.
- if the domain of the api that the website is contacting does not match the domain of the website, the browser will not send the cookie.

In order to solve for this for local development, while still making sure that `development` and `production` environments are as similar as possible, you can ask your local computer's DNS to forward requests from `localhost.yourdomain.com` to `localhost`.

For example, on UNIX machines, if your website is `yourdomain.com`, [add the following line](https://unix.stackexchange.com/a/421500/77522) to `/etc/hosts` to access your site from `localhost.yourdomain.com`:

```
127.0.0.1       localhost.yourdomain.com
```

##### 2. website must be served over HTTPS in order for the browser to send the cookie

Browsers support a `secure` flag on cookies which eliminates the potential of man-in-the-middle (MITM) attacks. When this flag is set on a cookie, the cookie will not be sent to a server over HTTP - nor will the cookie be sent from a website served over HTTP.

In order to solve this for local development, while still making sure that `development` and `production` environments are as similar as possible, you can serve your website on localhost through HTTPS.

For example, on UNIX machines, if your website is `yourdomain.com` you can easily generate a self signed certificate for `localhost.yourdomain.com` [with the following](https://letsencrypt.org/docs/certificates-for-localhost/):

```sh
openssl req -x509 -out localhost.crt -keyout localhost.key \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost.yourdomain.com' -extensions EXT -config <( \
   printf "[dn]\nCN=localhost.yourdomain.com\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost.yourdomain.com\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
```

### server side rendering

Special consideration is to support server-side rendering frameworks, like Next.JS.

The auth-token is not accessible from the browser's storage mechanisms (e.g., localStorage, cookieStorage) when in server-side-rendering. Therefore, we have to load the token securely into your app's context from the headers of the request payload your server gets.

To do that, this library exposes the `loadAuthenticationFromSSRReq` method.

For example, generically:

```ts
import { loadAuthenticationFromSSRReq } from 'whodis-react-storage-browser';

// ... somewhere with access to `req` ...
loadAuthenticationFromSSRReq({ req });
```

For example, for Next.JS specifically:

```ts
import { loadAuthenticationFromSSRReq } from 'whodis-react-storage-browser';

export const getServerSideProps = async ({ req }) => {
  loadAuthenticationFromSSRReq({ req });
};
```
