export const setCurrentUrl = ({
  method,
  to,
}: {
  method: 'replace' | 'push';
  to: string;
}) => {
  const executable =
    method === 'replace'
      ? history.replaceState.bind(history)
      : history.pushState.bind(history);
  executable({}, window.document.title, to);
};
