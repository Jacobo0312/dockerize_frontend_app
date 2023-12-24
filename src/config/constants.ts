declare global {
    interface Window {
        _env_: { [key: string]: string };
    }
}

export const STAGE = import.meta.env.STAGE ?? window._env_.STAGE;
export const API_URL = import.meta.env.API_URL ?? window._env_.API_URL;
