import { parseUrl, updateUrl } from 'url-fns';

import { getCurrentUrl } from '../env/getCurrentUrl';
import { isServerSideRendering } from '../env/isServerSideRendering';
import { setCurrentUrl } from '../env/setCurrentUrl';
import { setTokenToStorage } from '../storage/setTokenToStorage';

const EXPECTED_ANTICSRFTOKEN_QUERY_PARAMETER_KEY = 'acsrft'; // https://github.com/whodisio/svc-gateway/blob/bb0221d049d6d979adb4f9c3710e291fbd42f75c/src/contract/handlers/oidc/oidcGoogleRedirect.ts#L58

/**
 * tactic: load anti-csrf-token defined in query params, if needed
 * context:
 * - some auth methods, e.g. oidc redirect, return the anti-csrf-token via query params rather than in the body of a payload
 * - in these situations, we must load the anti-csrf-token into local storage before attempting to use it
 * strategy:
 * - detect whether an anti-csrf-token was returned via query params
 * - load the token from query params into local storage if needed
 * - replace the url history to cleanup the url and prevent endless invocation
 */
export const loadAntiCsrfTokenFromQueryParamsIfNeeded = (): void => {
  // if on server side, this is should not have been called
  if (isServerSideRendering())
    throw new Error(
      'should not have attempted to load anti-csrf-token from queryparams on serverside',
    );

  // otherwise, detect whether the current url has an anti-csrf-token defined
  const urlCurrent = getCurrentUrl();
  const antiCsrfTokenFound =
    parseUrl(urlCurrent).queryParams[
      EXPECTED_ANTICSRFTOKEN_QUERY_PARAMETER_KEY
    ] ?? null;
  if (!antiCsrfTokenFound) return;

  // if there was one found, set it into storage
  setTokenToStorage({ token: antiCsrfTokenFound }); // TODO: set into storage only if it is newer than the one already in storage

  // and wipe it from the existing url
  setCurrentUrl({
    method: 'replace',
    to: updateUrl({
      from: urlCurrent,
      with: {
        queryParams: {
          [EXPECTED_ANTICSRFTOKEN_QUERY_PARAMETER_KEY]: undefined,
        },
      },
    }),
  });
};
