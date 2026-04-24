/// <reference types="vite/client" />
interface ImportMetaEnv {
 readonly VITE_UPLOAD_TO_MYSQL: string;
 readonly VITE_LOAD_FROM_MYSQL: string;
}
interface ImportMeta {
 readonly env: ImportMetaEnv;
}