declare global {
    interface Window {
        _env_: { [key: string]: string };
    }
}

export const ENV_TEST = import.meta.env.ENV_TEST ?? window._env_.ENV_TEST;
