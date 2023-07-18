import { EventStream } from 'event-stream-pubsub';

import { WhodisAuthTokenStorage } from '../domain/WhodisAuthTokenStorage';
import { getTokenFromStorage } from './storage/getTokenFromStorage';
import { setTokenToStorage } from './storage/setTokenToStorage';

export const onSetEventStream = new EventStream<undefined>();
export const onGetEventStream = new EventStream<undefined>();

export const storage: WhodisAuthTokenStorage = {
  get: async () => {
    const token = await getTokenFromStorage();
    await onGetEventStream.publish(undefined);
    return token;
  },
  set: async (token: string | null) => {
    await setTokenToStorage({ token });
    await onSetEventStream.publish(undefined);
  },
  on: {
    get: onGetEventStream,
    set: onSetEventStream,
  },
};
