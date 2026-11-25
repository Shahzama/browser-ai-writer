export interface GPUCheck {
  supported: boolean;
  supportsF16: boolean;
  reason: string | null;
}

type GPUAdapterLike = { features: { has(name: string): boolean } };
type NavigatorWithGPU = Navigator & {
  gpu?: { requestAdapter(): Promise<GPUAdapterLike | null> };
};

export async function checkWebGPU(): Promise<GPUCheck> {
  const gpu = (navigator as NavigatorWithGPU).gpu;
  if (!gpu) {
    return {
      supported: false,
      supportsF16: false,
      reason:
        "This browser does not support WebGPU, which the AI needs. On a computer, use a recent Chrome or Edge. On a phone, use Chrome on Android 12 or newer, or Safari on iOS 26 or newer. You can still write and edit here.",
    };
  }

  try {
    const adapter = await gpu.requestAdapter();
    if (!adapter) {
      return {
        supported: false,
        supportsF16: false,
        reason:
          "WebGPU is available but no usable GPU was found. Turn on hardware acceleration in your browser settings or update your graphics drivers.",
      };
    }
    return { supported: true, supportsF16: adapter.features.has("shader-f16"), reason: null };
  } catch {
    return {
      supported: false,
      supportsF16: false,
      reason: "Could not access the GPU. Try reloading the page or restarting the browser.",
    };
  }
}
