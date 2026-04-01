/** Spanish labels for session status values */
export const STATUS_LABELS: Record<string, string> = {
  accumulating: "Acumulando",
  segmenting: "Segmentando",
  processing: "Procesando",
  generating_outputs: "Generando salidas",
  completed: "Completado",
  needs_clarification: "Requiere aclaracion",
  failed: "Fallido",
  awaiting_confirmation: "Esperando confirmacion",
};

export const STATUS_COLORS: Record<string, string> = {
  accumulating: "bg-blue-50 text-blue-700",
  segmenting: "bg-yellow-50 text-yellow-700",
  processing: "bg-orange-50 text-orange-700",
  generating_outputs: "bg-purple-50 text-purple-700",
  completed: "bg-emerald-50 text-emerald-700",
  needs_clarification: "bg-red-50 text-red-700",
  failed: "bg-red-50 text-red-700",
  awaiting_confirmation: "bg-amber-50 text-amber-700",
};
