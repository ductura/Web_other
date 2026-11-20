// The app is served under /o (D-306 t. 1: `/o/` web-other behind one origin).
// Next adds the base path to <Link>, router and redirect(); fetch() does not,
// so calls from the browser to this app's own routes go through api().
export const BASE_PATH = "/o";
export const api = (putanja) => `${BASE_PATH}/api${putanja}`;
