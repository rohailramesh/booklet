/// <reference types="vite/client" />
declare module '@teckel/vue-barcode-reader' {
  import { DefineComponent } from 'vue'

  export const StreamBarcodeReader: DefineComponent<
    Record<string, unknown>,
    Record<string, unknown>,
    any
  >
}
