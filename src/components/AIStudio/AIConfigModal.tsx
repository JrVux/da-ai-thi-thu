import React, { useState } from 'react';
import { 
  Sparkles, 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Save, 
  Activity, 
  Zap, 
  Clock,
  ShieldAlert
} from 'lucide-react';
import { AIProviderConfig, AILogEntry } from '../../types';
import { AIClientService } from '../../services/ai-client';
import { DBService } from '../../services/db';

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const AIConfigModal: React.FC<AIConfigModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [config, setConfig] = useState<AIProviderConfig>(() => AIClientService.getConfig());
  const [logs, setLogs] = useState<AILogEntry[]>(() => DBService.getAILogs());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    AIClientService.saveConfig(config);
    onShowToast('success', 'Đã lưu cấu hình AI', 'Chuỗi Fallback: Gemini -> OpenRouter -> DeepSeek');
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await AIClientService.executeWithFallback(
        'Hãy phản hồi ngắn gọn: "Kết nối AI thành công và sẵn sàng phục vụ khảo thí THPT."',
        'Test Connection'
      );
      setTestResult(`✅ Thành công qua: ${res.provider} (Độ trễ: ${res.latency}ms)\nNội dung: ${res.text}`);
      setLogs(DBService.getAILogs());
      onShowToast('success', 'Kiểm tra kết nối thành công', `Phục vụ bởi: ${res.provider}`);
    } catch (err: any) {
      setTestResult(`❌ Thất bại: ${err.message || String(err)}`);
      onShowToast('error', 'Lỗi kết nối AI', err.message);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 animate-scale-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-sky-500 text-white rounded-2xl shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Cấu Hình Module AI Khảo Thí</h3>
              <p className="text-xs text-slate-500">Chuỗi Fallback 3 tầng: Gemini → OpenRouter → DeepSeek</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-6 my-4 pr-1 flex-1">
          {/* Fallback Explanation Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              Cơ chế Fallback thông minh:
            </div>
            <p className="text-slate-600 leading-relaxed">
              Hệ thống sẽ thử gọi <strong>1. Gemini</strong> đầu tiên. Nếu hết hạn mức hoặc lỗi mạng, tự động chuyển sang <strong>2. OpenRouter</strong>, kế tiếp là <strong>3. DeepSeek</strong>, hoặc chuyển sang <strong>Offline Rule-based Engine</strong> để đảm bảo hoạt động không bị gián đoạn.
            </p>
          </div>

          {/* API Keys Form */}
          <form onSubmit={handleSave} className="space-y-4">
            {/* 1. Gemini */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-sky-600" />
                  1. Google Gemini API Key (Ưu tiên số 1)
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Model: gemini-1.5-flash</span>
              </label>
              <input
                type="password"
                value={config.gemini_api_key || ''}
                onChange={e => setConfig({ ...config, gemini_api_key: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
              />
            </div>

            {/* 2. OpenRouter */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-600" />
                  2. OpenRouter API Key (Fallback 1)
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Free & Low-cost tier</span>
              </label>
              <input
                type="password"
                value={config.openrouter_api_key || ''}
                onChange={e => setConfig({ ...config, openrouter_api_key: e.target.value })}
                placeholder="sk-or-v1-..."
                className="w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>

            {/* 3. DeepSeek */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-blue-600" />
                  3. DeepSeek API Key (Fallback 2)
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Model: deepseek-chat</span>
              </label>
              <input
                type="password"
                value={config.deepseek_api_key || ''}
                onChange={e => setConfig({ ...config, deepseek_api_key: e.target.value })}
                placeholder="sk-..."
                className="w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5 text-sky-600" />
                <span>{isTesting ? 'Đang kiểm tra...' : 'Kiểm Tra Kết Nối AI'}</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-adminNavy hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Cấu Hình</span>
              </button>
            </div>
          </form>

          {/* Test Result Message */}
          {testResult && (
            <div className="p-3.5 bg-slate-900 text-slate-200 rounded-2xl text-xs font-mono whitespace-pre-wrap animate-fade-in border border-slate-800">
              {testResult}
            </div>
          )}

          {/* AI Invocation Logs */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Lịch Sử Gọi AI Gần Đây ({logs.length})
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {logs.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic py-2">Chưa có lịch sử gọi AI.</p>
              ) : (
                logs.map(l => (
                  <div key={l.id} className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-[11px] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">[{l.provider}]</span>{' '}
                      <span className="text-slate-600">{l.task}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono">{l.duration_ms}ms</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        l.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {l.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
