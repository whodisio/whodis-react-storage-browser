import { redactSignature } from 'simple-jwt-auth';

import { isServerSideRendering } from '../../logic/env/isServerSideRendering';
import { deleteSynchronizationCookie } from '../../logic/synchronization/deleteSynchronizationCookie';
import { TOKEN_STORAGE_KEY } from './key';

export const setTokenToStorage = ({ token }: { token: string | null }) => {
  // ensure that we only try to set tokens on client side; tokens can only be properly set on client side - where the cookie is properly set for the user and the anti-csrf token is set in localstorage
  if (isServerSideRendering())
    throw new Error('attempted to set token on server side'); // fail fast, as this should never occur and is a problem with our code if it does

  // if the token is not signature redacted, throw an error - should never occur - since if this does, its an XSS vulnerability
  if (token && token !== redactSignature({ token }))
    throw new Error(
      'non-signature-redacted token was attempted to be saved by client-side javascript. should not be occurring',
    ); // fail fast if this occurs; this should be handled by whodis-client already and never should occur

  // set the value of the token into local storage
  localStorage.setItem(TOKEN_STORAGE_KEY, token ?? 'null');

  // and, if the token was being removed, wipe out the synchronization cookie too, so the server-side will be aware of this too
  if (token === null) deleteSynchronizationCookie();

  // last, emit an event about this occurring
};
