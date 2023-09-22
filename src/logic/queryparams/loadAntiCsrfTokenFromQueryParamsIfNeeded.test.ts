import { getError, given, then, when } from 'test-fns';
import { createUrl } from 'url-fns';

import { getCurrentUrl } from '../env/getCurrentUrl';
import { isServerSideRendering } from '../env/isServerSideRendering';
import { setCurrentUrl } from '../env/setCurrentUrl';
import { setTokenToStorage } from '../storage/setTokenToStorage';
import { loadAntiCsrfTokenFromQueryParamsIfNeeded } from './loadAntiCsrfTokenFromQueryParamsIfNeeded';

jest.mock('../env/isServerSideRendering');
const isServerSideRenderingMock = isServerSideRendering as jest.Mock;

jest.mock('../env/getCurrentUrl');
const getCurrentUrlMock = getCurrentUrl as jest.Mock;

jest.mock('../storage/setTokenToStorage');
const setTokenToStorageMock = setTokenToStorage as jest.Mock;

jest.mock('../env/setCurrentUrl');
const setCurrentUrlMock = setCurrentUrl;

describe('loadAntiCsrfTokenFromQueyParamsIfNeeded', () => {
  beforeEach(() => jest.resetAllMocks());

  given('running on server', () => {
    beforeEach(() => {
      isServerSideRenderingMock.mockReturnValue(true);
    });
    when('called', () => {
      then('throws an error', () => {
        const error = getError(() =>
          loadAntiCsrfTokenFromQueryParamsIfNeeded(),
        );
        expect(error.message).toContain(
          'should not have attempted to load anti-csrf-token from queryparams on serverside',
        );
      });
    });
  });

  given('running on device', () => {
    beforeEach(() => {
      isServerSideRenderingMock.mockReturnValue(false);
    });

    when('no anti-csrf-token in queryparams', () => {
      beforeEach(() => {
        getCurrentUrlMock.mockReturnValue(
          createUrl({ path: 'some/path', queryParams: { no: 'nothin' } }),
        );
      });

      it('should do nothing', () => {
        loadAntiCsrfTokenFromQueryParamsIfNeeded();

        expect(setTokenToStorageMock).not.toHaveBeenCalled();
        expect(setCurrentUrlMock).not.toHaveBeenCalled();
      });
    });

    when('has anti-csrf-token in queryparams', () => {
      beforeEach(() => {
        getCurrentUrlMock.mockReturnValue(
          createUrl({
            path: 'some/path',
            queryParams: { otherparam: 'value', acsrft: '__anti_csrf_token__' },
          }),
        );
      });

      it('should set the token to storage', () => {
        loadAntiCsrfTokenFromQueryParamsIfNeeded();

        expect(setTokenToStorageMock).toHaveBeenCalled();
        expect(setTokenToStorageMock).toHaveBeenCalledWith({
          token: '__anti_csrf_token__',
        });
      });
      it('should replace the token from url', () => {
        loadAntiCsrfTokenFromQueryParamsIfNeeded();

        expect(setCurrentUrlMock).toHaveBeenCalled();
        expect(setCurrentUrlMock).toHaveBeenCalledWith({
          method: 'replace',
          to: '/some/path?otherparam=value', // without the anticsrf token param
        });
      });
    });
  });
});
