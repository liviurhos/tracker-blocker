(function () {
  "use strict";

  // zgomot deterministic pentru sesiunea curenta a paginii - suficient
  // sa schimbe hash-ul rezultat, insuficient sa strice vizual continutul
  const sessionNoise = Math.random() > 0.5 ? 1 : -1;

  function noisifyImageData(imageData) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      if ((i / 4) % 97 === 0) {
        data[i] = Math.min(255, Math.max(0, data[i] + sessionNoise));
      }
    }
    return imageData;
  }

  try {
    const origGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function (...args) {
      const result = origGetImageData.apply(this, args);
      return noisifyImageData(result);
    };

    const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (...args) {
      try {
        const ctx = this.getContext("2d");
        if (ctx) {
          const imgData = origGetImageData.call(ctx, 0, 0, this.width, this.height);
          noisifyImageData(imgData);
          ctx.putImageData(imgData, 0, 0);
        }
      } catch (e) {
        // canvas tainted (cross-origin) sau alt caz special, lasam neschimbat
      }
      return origToDataURL.apply(this, args);
    };
  } catch (e) {}

  function spoofWebGL(proto) {
    try {
      const origGetParameter = proto.getParameter;
      proto.getParameter = function (param) {
        if (param === 37445) return "Google Inc.";
        if (param === 37446) return "ANGLE (Generic Renderer)";
        return origGetParameter.call(this, param);
      };
    } catch (e) {}
  }
  if (window.WebGLRenderingContext) spoofWebGL(WebGLRenderingContext.prototype);
  if (window.WebGL2RenderingContext) spoofWebGL(WebGL2RenderingContext.prototype);

  try {
    Object.defineProperty(Navigator.prototype, "hardwareConcurrency", { get: () => 8 });
  } catch (e) {}
  try {
    Object.defineProperty(Navigator.prototype, "deviceMemory", { get: () => 8 });
  } catch (e) {}
  try {
    if ("getBattery" in Navigator.prototype) {
      Navigator.prototype.getBattery = undefined;
    }
  } catch (e) {}

  try {
    if (window.AnalyserNode) {
      const origGetFloatFrequencyData = AnalyserNode.prototype.getFloatFrequencyData;
      AnalyserNode.prototype.getFloatFrequencyData = function (array) {
        origGetFloatFrequencyData.call(this, array);
        for (let i = 0; i < array.length; i += 50) {
          array[i] += (Math.random() - 0.5) * 0.0001;
        }
      };
    }
  } catch (e) {}
})();
