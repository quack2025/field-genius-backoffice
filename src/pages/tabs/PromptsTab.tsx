import { useState } from "react";
import { Save, Play } from "lucide-react";
import {
  updateImplementation,
  testVisionPrompt,
  testExtraction,
  type Implementation,
} from "../../lib/api";

interface Props {
  implId: string;
  impl: Implementation;
}

export function PromptsTab({ implId, impl }: Props) {
  const [visionPrompt, setVisionPrompt] = useState(
    impl.vision_system_prompt
  );
  const [segPrompt, setSegPrompt] = useState(
    impl.segmentation_prompt_template
  );
  const [saving, setSaving] = useState(false);

  // Test vision
  const [testImageUrl, setTestImageUrl] = useState("");
  const [testVisionResult, setTestVisionResult] = useState("");
  const [testingVision, setTestingVision] = useState(false);

  // Test extraction
  const [testText, setTestText] = useState("");
  const [testSchemaStr, setTestSchemaStr] = useState("");
  const [testExtResult, setTestExtResult] = useState("");
  const [testingExt, setTestingExt] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateImplementation(implId, {
        vision_system_prompt: visionPrompt,
        segmentation_prompt_template: segPrompt,
      });
      alert("Prompts guardados");
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  const handleTestVision = async () => {
    if (!testImageUrl) return alert("Ingresa URL de imagen");
    setTestingVision(true);
    setTestVisionResult("");
    try {
      const r = await testVisionPrompt(testImageUrl, visionPrompt);
      setTestVisionResult(r.data.description);
    } catch (err: unknown) {
      setTestVisionResult(
        "Error: " + (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setTestingVision(false);
    }
  };

  const handleTestExtraction = async () => {
    if (!testText || !testSchemaStr) return alert("Ingresa texto y schema");
    setTestingExt(true);
    setTestExtResult("");
    try {
      const schema = JSON.parse(testSchemaStr);
      const r = await testExtraction(testText, schema);
      setTestExtResult(
        r.data.parsed
          ? JSON.stringify(r.data.parsed, null, 2)
          : r.data.raw
      );
    } catch (err: unknown) {
      setTestExtResult(
        err instanceof SyntaxError
          ? "JSON del schema invalido"
          : "Error: " + (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setTestingExt(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Vision Prompt */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-700 mb-3">
          Vision System Prompt
        </h3>
        <p className="text-xs text-gray-500 mb-2">
          Instrucciones para Claude Sonnet al analizar fotos de campo.
        </p>
        <textarea
          value={visionPrompt}
          onChange={(e) => setVisionPrompt(e.target.value)}
          rows={10}
          className="w-full border rounded px-3 py-2 text-sm font-mono"
        />

        {/* Test vision */}
        <div className="mt-4 p-3 bg-gray-50 rounded space-y-2">
          <p className="text-xs font-medium text-gray-600">Probar prompt</p>
          <div className="flex gap-2">
            <input
              value={testImageUrl}
              onChange={(e) => setTestImageUrl(e.target.value)}
              placeholder="URL de imagen publica"
              className="flex-1 border rounded px-3 py-1.5 text-sm"
            />
            <button
              onClick={handleTestVision}
              disabled={testingVision}
              className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 disabled:opacity-50"
            >
              <Play size={14} />{" "}
              {testingVision ? "Analizando..." : "Probar"}
            </button>
          </div>
          {testVisionResult && (
            <pre className="bg-white border rounded p-3 text-xs font-mono overflow-auto max-h-48 whitespace-pre-wrap">
              {testVisionResult}
            </pre>
          )}
        </div>
      </div>

      {/* Segmentation Prompt */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-700 mb-3">
          Segmentation Prompt Template
        </h3>
        <p className="text-xs text-gray-500 mb-2">
          Template para agrupar archivos en visitas. Placeholders:{" "}
          <code className="bg-gray-100 px-1 rounded">
            {"{implementation_name}"}
          </code>
          ,{" "}
          <code className="bg-gray-100 px-1 rounded">
            {"{visit_type_options}"}
          </code>
          ,{" "}
          <code className="bg-gray-100 px-1 rounded">
            {"{consolidated_context}"}
          </code>
        </p>
        <textarea
          value={segPrompt}
          onChange={(e) => setSegPrompt(e.target.value)}
          rows={10}
          className="w-full border rounded px-3 py-2 text-sm font-mono"
        />
      </div>

      {/* Test Extraction */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-700 mb-3">
          Probar Extraccion
        </h3>
        <p className="text-xs text-gray-500 mb-2">
          Pega un texto de ejemplo y un schema JSON para probar la extraccion
          estructurada.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Texto de ejemplo (transcripcion, descripcion de imagen...)"
            rows={6}
            className="border rounded px-3 py-2 text-sm"
          />
          <textarea
            value={testSchemaStr}
            onChange={(e) => setTestSchemaStr(e.target.value)}
            placeholder='{"implementation":"...","categories":[...]}'
            rows={6}
            className="border rounded px-3 py-2 text-sm font-mono"
          />
        </div>
        <div className="mt-2 flex justify-end">
          <button
            onClick={handleTestExtraction}
            disabled={testingExt}
            className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 disabled:opacity-50"
          >
            <Play size={14} /> {testingExt ? "Extrayendo..." : "Probar"}
          </button>
        </div>
        {testExtResult && (
          <pre className="mt-3 bg-gray-50 border rounded p-3 text-xs font-mono overflow-auto max-h-64 whitespace-pre-wrap">
            {testExtResult}
          </pre>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 bg-brand-500 text-white px-5 py-2 rounded text-sm font-medium hover:bg-brand-600 disabled:opacity-50"
        >
          <Save size={16} /> {saving ? "Guardando..." : "Guardar prompts"}
        </button>
      </div>
    </div>
  );
}
