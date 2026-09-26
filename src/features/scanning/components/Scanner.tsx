import { useState, useRef, useEffect, useCallback } from "react";
import { X, Zap, ZapOff, CheckCircle, Scan, AlertCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { useScannedProduct } from "../hooks/useScannedProduct";
import { calcularPuntuacion } from "@/shared/lib/scoring/scoringManager";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/shared/components/ui/badge";

// ZXing web reader
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { NotFoundException, BarcodeFormat, DecodeHintType } from "@zxing/library";

interface ScannerProps {
  onClose: () => void;
  onScanComplete: (barcode: string) => void; // now we just forward barcode
}

/**
 * Hook que encapsula la lógica híbrida de escaneo (Web y Nativo).
 *
 * - Web: usa ZXing + getUserMedia con mejores constraints (FPS/AF/AE/AWB) y linterna
 * - Nativo: puente con ReactNative WebView o Capacitor (mensajes postMessage)
 *
 * Optimiza:
 * - Debounce de lecturas duplicadas para evitar disparos múltiples
 * - Auto-stop tras detectar un código (evita consumo de CPU innecesario)
 * - Control de linterna cuando el dispositivo lo soporta
 */
function useHybridScanner(videoRef: React.RefObject<HTMLVideoElement>, onDetected: (code: string) => void) {
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [platform, setPlatform] = useState<"web" | "react-native-webview" | "capacitor" | "unknown">("unknown");
  const [torchOn, setTorchOn] = useState(false);
  const nativeMessageHandlerRef = useRef<any>(null);
  const lastCodeRef = useRef<string>("");
  const lastScanAtRef = useRef<number>(0);
  const DEBOUNCE_MS = 1200; // evita duplicados en ráfaga

  useEffect(() => {
    // Detect platform
    const isReactNativeWebView = !!(window && (window as any).ReactNativeWebView);
    const isCapacitor = !!(window && (window as any).Capacitor);
    if (isReactNativeWebView) setPlatform("react-native-webview");
    else if (isCapacitor) setPlatform("capacitor");
    else setPlatform("web");

    return () => {
      // cleanup if mounted
      stopWeb();
      removeNativeListener();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------- Web implementation (ZXing) -------------------- */
  const startWeb = async () => {
    try {
      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader();
        // Configurar hints para mejorar lectura de EAN/UPC y GS1
        try {
          const hints = new Map();
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
            BarcodeFormat.CODE_128,
            BarcodeFormat.CODE_39,
            BarcodeFormat.QR_CODE,
          ]);
          // @ts-ignore - API acepta hints en algunos readers
          readerRef.current.hints = hints;
        } catch { }
      }

      // request camera
      const videoConstraints: any = {
        facingMode: "environment",
        // Ajustes conservadores que suelen funcionar bien en móviles
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30, max: 60 },
        // Algunas apps móviles respetan estos advanced constraints (no estandarizadas)
        advanced: [
          { focusMode: "continuous" },
          { exposureMode: "continuous" },
          { whiteBalanceMode: "continuous" },
        ],
      };
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints as MediaTrackConstraints,
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => { }); // ignore autoplay block
        setCameraReady(true);
      }

      // Start decode loop from video device; undefined lets ZXing pick default
      controlsRef.current = await readerRef.current.decodeFromVideoDevice(undefined, videoRef.current!, (result, err) => {
        if (result) {
          const code = result.getText();
          const now = Date.now();
          // Debounce de duplicados
          if (code === lastCodeRef.current && now - lastScanAtRef.current < DEBOUNCE_MS) return;
          lastCodeRef.current = code;
          lastScanAtRef.current = now;
          // Auto-stop para ahorrar batería/CPU; la UI reinicia si el usuario quiere escanear otro
          try { controlsRef.current?.stop(); } catch { }
          onDetected(code);
        } else if (err && !(err instanceof NotFoundException)) {
          // log other errors pero no romper el loop por NotFound (normal)
          console.error("ZXing scanning error:", err);
        }
      });
    } catch (e) {
      console.error("startWeb error:", e);
      setCameraReady(false);
      throw e;
    }
  };

  const stopWeb = () => {
    try {
      try { controlsRef.current?.stop(); } catch { }
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      streamRef.current = null;
      setCameraReady(false);
      setTorchOn(false);
    } catch (e) {
      console.warn("stopWeb cleanup error:", e);
    }
  };

  const toggleWebTorch = async (on: boolean) => {
    try {
      const stream = streamRef.current;
      if (!stream) return false;
      const track = stream.getVideoTracks()[0];
      // some browsers expose torch via applyConstraints advanced
      // not widely supported, try/catch
      const capabilities: any = (track.getCapabilities && track.getCapabilities()) || {};
      if (capabilities.torch) {
        await track.applyConstraints({ advanced: [{ torch: on } as any] } as any);
        setTorchOn(on);
        return true;
      }
      return false;
    } catch (e) {
      console.warn("toggleWebTorch failed:", e);
      return false;
    }
  };

  /* -------------------- Native integration helpers -------------------- */
  const nativeMessageHandler = (ev: MessageEvent) => {
    // Expect messages from native containing the scanned code
    try {
      const data = typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data;
      if (!data) return;
      if (data.type === "BARCODE_SCANNED" && data.code) {
        const code = String(data.code);
        const now = Date.now();
        if (code === lastCodeRef.current && now - lastScanAtRef.current < DEBOUNCE_MS) return;
        lastCodeRef.current = code;
        lastScanAtRef.current = now;
        onDetected(code);
      }
      // you can handle other native messages here
    } catch (e) {
      console.warn("nativeMessageHandler parse error:", e);
    }
  };

  const addNativeListener = () => {
    removeNativeListener();
    // For React Native WebView, messages are delivered via 'message' event on window
    window.addEventListener("message", nativeMessageHandler);
    nativeMessageHandlerRef.current = nativeMessageHandler;
  };

  const removeNativeListener = () => {
    if (nativeMessageHandlerRef.current) {
      window.removeEventListener("message", nativeMessageHandlerRef.current);
      nativeMessageHandlerRef.current = null;
    }
  };

  const startNative = async () => {
    addNativeListener();
    // Try React Native WebView bridge first
    if ((window as any).ReactNativeWebView && (window as any).ReactNativeWebView.postMessage) {
      // Send a message to native side to open native scanner (ML Kit)
      (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: "START_BARCODE_SCANNER" }));
      return;
    }

    // Try Capacitor plugin call example (you must implement plugin on native side)
    if ((window as any).Capacitor && (window as any).Capacitor.Plugins && (window as any).Capacitor.Plugins.BarcodeScanner) {
      try {
        // Example contract: plugin returns when scanned via callback (implementation on native side required)
        await (window as any).Capacitor.Plugins.BarcodeScanner.startScanner();
        // native side should post message back to webview or trigger window.postMessage with result
      } catch (e) {
        console.warn("Capacitor BarcodeScanner start failed:", e);
      }
      return;
    }

    console.warn("Native bridge not found. Implement ReactNative WebView postMessage or a Capacitor plugin.");
  };

  const stopNative = async () => {
    // Tell native to stop scanning
    if ((window as any).ReactNativeWebView && (window as any).ReactNativeWebView.postMessage) {
      (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: "STOP_BARCODE_SCANNER" }));
    }
    if ((window as any).Capacitor && (window as any).Capacitor.Plugins && (window as any).Capacitor.Plugins.BarcodeScanner) {
      try {
        await (window as any).Capacitor.Plugins.BarcodeScanner.stopScanner();
      } catch (e) {
        // ignore
      }
    }
    removeNativeListener();
  };

  /* Unified start/stop that picks implementation based on detected platform */
  const start = async () => {
    if (platform === "web") {
      await startWeb();
    } else {
      await startNative();
    }
  };

  const stop = async () => {
    if (platform === "web") {
      stopWeb();
    } else {
      await stopNative();
    }
  };

  const toggleTorch = async (): Promise<boolean> => {
    if (platform === "web") {
      const ok = await toggleWebTorch(!torchOn);
      if (!ok) console.warn("Torch not supported on this device/browser.");
      return ok;
    } else {
      // Request native side to toggle torch (native must handle)
      if ((window as any).ReactNativeWebView && (window as any).ReactNativeWebView.postMessage) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: "TOGGLE_TORCH" }));
        return true;
      } else if ((window as any).Capacitor && (window as any).Capacitor.Plugins && (window as any).Capacitor.Plugins.BarcodeScanner) {
        try {
          await (window as any).Capacitor.Plugins.BarcodeScanner.toggleTorch();
          return true;
        } catch (e) {
          console.warn("Capacitor toggleTorch error:", e);
          return false;
        }
      } else {
        console.warn("Native torch toggle not available.");
        return false;
      }
    }
  };

  return {
    start,
    stop,
    platform,
    cameraReady,
    toggleTorch,
    torchOn,
  };
}

/* -------------------- Scanner component (UI preserved) -------------------- */
// Componente de UI del escáner. Mantiene la presentación y orquesta el flujo del hook.
export const Scanner = ({ onClose, onScanComplete }: ScannerProps) => {
  // Nota: reflejamos el estado local de la linterna, sincronizado con el hook
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [cameraReadyStatus, setCameraReadyStatus] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const didAutoStartRef = useRef<boolean>(false);
  const navigate = useNavigate();

  // Hook para buscar producto por id (EAN)
  const { product, loading: productLoading, error: productError, fetchProduct } = useScannedProduct();

  // Hook: handles web/native scanning internals
  const { start, stop, platform, cameraReady, toggleTorch, torchOn } = useHybridScanner(
    videoRef,
    async (barcode: string) => {
      setScanning(false);

      // Mostrar código detectado de forma inmediata
      setScanResult({
        ean: barcode,
        name: "Código detectado",
        isNew: false,
        confidence: 100,
      });

      console.log("Código detectado:", barcode);

      // Limpiar errores previos
      setError("");

      try {
        // Obtener producto real
        const productData = await fetchProduct(barcode);

        if (!productData) {
          // Producto no encontrado
          setError("Producto no encontrado");
          console.warn(`Código ${barcode} no corresponde a ningún producto`);
          return;
        }

        // Producto cargado correctamente
        console.log("Producto cargado:", productData);

        // Guardar el producto en el estado
        setScanResult({
          ...productData,
        });

        // Calcular puntuación
        // const scoringResult = await calcularPuntuacion(productData);
        // console.log("Resultado de scoring:", scoringResult);

        // // Guardar resultado en estado local
        // setScanResult({
        //   ...productData,
        //   scoring: scoringResult,
        // });

      } catch (err) {
        setError("Error al buscar el producto");
        console.error("Error buscando producto:", err);
      }
    }
  );

  // Keep cameraReady state in local UI state
  useEffect(() => setCameraReadyStatus(cameraReady), [cameraReady]);

  // Auto-iniciar escaneo al entrar cuando la plataforma ya está detectada
  useEffect(() => {
    if (didAutoStartRef.current) return;
    if (platform === "unknown") return;
    if (scanning || scanResult) return;
    didAutoStartRef.current = true;
    startScanning();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform]);

  // Start/stop scanning actions
  const startScanning = async () => {
    setError("");
    try {
      await start();
      setScanning(true);
    } catch (e) {
      console.error("Failed to start scanning:", e);
      setError("No se pudo iniciar el escaneo. Verifica permisos y disponibilidad de la cámara.");
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    try {
      await stop();
    } catch (e) {
      console.warn("stop scanner error:", e);
    } finally {
      setScanning(false);
    }
  };

  const handleToggleFlash = async () => {
    // toggle both local state and underlying implementation
    try {
      const ok = await toggleTorch();
      if (ok) setIsFlashOn((prev) => !prev);
      else setError("La linterna no está soportada en este dispositivo/navegador.");
    } catch (e) {
      console.warn("toggle flash failed:", e);
      setError("No fue posible cambiar la linterna en este dispositivo.");
    }
  };

  // UI action when user wants to retry scanning another product
  const handleScanAnother = async () => {
    setScanResult(null);
    setError("");
    await stopScanning();
    // small delay to ensure camera re-initializes on some browsers/devices
    setTimeout(() => startScanning(), 250);
  };

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Función para parsear arrays JSON
  const parseJsonArray = (jsonString: string | null): string[] => {
    if (!jsonString) return [];
    try {
      return JSON.parse(jsonString);
    } catch {
      return [];
    }
  };

  // Justo dentro de Scanner, antes del return
  const brands = scanResult ? parseJsonArray(scanResult.brands_tags) : [];
  const labels = scanResult ? parseJsonArray(scanResult.labels_tags) : [];

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
      {/* Encabezado: cierre y control de linterna / plataforma */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        <button onClick={onClose} className="p-2 bg-black/40 backdrop-blur-sm rounded-full text-white hover:bg-black/60 transition-colors">
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2">
          <div className="text-xs text-white/60 mr-2">{platform.toUpperCase()}</div>
          <button onClick={handleToggleFlash} className="p-2 bg-black/40 backdrop-blur-sm rounded-full text-white hover:bg-black/60 transition-colors">
            {isFlashOn ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Vista de cámara y marco de escaneo: sustituimos el marco cuadrado por un rectángulo ancho (guía visual). Ocupa casi todo el ancho del móvil, más ancho que alto; sólo referencia visual */}
      <div className="relative w-full h-screen bg-gray-900 flex items-center justify-center">
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
        <div className="absolute inset-0 bg-black/20">
          {/* Overlay y marco animado (rectángulo ancho) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Rectángulo de guía visual: más ancho que alto, casi todo el ancho */}
              <div className="relative mx-auto w-[92vw] max-w-[28rem] h-[34vw] max-h-[14rem] rounded-3xl border-2 border-white/40">
                {/* Overlay fuera del marco (opcional, para oscurecer entorno) */}
                <div className="absolute inset-0 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.15)] pointer-events-none"></div>

                {/* Zona interior clara y nítida */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {/* Esquinas decorativas */}
                  <div className="absolute -top-1 -left-1 w-16 h-10 border-t-4 border-l-4 border-primary rounded-tl-2xl"></div>
                  <div className="absolute -top-1 -right-1 w-16 h-10 border-t-4 border-r-4 border-primary rounded-tr-2xl"></div>
                  <div className="absolute -bottom-1 -left-1 w-16 h-10 border-b-4 border-l-4 border-primary rounded-bl-2xl"></div>
                  <div className="absolute -bottom-1 -right-1 w-16 h-10 border-b-4 border-r-4 border-primary rounded-br-2xl"></div>

                  {/* {scanning && (
                  // Línea animada de escaneo vertical con Framer Motion
                  <motion.div
                    className="absolute left-0 w-full h-[2px] bg-primary"
                    initial={{ y: 0, opacity: 0.2 }}
                    animate={{ y: '100%', opacity: [0.2, 0.5, 0.8, 0.5, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                )} */}

                  {/* Icono inicial cuando no se escanea */}
                  {/* {!scanning && !scanResult && !isProcessing && (
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Scan className="w-8 h-8 text-white/60" />
                    </div>
                  )} */}
                </div>
              </div>

              <p className="text-white text-center mt-6 px-4 text-lg font-medium">
                {!cameraReadyStatus ? "Inicializando cámara..." :
                  isProcessing ? "Buscando producto..." :
                    scanResult ? "Producto detectado" :
                      "Posiciona el código de barras en el marco"}
              </p>

              {error && (
                <Alert className="mt-4 bg-red-900/50 border-red-500 text-white">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <AnimatePresence>
            {scanResult && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 200 }}
                className="absolute bottom-0 left-0 right-0 p-4 pt-20 bg-gradient-to-t from-background via-background to-transparent"
              >
                <div className="max-w-md mx-auto">

                  {/* Tarjeta de producto */}
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6"
                  >
                    <Card className="overflow-hidden bg-card/90 backdrop-blur-sm border-border">
                      <CardContent className="p-4">
                        <div className="relative flex items-start gap-4">
                          {/* Imagen del producto */}
                          <div className="relative flex-shrink-0">
                            <img
                              src={scanResult.image_url || "/placeholder.svg"}
                              alt={scanResult.product_name}
                              className="w-20 h-20 object-contain rounded-xl bg-white shadow-sm p-2"
                              onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                            />
                          </div>

                          {/* Info producto */}
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h1 className="text-lg font-bold text-foreground mb-1 line-clamp-2 leading-tight">
                              {scanResult.product_name}
                            </h1>
                            {brands.length > 0 && (
                              <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                                {brands[0]?.split(":")[1]?.replace(/^./, (c) => c.toUpperCase())}
                              </p>
                            )}
                          </div>

                          {/* Puntuación posicionada horizontalmente, alineada con el nombre/marca */}
                          {scanResult.calculated_score !== undefined && (
                            <div className="absolute right-[18%] top-4 flex items-center gap-1">
                              <span className={`w-3 h-3 rounded-full ${scanResult.calculated_score === undefined || scanResult.calculated_score === null
                                ? "bg-gray-400"
                                : scanResult.calculated_score >= 75
                                  ? "bg-green-600"
                                  : scanResult.calculated_score >= 50
                                    ? "bg-green-500"
                                    : scanResult.calculated_score >= 25
                                      ? "bg-orange-400"
                                      : "bg-red-600"
                              }`}></span>
                              <span className="font-semibold text-foreground">
                                {scanResult.calculated_score ?? "-"}/100
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Botón Ver producto */}
                        <Button
                          className="w-full mt-4"
                          onClick={() => navigate(`/supplement/${scanResult.ean}`)}
                        >
                          Ver producto
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Botón Escanear Otro */}
                  <div className="space-y-3">
                    <Button variant="outline" size="lg" className="w-full" onClick={handleScanAnother}>
                      Escanear Otro Producto
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={onClose}>
                      Cerrar Scanner
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Eliminado el botón inferior de iniciar/detener escaneo según requisito.
          La funcionalidad de auto-inicio ya está gestionada por el efecto del componente. */}
    </div>
  );
};
