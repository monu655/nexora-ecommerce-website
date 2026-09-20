// Demo build only: swap the Axios transport for an in-memory implementation
// of the same REST contract, so the app can be hosted without a server
// attached. Wired statically (not via dynamic import()) — a dynamic import()
// compiles to a runtime `new URL(..., import.meta.url)` chunk lookup, which
// throws when the built file is opened directly as file:// instead of served
// over http(s). A static import has no such runtime resolution step.
import { api } from '@/services/api';
import { demoAdapter } from '@/demo/api';

api.defaults.adapter = demoAdapter;
